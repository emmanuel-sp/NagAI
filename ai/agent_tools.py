"""Shared tools and personalities for agent email and chat handlers."""

import logging

import web_search

logger = logging.getLogger(__name__)

TOOLS = [
    {
        "name": "get_user_progress",
        "description": "Get the user's goal progress including checklist completion status, SMART breakdown, and recent activity.",
        "input_schema": {
            "type": "object",
            "properties": {
                "goal_title": {
                    "type": "string",
                    "description": "Title of a specific goal to look up. If omitted, returns all goals.",
                },
            },
            "required": [],
        },
    },
    {
        "name": "get_previous_messages",
        "description": "Get older conversation history beyond what's already visible in the current chat window. Useful for recalling details from much earlier in a long conversation.",
        "input_schema": {
            "type": "object",
            "properties": {
                "limit": {
                    "type": "integer",
                    "description": "Max messages to retrieve (default 10).",
                },
            },
            "required": [],
        },
    },
    {
        "name": "search_news",
        "description": "Search for relevant news articles related to a topic. Only use if a relevant article would genuinely help the user.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search query for finding relevant news.",
                },
            },
            "required": ["query"],
        },
    },
]

PERSONALITY = {
    "nag": (
        "You are a direct, action-focused accountability partner. "
        "Your job is to move the user toward their next step — not to shame them for inaction. "
        "Never say 'it's been months' or dwell on how long they've waited. "
        "Instead, focus on what they CAN do right now. Be firm, short, and constructive. "
        "Always end with a specific, doable action."
    ),
    "motivation": (
        "You are a warm, perceptive coach who notices the details. "
        "Avoid generic encouragement and clichés ('you got this', 'believe in yourself'). "
        "Be specific — reference their actual tasks, progress, and situation. "
        "If they haven't started, reframe the journey in an energizing way."
    ),
    "guidance": (
        "You are a thoughtful strategic advisor. Offer ONE concrete, actionable insight — "
        "a framework, a reframe, or a prioritization suggestion. "
        "Don't try to cover everything. Go deep on one useful idea. "
        "Ask at most one question, and make it genuinely thought-provoking."
    ),
}

ANGLES = {
    "nag": [
        "Focus on the single smallest next step they could take today.",
        "Ask what specific obstacle is blocking them and suggest how to remove it.",
        "Challenge them to commit to just 15 minutes of focused work.",
        "Highlight what they stand to gain by starting this week.",
        "Reframe the goal as tiny wins and point to the first one.",
        "Acknowledge the difficulty, then redirect to one concrete action.",
    ],
    "motivation": [
        "Celebrate something specific they've done, even if small.",
        "Remind them of their original 'why' and connect it to today.",
        "Share an energizing perspective on their progress trajectory.",
        "Point out growth or learning they may not see in themselves.",
        "Connect their goal to the bigger picture of who they're becoming.",
        "Highlight the compounding effect of small consistent actions.",
    ],
    "guidance": [
        "Suggest a framework or mental model relevant to their goal.",
        "Challenge one assumption they might be making about their approach.",
        "Propose a small experiment they could try this week.",
        "Help them prioritize among their active tasks.",
        "Offer a strategic perspective on sequencing their next steps.",
        "Ask a thought-provoking question that reframes their approach.",
    ],
}


def execute_tool(tool_name, tool_input, context):
    """Execute a tool call and return the result string.

    context must contain:
      - "goal" (single goal dict) or "goals" (list of goal dicts)
      - "conversation_history" (list of {role, content, sentAt} dicts)
    """
    if tool_name == "get_user_progress":
        requested_title = tool_input.get("goal_title", "")

        # Support both single-goal (email) and multi-goal (chat) contexts
        goals = context.get("goals")
        if not goals:
            single = context.get("goal")
            goals = [single] if single else []

        if not goals:
            return "No goals found for this user."

        # If a specific title was requested, filter
        if requested_title:
            match = [g for g in goals if requested_title.lower() in g.get("title", "").lower()]
            if match:
                goals = match

        parts = []
        for goal in goals:
            items = goal.get("checklistItems", [])
            total = len(items)
            completed = sum(1 for i in items if i.get("completed"))
            active = [i["title"] for i in items if not i.get("completed")]
            recent = [i["title"] for i in items if i.get("completed") and i.get("completedAt")]

            part = f"Goal: {goal['title']}\n"
            if goal.get("description"):
                part += f"Description: {goal['description']}\n"
            if goal.get("smartContext"):
                part += f"SMART breakdown:\n{goal['smartContext']}\n"
            part += f"Progress: {completed}/{total} tasks complete\n"
            if recent:
                part += f"Recently completed: {', '.join(recent[-3:])}\n"
            if active:
                part += f"Still active: {', '.join(active[:5])}\n"
            parts.append(part)

        return "\n---\n".join(parts)

    elif tool_name == "get_previous_messages":
        history = context.get("conversation_history", [])
        if not history:
            return "No older messages beyond the current conversation window."
        limit = tool_input.get("limit", 10)
        lines = []
        for entry in history[-limit:]:
            role = entry.get("role", "agent")
            content = entry.get("content", "")[:300]
            sent_at = entry.get("sentAt", entry.get("createdAt", ""))
            prefix = f"[{sent_at}] " if sent_at else ""
            lines.append(f"{prefix}{role}: {content}")
        return "\n---\n".join(lines)

    elif tool_name == "search_news":
        query = tool_input.get("query", "")
        results = web_search.search_news(query)
        if not results:
            return "No relevant news found."
        lines = []
        for r in results[:3]:
            lines.append(f"- {r['title']}: {r['link']}\n  {r['snippet']}")
        return "\n".join(lines)

    return "Unknown tool."


def run_agent_loop(client, model, system_prompt, tool_context,
                   initial_message="Generate a personalized message for the user now.",
                   max_tokens=512, max_iterations=5, prior_messages=None):
    """Run the Claude tool-use loop. Returns the final text response.

    prior_messages: optional list of {"role": "user"|"assistant", "content": str}
        to prepend as conversation history before the initial_message.
    """
    import time

    messages = []
    if prior_messages:
        messages.extend(prior_messages)
    messages.append({"role": "user", "content": initial_message})
    loop_start = time.monotonic()
    total_input_tokens = 0
    total_output_tokens = 0

    for iteration in range(max_iterations):
        call_start = time.monotonic()
        response = client.messages.create(
            model=model,
            max_tokens=max_tokens,
            system=system_prompt,
            tools=TOOLS,
            messages=messages,
        )
        call_ms = round((time.monotonic() - call_start) * 1000, 1)
        total_input_tokens += response.usage.input_tokens
        total_output_tokens += response.usage.output_tokens

        tool_use_blocks = [b for b in response.content if b.type == "tool_use"]

        if not tool_use_blocks:
            text_blocks = [b.text for b in response.content if b.type == "text"]
            total_ms = round((time.monotonic() - loop_start) * 1000, 1)
            logger.info(
                "Agent loop complete: iterations=%d input_tokens=%d output_tokens=%d total_ms=%.1f",
                iteration + 1, total_input_tokens, total_output_tokens, total_ms,
            )
            return "\n".join(text_blocks)

        tool_names = ", ".join(b.name for b in tool_use_blocks)
        logger.info(
            "Agent loop iteration %d: %d tool call(s) [%s] latency_ms=%.1f",
            iteration + 1, len(tool_use_blocks), tool_names, call_ms,
        )

        messages.append({"role": "assistant", "content": response.content})

        tool_results = []
        for tool_block in tool_use_blocks:
            result = execute_tool(tool_block.name, tool_block.input, tool_context)
            tool_results.append({
                "type": "tool_result",
                "tool_use_id": tool_block.id,
                "content": result,
            })

        messages.append({"role": "user", "content": tool_results})

    total_ms = round((time.monotonic() - loop_start) * 1000, 1)
    logger.warning(
        "Agent loop hit max iterations (%d): input_tokens=%d output_tokens=%d total_ms=%.1f",
        max_iterations, total_input_tokens, total_output_tokens, total_ms,
    )
    return "I wanted to check in with you today. How are things going with your goals?"
