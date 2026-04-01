"""Handler for real-time agent chat via gRPC."""

import logging

import ai_handlers
from agent_tools import build_chat_tools, run_agent_loop
from prompt_utils import (
    CHAT_BASE_INSTRUCTIONS,
    CHAT_HISTORY_INSTRUCTIONS,
    CHAT_NEWS_INSTRUCTIONS,
    CHAT_QUIZ_INSTRUCTIONS,
    CHAT_SUGGESTION_INSTRUCTIONS,
    TAGGED_CONTEXT_NOTE,
    compact_tagged_section,
    format_chat_goals,
    join_blocks,
    route_chat_request,
)

logger = logging.getLogger(__name__)

HISTORY_WINDOW = 8  # recent messages passed directly as conversation turns
MAX_TOKENS = 512


def handle_chat(user_message, user_profile, goals, history,
                from_context_summary="", user_id=None):
    """Process a chat message and return the assistant's response + suggestions.

    Args:
        user_message: The user's chat message.
        user_profile: User profile string (career, interests, etc.).
        goals: List of goal dicts with keys: title, description, smart_context,
               completed_items, total_items, active_items, goal_id, checklist_items.
        history: List of {role, content} dicts for the current session.
        from_context_summary: Optional context from a nag email link.
        user_id: The authenticated user's ID (for future use).

    Returns:
        Tuple of (response_text, suggestions_list).
        suggestions_list is a list of dicts with keys:
            suggestion_id, type, display_text, params_json.
    """
    # Split history: recent messages go directly into the conversation,
    # older messages stay available via the get_previous_messages tool.
    # Exclude the current user message (last entry) since run_agent_loop adds it.
    prior = history[:-1] if history else []
    recent_messages = prior[-HISTORY_WINDOW:]
    older_history = prior[:-HISTORY_WINDOW] if len(prior) > HISTORY_WINDOW else []

    routing = route_chat_request(
        user_message,
        context_summary=from_context_summary,
        older_history_exists=bool(older_history),
    )
    routing["recent_history_count"] = len(recent_messages)
    routing["older_history_available"] = bool(older_history)
    routing["mode"] = "tool" if routing["use_tool_path"] else "fast"

    capabilities = {
        "uses_tools": routing["use_tool_path"],
        "quiz": routing["use_tool_path"],
        "suggest": routing["suggest"],
        "news": routing["news"],
        "history": routing["history"],
    }
    system_prompt = _build_chat_prompt(
        user_profile,
        goals,
        from_context_summary,
        capabilities=capabilities,
    )

    logger.info(
        "Chat route: mode=%s suggest=%s news=%s history=%s recent_history=%d older_history=%s",
        routing["mode"],
        routing["suggest"],
        routing["news"],
        routing["history"],
        len(recent_messages),
        bool(older_history),
    )

    if not routing["use_tool_path"]:
        message = ai_handlers._call_claude_messages(
            recent_messages + [{"role": "user", "content": user_message}],
            MAX_TOKENS,
            "agent_chat_fast_path",
            system=system_prompt,
            client_obj=ai_handlers.client,
            model=ai_handlers.MODEL,
        )
        return _extract_text(message), []

    tool_context = {
        "goals": _build_tool_goals(goals),
        "conversation_history": older_history,
        "user_id": user_id,
        "_routing": routing,
    }

    active_tools = build_chat_tools(
        include_suggest=routing["suggest"],
        include_history=bool(older_history),
        include_news=routing["news"],
    )

    response_text = run_agent_loop(
        ai_handlers.client, ai_handlers.MODEL, system_prompt, tool_context,
        initial_message=user_message,
        max_tokens=MAX_TOKENS,
        max_iterations=7,
        prior_messages=recent_messages,
        tools=active_tools,
    )

    suggestions = tool_context.get("_suggestions", [])
    return response_text, suggestions


def _build_tool_goals(goals):
    tool_goals = []
    for goal in goals:
        checklist_items_raw = goal.get("checklist_items", [])
        if checklist_items_raw:
            items = [
                {
                    "checklistId": ci.get("checklist_id"),
                    "title": ci.get("title", ""),
                    "completed": ci.get("completed", False),
                    "completedAt": "recent" if ci.get("completed") else None,
                }
                for ci in checklist_items_raw
            ]
        else:
            items = []
            for title in goal.get("active_items", []):
                items.append({"title": title, "completed": False})
            for _ in range(goal.get("completed_items", 0)):
                items.append({"title": "completed", "completed": True, "completedAt": "recent"})

        tool_goals.append({
            "goalId": goal.get("goal_id"),
            "title": goal.get("title", ""),
            "description": goal.get("description", ""),
            "smartContext": goal.get("smart_context", ""),
            "checklistItems": items,
        })
    return tool_goals


def _build_chat_prompt(user_profile, goals, from_context_summary="", capabilities=None):
    capabilities = capabilities or {}
    instruction_blocks = [CHAT_BASE_INSTRUCTIONS]

    if capabilities.get("quiz"):
        instruction_blocks.append(CHAT_QUIZ_INSTRUCTIONS)
    if capabilities.get("suggest"):
        instruction_blocks.append(CHAT_SUGGESTION_INSTRUCTIONS)
    if capabilities.get("news"):
        instruction_blocks.append(CHAT_NEWS_INSTRUCTIONS)
    if capabilities.get("history"):
        instruction_blocks.append(CHAT_HISTORY_INSTRUCTIONS)

    closing = "Respond directly. Reply in markdown. No subject line."
    if capabilities.get("uses_tools"):
        closing = (
            "Use tools only when they materially help. "
            "Use get_user_progress for deeper goal details or accurate IDs before acting. "
            "Reply in markdown. No subject line."
        )

    return join_blocks(
        "\n\n".join(instruction_blocks),
        compact_tagged_section("user_profile", user_profile, 600),
        format_chat_goals(goals, limit=6),
        compact_tagged_section(
            "nag_context",
            from_context_summary,
            500,
            heading="The user arrived from an agent email. Recent nag context:",
        ),
        TAGGED_CONTEXT_NOTE,
        closing,
    )


def _extract_text(message):
    return "\n".join(
        block.text
        for block in getattr(message, "content", [])
        if getattr(block, "type", "text") == "text"
    ).strip()
