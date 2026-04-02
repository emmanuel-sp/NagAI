"""Shared tools and personalities for agent email and chat handlers."""

import json
import logging
import uuid

import web_search

logger = logging.getLogger(__name__)

GET_USER_PROGRESS_TOOL = {
    "name": "get_user_progress",
    "description": "Get goal progress and checklist IDs.",
    "input_schema": {
        "type": "object",
        "properties": {
            "goal_title": {
                "type": "string",
                "description": "Optional goal title filter.",
            },
        },
        "required": [],
    },
}

GET_PREVIOUS_MESSAGES_TOOL = {
    "name": "get_previous_messages",
    "description": "Get older chat messages outside the visible window.",
    "input_schema": {
        "type": "object",
        "properties": {
            "limit": {
                "type": "integer",
                "description": "Max messages to return.",
            },
        },
        "required": [],
    },
}

SEARCH_NEWS_TOOL = {
    "name": "search_news",
    "description": "Search timely news when current articles would help.",
    "input_schema": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "News search query.",
            },
        },
        "required": ["query"],
    },
}

GET_APP_HELP_TOOL = {
    "name": "get_app_help",
    "description": "Get a compact guide to how NagAI works and where features live in the app.",
    "input_schema": {
        "type": "object",
        "properties": {
            "topic": {
                "type": "string",
                "description": "Specific app-help topic to explain.",
                "enum": [
                    "overview",
                    "onboarding",
                    "goals",
                    "today",
                    "agents",
                    "digests",
                    "chat",
                    "navigation",
                ],
            },
        },
        "required": [],
    },
}

TOOLS = [GET_USER_PROGRESS_TOOL, GET_PREVIOUS_MESSAGES_TOOL, SEARCH_NEWS_TOOL]

QUIZ_TOOLS = [
    {
        "name": "present_quiz",
        "description": "Present one quiz card with clickable options.",
        "input_schema": {
            "type": "object",
            "properties": {
                "question": {
                    "type": "string",
                    "description": "Quiz question.",
                },
                "options": {
                    "type": "array",
                    "description": "2-6 clickable options.",
                    "items": {
                        "type": "object",
                        "properties": {
                            "label": {
                                "type": "string",
                                "description": "Option label.",
                            },
                            "description": {
                                "type": "string",
                                "description": "Optional short helper text.",
                            },
                        },
                        "required": ["label"],
                    },
                },
                "allow_free_response": {
                    "type": "boolean",
                    "description": "Show a free-text input.",
                },
                "free_response_placeholder": {
                    "type": "string",
                    "description": "Free-text placeholder.",
                },
            },
            "required": ["question", "options"],
        },
    },
]

SUGGEST_TOOLS = [
    {
        "name": "suggest_create_goal",
        "description": "Suggest a new goal, optionally with SMART fields and checklist items.",
        "input_schema": {
            "type": "object",
            "properties": {
                "title": {
                    "type": "string",
                    "description": "Goal title.",
                },
                "description": {
                    "type": "string",
                    "description": "Goal description.",
                },
                "specific": {
                    "type": "string",
                    "description": "SMART specific field.",
                },
                "measurable": {
                    "type": "string",
                    "description": "SMART measurable field.",
                },
                "attainable": {
                    "type": "string",
                    "description": "SMART attainable field.",
                },
                "relevant": {
                    "type": "string",
                    "description": "SMART relevant field.",
                },
                "timely": {
                    "type": "string",
                    "description": "SMART timely field.",
                },
                "target_date": {
                    "type": "string",
                    "description": "Optional ISO target date.",
                },
                "checklist_items": {
                    "type": "array",
                    "description": "Optional initial checklist items.",
                    "items": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string", "description": "Item title."},
                        },
                        "required": ["title"],
                    },
                },
            },
            "required": ["title"],
        },
    },
    {
        "name": "suggest_update_goal",
        "description": "Suggest updating an existing goal.",
        "input_schema": {
            "type": "object",
            "properties": {
                "goal_id": {"type": "integer", "description": "Goal ID."},
                "goal_title": {"type": "string", "description": "Current goal title."},
                "title": {"type": "string", "description": "New title."},
                "description": {"type": "string", "description": "New description."},
                "target_date": {"type": "string", "description": "New ISO target date."},
            },
            "required": ["goal_id", "goal_title"],
        },
    },
    {
        "name": "suggest_add_checklist_item",
        "description": "Suggest adding a checklist item to a goal.",
        "input_schema": {
            "type": "object",
            "properties": {
                "goal_id": {"type": "integer", "description": "Goal ID."},
                "goal_title": {"type": "string", "description": "Goal title."},
                "title": {"type": "string", "description": "Checklist item title."},
                "notes": {"type": "string", "description": "Optional notes."},
            },
            "required": ["goal_id", "goal_title", "title"],
        },
    },
    {
        "name": "suggest_complete_checklist_item",
        "description": "Suggest marking a checklist item complete.",
        "input_schema": {
            "type": "object",
            "properties": {
                "checklist_id": {"type": "integer", "description": "Checklist item ID."},
                "title": {"type": "string", "description": "Item title."},
            },
            "required": ["checklist_id", "title"],
        },
    },
]

APP_HELP_CONTENT = {
    "overview": [
        "NagAI is a goal accountability app that helps users turn intentions into SMART goals, checklists, daily plans, and follow-up support.",
        "Core areas: onboarding/profile context, goals, Today daily planning, digests, proactive agents, and follow-up chat.",
        "Use it for goal clarity, planning, accountability, and habit support rather than general off-topic assistant work.",
        "Agent emails are proactive check-ins tied to goals, while digests are scheduled content emails based on selected topics and cadence.",
    ],
    "onboarding": [
        "Onboarding collects life context, interests, hobbies, habits, and timezone so AI suggestions feel personal instead of generic.",
        "That profile context influences SMART goal suggestions, checklist ideas, planning help, and accountability messages.",
        "If the user is just getting started, onboarding is the first place to give NagAI enough context to help well.",
    ],
    "goals": [
        "The Goals area is for creating and managing SMART goals with titles, descriptions, optional target dates, and checklist items.",
        "NagAI can help define a goal, suggest SMART fields, review progress, and suggest next checklist steps.",
        "Use goals when the user wants a durable outcome to work toward, not just a one-off task for today.",
    ],
    "today": [
        "The Today area is the daily execution layer: it turns active goals and open checklist items into a focused day plan.",
        "It is meant for deciding what to work on now, alongside routines and lightweight day-level planning.",
        "Use Today when the user asks what to prioritize today or wants a short action plan from existing goals.",
    ],
    "agents": [
        "Agents are proactive accountability helpers attached to goals or contexts.",
        "They send email check-ins, nudges, and progress prompts without waiting for the user to start the conversation.",
        "Agent messages are about follow-up and accountability, not broad content curation.",
    ],
    "digests": [
        "Digests are scheduled emails with motivation, practical tips, and curated reading tied to the user's selected interests or topics.",
        "They are separate from agent check-ins: digests deliver content on a cadence, while agents proactively follow up on progress.",
        "Use digests when the user wants periodic reading or inspiration rather than accountability nudges.",
    ],
    "chat": [
        "Chat is for live follow-up: the user can ask about goals, progress, next steps, or questions triggered by an agent email.",
        "Chat can review goal progress, suggest next steps, present short quizzes, and queue action cards for goal or checklist changes.",
        "It should stay focused on goals, planning, accountability, and related app usage help.",
    ],
    "navigation": [
        "/home is the dashboard for high-level status and system summaries.",
        "/goals is where goals and checklist-backed progress live.",
        "/today is the daily planning view for current execution.",
        "/digests manages scheduled digest content and delivery settings.",
        "/chat is the live support and follow-up conversation space.",
        "/profile holds user details and profile context.",
    ],
}


def build_chat_tools(
    include_quiz: bool,
    include_suggest: bool,
    include_history: bool,
    include_news: bool,
    include_app_help: bool,
):
    """Build the minimal tool list needed for the current chat turn."""
    tools = [GET_USER_PROGRESS_TOOL]
    if include_quiz:
        tools.append(QUIZ_TOOLS[0])
    if include_history:
        tools.append(GET_PREVIOUS_MESSAGES_TOOL)
    if include_news:
        tools.append(SEARCH_NEWS_TOOL)
    if include_app_help:
        tools.append(GET_APP_HELP_TOOL)
    if include_suggest:
        tools.extend(SUGGEST_TOOLS)
    return tools

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
            active = [
                f"[ID={i.get('checklistId', '?')}] {i['title']}"
                for i in items if not i.get("completed")
            ]
            recent = [
                f"[ID={i.get('checklistId', '?')}] {i['title']}"
                for i in items if i.get("completed") and i.get("completedAt")
            ]

            goal_id = goal.get("goalId", "?")
            part = f"Goal [ID={goal_id}]: {goal['title']}\n"
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

    elif tool_name == "get_app_help":
        topic = str(tool_input.get("topic", "overview") or "overview").strip().lower()
        if topic not in APP_HELP_CONTENT:
            topic = "overview"
        lines = APP_HELP_CONTENT[topic]
        heading = topic.replace("_", " ").title()
        return f"NagAI app help — {heading}\n" + "\n".join(f"- {line}" for line in lines)

    # --- Suggest tools (chat only) ---

    elif tool_name == "suggest_create_goal":
        title = tool_input.get("title", "")
        description = tool_input.get("description", "")
        checklist_items = tool_input.get("checklist_items", [])
        params = {"title": title, "description": description}
        # SMART fields
        for field in ("specific", "measurable", "attainable", "relevant", "timely"):
            if tool_input.get(field):
                params[field] = tool_input[field]
        if tool_input.get("target_date"):
            params["targetDate"] = tool_input["target_date"]
        if checklist_items:
            params["checklist_items"] = checklist_items

        display = f"Create goal: \"{title}\""
        if checklist_items:
            display += f" with {len(checklist_items)} checklist item(s)"

        suggestions = context.setdefault("_suggestions", [])
        suggestions.append({
            "suggestion_id": str(uuid.uuid4()),
            "type": "create_goal",
            "display_text": display,
            "params_json": json.dumps(params),
        })
        return f"Suggestion queued: {display}. The user will see an accept/reject card."

    elif tool_name == "suggest_update_goal":
        goal_id = tool_input.get("goal_id")
        goal_title = tool_input.get("goal_title", "")
        updates = {}
        if tool_input.get("title"):
            updates["title"] = tool_input["title"]
        if tool_input.get("description"):
            updates["description"] = tool_input["description"]
        if tool_input.get("target_date"):
            updates["targetDate"] = tool_input["target_date"]

        if not updates:
            return "No updates specified. Include at least one field to update."

        params = {"goalId": goal_id, "goalTitle": goal_title, "updates": updates}
        display = f"Update goal: \"{goal_title}\" — change {', '.join(updates.keys())}"

        suggestions = context.setdefault("_suggestions", [])
        suggestions.append({
            "suggestion_id": str(uuid.uuid4()),
            "type": "update_goal",
            "display_text": display,
            "params_json": json.dumps(params),
        })
        return f"Suggestion queued: {display}. The user will see an accept/reject card."

    elif tool_name == "suggest_add_checklist_item":
        goal_id = tool_input.get("goal_id")
        goal_title = tool_input.get("goal_title", "")
        title = tool_input.get("title", "")
        notes = tool_input.get("notes", "")

        params = {"goalId": goal_id, "goalTitle": goal_title, "title": title}
        if notes:
            params["notes"] = notes

        display = f"Add to \"{goal_title}\": {title}"

        suggestions = context.setdefault("_suggestions", [])
        suggestions.append({
            "suggestion_id": str(uuid.uuid4()),
            "type": "add_checklist_item",
            "display_text": display,
            "params_json": json.dumps(params),
        })
        return f"Suggestion queued: {display}. The user will see an accept/reject card."

    elif tool_name == "suggest_complete_checklist_item":
        checklist_id = tool_input.get("checklist_id")
        title = tool_input.get("title", "")

        params = {"checklistId": checklist_id, "title": title}
        display = f"Mark complete: \"{title}\""

        suggestions = context.setdefault("_suggestions", [])
        suggestions.append({
            "suggestion_id": str(uuid.uuid4()),
            "type": "complete_checklist_item",
            "display_text": display,
            "params_json": json.dumps(params),
        })
        return f"Suggestion queued: {display}. The user will see an accept/reject card."

    elif tool_name == "present_quiz":
        # Only allow one quiz per response — ignore duplicates
        suggestions = context.setdefault("_suggestions", [])
        if any(s["type"] == "quiz" for s in suggestions):
            return (
                "ERROR: A quiz has already been presented in this response. "
                "Do NOT call present_quiz again. Only one quiz per message."
            )

        question = tool_input.get("question", "")
        options = tool_input.get("options", [])
        allow_free = tool_input.get("allow_free_response", True)
        placeholder = tool_input.get("free_response_placeholder", "Or type your own...")

        # Validate options is a proper array of objects with "label" keys
        if not isinstance(options, list) or len(options) < 2:
            return (
                "ERROR: 'options' must be a JSON array with 2-6 objects. "
                "Each object needs a 'label' string. Example: "
                '[{"label": "Option A"}, {"label": "Option B", "description": "Details"}]. '
                "Do NOT put each option in a separate tool call."
            )
        valid_options = []
        for opt in options:
            if isinstance(opt, dict) and isinstance(opt.get("label"), str) and opt["label"].strip():
                valid_options.append(opt)
        if len(valid_options) < 2:
            return (
                "ERROR: Each option must be an object with a 'label' string. "
                "Found malformed options. Retry with proper format: "
                '[{"label": "Option A"}, {"label": "Option B"}].'
            )

        params = {
            "question": question,
            "options": valid_options,
            "allowFreeResponse": allow_free,
            "freeResponsePlaceholder": placeholder,
        }

        suggestions.append({
            "suggestion_id": str(uuid.uuid4()),
            "type": "quiz",
            "display_text": question,
            "params_json": json.dumps(params),
        })
        return f"Quiz presented to user: \"{question}\" with {len(valid_options)} options. Wait for their response."

    return "Unknown tool."


def run_agent_loop(client, model, system_prompt, tool_context,
                   initial_message="Generate a personalized message for the user now.",
                   max_tokens=512, max_iterations=5, prior_messages=None,
                   tools=None):
    """Run the Claude tool-use loop. Returns the final text response.

    prior_messages: optional list of {"role": "user"|"assistant", "content": str}
        to prepend as conversation history before the initial_message.
    tools: optional list of tool definitions. Defaults to TOOLS (read-only).
    """
    import time

    active_tools = tools or TOOLS
    routing = tool_context.get("_routing", {})
    tool_names = ", ".join(tool["name"] for tool in active_tools)
    logger.info(
        "Agent loop start: route=%s active_tools=[%s] recent_history=%d older_history=%s",
        routing.get("mode", "tool"),
        tool_names,
        routing.get("recent_history_count", len(prior_messages or [])),
        routing.get("older_history_available", bool(tool_context.get("conversation_history"))),
    )

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
            tools=active_tools,
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
