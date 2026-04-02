import os

os.environ.setdefault("ANTHROPIC_API_KEY", "test-key")

import chat_handler


def _goal(title="Learn Spanish", completed=1, total=3):
    return {
        "title": title,
        "description": "Become conversational",
        "smart_context": "Practice daily",
        "completed_items": completed,
        "total_items": total,
        "active_items": ["Study verbs", "Listen to podcast"],
        "goal_id": 7,
        "checklist_items": [
            {"checklist_id": 11, "title": "Study verbs", "completed": False},
            {"checklist_id": 12, "title": "Listen to podcast", "completed": True},
        ],
    }


def _history(count):
    entries = []
    for idx in range(count):
        role = "user" if idx % 2 == 0 else "assistant"
        entries.append({"role": role, "content": f"message-{idx}"})
    return entries


def test_build_chat_prompt_omits_disabled_instruction_blocks():
    prompt = chat_handler._build_chat_prompt(
        user_profile="Busy product leader",
        goals=[_goal()],
        from_context_summary="Recent context from email",
        capabilities={
            "uses_tools": False,
            "quiz": False,
            "suggest": False,
            "news": False,
            "history": False,
        },
    )

    assert 'present_quiz' not in prompt
    assert 'suggest_*' not in prompt
    assert 'search_news' not in prompt
    assert 'get_app_help' not in prompt
    assert 'get_previous_messages' not in prompt
    assert '"Learn Spanish" (1/3 tasks done)' in prompt


def test_build_chat_prompt_includes_app_help_without_quiz_when_requested():
    prompt = chat_handler._build_chat_prompt(
        user_profile="Busy product leader",
        goals=[_goal()],
        from_context_summary="",
        capabilities={
            "uses_tools": True,
            "quiz": False,
            "suggest": False,
            "news": False,
            "app_help": True,
            "history": False,
        },
    )

    assert "get_app_help" in prompt
    assert "present_quiz" not in prompt


def test_handle_chat_uses_recent_window_and_exposes_history_tool(monkeypatch):
    captured = {}

    def fake_run_agent_loop(client, model, system_prompt, tool_context, **kwargs):
        captured["system_prompt"] = system_prompt
        captured["tool_context"] = tool_context
        captured["kwargs"] = kwargs
        captured["tool_names"] = [tool["name"] for tool in kwargs["tools"]]
        return "Tool path response"

    monkeypatch.setattr(chat_handler, "run_agent_loop", fake_run_agent_loop)

    user_message = "Can you remind me what we discussed earlier?"
    history = _history(11) + [{"role": "user", "content": user_message}]
    response, suggestions = chat_handler.handle_chat(
        user_message=user_message,
        user_profile="Busy product leader",
        goals=[_goal()],
        history=history,
    )

    assert response == "Tool path response"
    assert suggestions == []
    assert len(captured["kwargs"]["prior_messages"]) == 8
    assert captured["kwargs"]["prior_messages"][-1]["content"] == "message-10"
    assert len(captured["tool_context"]["conversation_history"]) == 3
    assert "get_previous_messages" in captured["tool_names"]
    assert "get_app_help" in captured["tool_names"]


def test_handle_chat_only_exposes_news_tool_for_news_intent(monkeypatch):
    tool_names = []

    def fake_run_agent_loop(client, model, system_prompt, tool_context, **kwargs):
        tool_names.append([tool["name"] for tool in kwargs["tools"]])
        return "Tool path response"

    monkeypatch.setattr(chat_handler, "run_agent_loop", fake_run_agent_loop)

    chat_handler.handle_chat(
        user_message="What's the latest AI news that could help my goals?",
        user_profile="Builder",
        goals=[_goal()],
        history=[{"role": "user", "content": "What's the latest AI news that could help my goals?"}],
    )
    chat_handler.handle_chat(
        user_message="Add a checklist item for my language goal.",
        user_profile="Builder",
        goals=[_goal()],
        history=[{"role": "user", "content": "Add a checklist item for my language goal."}],
    )

    assert "search_news" in tool_names[0]
    assert "search_news" not in tool_names[1]
    assert "get_app_help" in tool_names[0]
    assert "get_app_help" in tool_names[1]


def test_handle_chat_only_exposes_app_help_tool_for_app_help_intent(monkeypatch):
    captured = {}

    def fake_run_agent_loop(client, model, system_prompt, tool_context, **kwargs):
        captured["tool_names"] = [tool["name"] for tool in kwargs["tools"]]
        captured["system_prompt"] = system_prompt
        return "Tool path response"

    monkeypatch.setattr(chat_handler, "run_agent_loop", fake_run_agent_loop)

    chat_handler.handle_chat(
        user_message="How do I use the digests feature in the NagAI app?",
        user_profile="Builder",
        goals=[_goal()],
        history=[{"role": "user", "content": "How do I use the digests feature in the NagAI app?"}],
    )

    assert "get_app_help" in captured["tool_names"]
    assert "present_quiz" not in captured["tool_names"]
    assert "get_app_help" in captured["system_prompt"]
    assert "present_quiz" not in captured["system_prompt"]


def test_handle_chat_broad_app_help_phrase_routes_without_explicit_how_do_i(monkeypatch):
    captured = {}

    def fake_run_agent_loop(client, model, system_prompt, tool_context, **kwargs):
        captured["tool_names"] = [tool["name"] for tool in kwargs["tools"]]
        captured["system_prompt"] = system_prompt
        return "Tool path response"

    monkeypatch.setattr(chat_handler, "run_agent_loop", fake_run_agent_loop)

    chat_handler.handle_chat(
        user_message="What is this app about?",
        user_profile="Builder",
        goals=[_goal()],
        history=[{"role": "user", "content": "What is this app about?"}],
    )

    assert "get_app_help" in captured["tool_names"]
    assert "get_app_help" in captured["system_prompt"]


def test_handle_chat_only_exposes_suggest_tools_for_action_intent(monkeypatch):
    tool_names = []

    def fake_run_agent_loop(client, model, system_prompt, tool_context, **kwargs):
        tool_names.append([tool["name"] for tool in kwargs["tools"]])
        return "Tool path response"

    monkeypatch.setattr(chat_handler, "run_agent_loop", fake_run_agent_loop)

    chat_handler.handle_chat(
        user_message="Create a new goal for learning Spanish.",
        user_profile="Builder",
        goals=[_goal()],
        history=[{"role": "user", "content": "Create a new goal for learning Spanish."}],
    )
    chat_handler.handle_chat(
        user_message="I'm not sure what goal to set next.",
        user_profile="Builder",
        goals=[_goal()],
        history=[{"role": "user", "content": "I'm not sure what goal to set next."}],
    )

    assert "suggest_create_goal" in tool_names[0]
    assert "suggest_create_goal" not in tool_names[1]
    assert "present_quiz" in tool_names[1]


def test_handle_chat_generic_help_me_get_started_stays_quiz_without_app_markers(monkeypatch):
    captured = {}

    def fake_run_agent_loop(client, model, system_prompt, tool_context, **kwargs):
        captured["tool_names"] = [tool["name"] for tool in kwargs["tools"]]
        captured["system_prompt"] = system_prompt
        return "Tool path response"

    monkeypatch.setattr(chat_handler, "run_agent_loop", fake_run_agent_loop)

    chat_handler.handle_chat(
        user_message="Help me get started.",
        user_profile="Builder",
        goals=[_goal()],
        history=[{"role": "user", "content": "Help me get started."}],
    )

    assert "present_quiz" in captured["tool_names"]
    assert "get_app_help" in captured["tool_names"]
    assert "present_quiz" in captured["system_prompt"]

def test_handle_chat_uses_tool_loop_even_without_specific_intent(monkeypatch):
    captured = {}

    def fake_run_agent_loop(client, model, system_prompt, tool_context, **kwargs):
        captured["tool_names"] = [tool["name"] for tool in kwargs["tools"]]
        captured["system_prompt"] = system_prompt
        captured["prior_messages"] = kwargs["prior_messages"]
        return "Tool path response"

    monkeypatch.setattr(chat_handler, "run_agent_loop", fake_run_agent_loop)

    user_message = "I'm feeling a little scattered today."
    history = _history(10) + [{"role": "user", "content": user_message}]
    response, suggestions = chat_handler.handle_chat(
        user_message=user_message,
        user_profile="Builder",
        goals=[_goal()],
        history=history,
    )

    assert response == "Tool path response"
    assert suggestions == []
    assert captured["prior_messages"][-1]["content"] == "message-10"
    assert "get_user_progress" in captured["tool_names"]
    assert "get_app_help" in captured["tool_names"]
    assert "present_quiz" not in captured["tool_names"]
    assert "get_app_help" not in captured["system_prompt"]


def test_handle_chat_follow_up_inherits_app_help_context(monkeypatch):
    captured = {}

    def fake_run_agent_loop(client, model, system_prompt, tool_context, **kwargs):
        captured["tool_names"] = [tool["name"] for tool in kwargs["tools"]]
        captured["system_prompt"] = system_prompt
        return "Tool path response"

    monkeypatch.setattr(chat_handler, "run_agent_loop", fake_run_agent_loop)

    history = [
        {"role": "user", "content": "How do I add a digest in this app?"},
        {"role": "assistant", "content": "You can manage digests in the app."},
        {"role": "user", "content": "I want to subscribe"},
    ]
    chat_handler.handle_chat(
        user_message="I want to subscribe",
        user_profile="Builder",
        goals=[_goal()],
        history=history,
    )

    assert "get_app_help" in captured["tool_names"]
    assert "get_app_help" in captured["system_prompt"]
