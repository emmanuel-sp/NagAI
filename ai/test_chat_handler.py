import os
from types import SimpleNamespace

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
    assert 'get_previous_messages' not in prompt
    assert '"Learn Spanish" (1/3 tasks done)' in prompt


def test_handle_chat_uses_recent_window_and_exposes_history_tool(monkeypatch):
    captured = {}

    def fake_run_agent_loop(client, model, system_prompt, tool_context, **kwargs):
        captured["system_prompt"] = system_prompt
        captured["tool_context"] = tool_context
        captured["kwargs"] = kwargs
        captured["tool_names"] = [tool["name"] for tool in kwargs["tools"]]
        return "Tool path response"

    monkeypatch.setattr(chat_handler, "run_agent_loop", fake_run_agent_loop)

    user_message = "Add a checklist item for my language goal."
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
    assert "suggest_add_checklist_item" in captured["tool_names"]


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


def test_handle_chat_uses_fast_path_when_no_tool_intent(monkeypatch):
    captured = {}

    def fake_run_agent_loop(*args, **kwargs):
        raise AssertionError("run_agent_loop should not be used for fast-path chats")

    def fake_call_claude_messages(messages, max_tokens, operation, **kwargs):
        captured["messages"] = messages
        captured["system"] = kwargs["system"]
        captured["operation"] = operation
        return SimpleNamespace(content=[SimpleNamespace(type="text", text="Fast path response")])

    monkeypatch.setattr(chat_handler, "run_agent_loop", fake_run_agent_loop)
    monkeypatch.setattr(chat_handler.ai_handlers, "_call_claude_messages", fake_call_claude_messages)

    user_message = "I'm feeling a little scattered today."
    history = _history(10) + [{"role": "user", "content": user_message}]
    response, suggestions = chat_handler.handle_chat(
        user_message=user_message,
        user_profile="Builder",
        goals=[_goal()],
        history=history,
    )

    assert response == "Fast path response"
    assert suggestions == []
    assert captured["operation"] == "agent_chat_fast_path"
    assert len(captured["messages"]) == 9
    assert captured["messages"][-1]["content"] == user_message
    assert "present_quiz" not in captured["system"]
    assert "suggest_*" not in captured["system"]
