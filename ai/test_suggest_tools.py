"""Tests for suggest tools in agent_tools.py."""

import json
import pytest
from agent_tools import (
    APP_HELP_CONTENT,
    GET_APP_HELP_TOOL,
    QUIZ_TOOLS,
    SUGGEST_TOOLS,
    TOOLS,
    build_chat_tools,
    execute_tool,
)


class TestSuggestCreateGoal:
    def test_basic_create_goal(self):
        context = {"goals": []}
        result = execute_tool("suggest_create_goal", {"title": "Learn Spanish"}, context)

        assert "Suggestion queued" in result
        assert "Learn Spanish" in result

        suggestions = context["_suggestions"]
        assert len(suggestions) == 1
        s = suggestions[0]
        assert s["type"] == "create_goal"
        assert "Learn Spanish" in s["display_text"]
        assert s["suggestion_id"]  # UUID present

        params = json.loads(s["params_json"])
        assert params["title"] == "Learn Spanish"

    def test_create_goal_with_smart_fields(self):
        context = {"goals": []}
        tool_input = {
            "title": "Run a marathon",
            "description": "Complete a full marathon",
            "specific": "Register for and complete the NYC Marathon",
            "measurable": "Track weekly mileage, target 26.2 miles",
            "attainable": "Follow a 16-week training plan",
            "relevant": "Supports fitness and mental health goals",
            "timely": "Race day is November 2026",
            "target_date": "2026-11-01",
        }
        result = execute_tool("suggest_create_goal", tool_input, context)

        params = json.loads(context["_suggestions"][0]["params_json"])
        assert params["specific"] == "Register for and complete the NYC Marathon"
        assert params["measurable"] == "Track weekly mileage, target 26.2 miles"
        assert params["attainable"] == "Follow a 16-week training plan"
        assert params["relevant"] == "Supports fitness and mental health goals"
        assert params["timely"] == "Race day is November 2026"
        assert params["targetDate"] == "2026-11-01"

    def test_create_goal_with_checklist_items(self):
        context = {"goals": []}
        tool_input = {
            "title": "Learn Spanish",
            "checklist_items": [
                {"title": "Download Duolingo"},
                {"title": "Complete first lesson"},
            ],
        }
        result = execute_tool("suggest_create_goal", tool_input, context)

        assert "2 checklist item(s)" in result

        params = json.loads(context["_suggestions"][0]["params_json"])
        assert len(params["checklist_items"]) == 2
        assert params["checklist_items"][0]["title"] == "Download Duolingo"

    def test_create_goal_smart_fields_omitted_when_empty(self):
        context = {"goals": []}
        execute_tool("suggest_create_goal", {"title": "Basic goal"}, context)

        params = json.loads(context["_suggestions"][0]["params_json"])
        assert "specific" not in params
        assert "measurable" not in params
        assert "targetDate" not in params


class TestSuggestUpdateGoal:
    def test_update_goal_title(self):
        context = {"goals": []}
        tool_input = {
            "goal_id": 5,
            "goal_title": "Old Title",
            "title": "New Title",
        }
        result = execute_tool("suggest_update_goal", tool_input, context)

        assert "Suggestion queued" in result
        s = context["_suggestions"][0]
        assert s["type"] == "update_goal"

        params = json.loads(s["params_json"])
        assert params["goalId"] == 5
        assert params["updates"]["title"] == "New Title"

    def test_update_goal_no_updates_returns_error(self):
        context = {"goals": []}
        tool_input = {"goal_id": 5, "goal_title": "Title"}
        result = execute_tool("suggest_update_goal", tool_input, context)

        assert "No updates specified" in result
        assert "_suggestions" not in context

    def test_update_goal_target_date_converts_to_camelCase(self):
        context = {"goals": []}
        tool_input = {
            "goal_id": 5,
            "goal_title": "My Goal",
            "target_date": "2026-12-31",
        }
        result = execute_tool("suggest_update_goal", tool_input, context)

        params = json.loads(context["_suggestions"][0]["params_json"])
        assert params["updates"]["targetDate"] == "2026-12-31"


class TestSuggestAddChecklistItem:
    def test_add_checklist_item(self):
        context = {"goals": []}
        tool_input = {
            "goal_id": 5,
            "goal_title": "Learn Spanish",
            "title": "Buy textbook",
        }
        result = execute_tool("suggest_add_checklist_item", tool_input, context)

        assert "Suggestion queued" in result
        s = context["_suggestions"][0]
        assert s["type"] == "add_checklist_item"

        params = json.loads(s["params_json"])
        assert params["goalId"] == 5
        assert params["title"] == "Buy textbook"

    def test_add_checklist_item_with_notes(self):
        context = {"goals": []}
        tool_input = {
            "goal_id": 5,
            "goal_title": "Learn Spanish",
            "title": "Buy textbook",
            "notes": "Check Amazon for deals",
        }
        execute_tool("suggest_add_checklist_item", tool_input, context)

        params = json.loads(context["_suggestions"][0]["params_json"])
        assert params["notes"] == "Check Amazon for deals"


class TestSuggestCompleteChecklistItem:
    def test_complete_checklist_item(self):
        context = {"goals": []}
        tool_input = {"checklist_id": 42, "title": "Download Duolingo"}
        result = execute_tool("suggest_complete_checklist_item", tool_input, context)

        assert "Suggestion queued" in result
        s = context["_suggestions"][0]
        assert s["type"] == "complete_checklist_item"

        params = json.loads(s["params_json"])
        assert params["checklistId"] == 42


class TestMultipleSuggestions:
    def test_multiple_suggestions_accumulate(self):
        context = {"goals": []}
        execute_tool("suggest_create_goal", {"title": "Goal 1"}, context)
        execute_tool("suggest_create_goal", {"title": "Goal 2"}, context)

        assert len(context["_suggestions"]) == 2
        # Each has a unique suggestion ID
        ids = {s["suggestion_id"] for s in context["_suggestions"]}
        assert len(ids) == 2


class TestGetUserProgressWithIds:
    def test_includes_goal_and_checklist_ids(self):
        context = {
            "goals": [
                {
                    "goalId": 5,
                    "title": "Learn Spanish",
                    "description": "Become conversational",
                    "checklistItems": [
                        {"checklistId": 10, "title": "Download Duolingo", "completed": False},
                        {"checklistId": 11, "title": "First lesson", "completed": True, "completedAt": "recent"},
                    ],
                }
            ]
        }
        result = execute_tool("get_user_progress", {}, context)

        assert "[ID=5]" in result
        assert "[ID=10]" in result
        assert "[ID=11]" in result
        assert "Learn Spanish" in result
        assert "1/2 tasks complete" in result


class TestPresentQuiz:
    def test_basic_quiz(self):
        context = {"goals": []}
        tool_input = {
            "question": "What area of life do you want to focus on?",
            "options": [
                {"label": "Career", "description": "Job, skills, professional growth"},
                {"label": "Health", "description": "Fitness, nutrition, mental health"},
                {"label": "Learning", "description": "New skills, education, hobbies"},
            ],
        }
        result = execute_tool("present_quiz", tool_input, context)

        assert "Quiz presented" in result
        assert "3 options" in result

        suggestions = context["_suggestions"]
        assert len(suggestions) == 1
        s = suggestions[0]
        assert s["type"] == "quiz"
        assert s["suggestion_id"]  # UUID present
        assert "What area" in s["display_text"]

        params = json.loads(s["params_json"])
        assert params["question"] == "What area of life do you want to focus on?"
        assert len(params["options"]) == 3
        assert params["options"][0]["label"] == "Career"
        assert params["options"][0]["description"] == "Job, skills, professional growth"
        assert params["allowFreeResponse"] is True  # default

    def test_quiz_without_free_response(self):
        context = {"goals": []}
        tool_input = {
            "question": "How soon?",
            "options": [{"label": "This week"}, {"label": "This month"}],
            "allow_free_response": False,
        }
        execute_tool("present_quiz", tool_input, context)

        params = json.loads(context["_suggestions"][0]["params_json"])
        assert params["allowFreeResponse"] is False

    def test_quiz_custom_placeholder(self):
        context = {"goals": []}
        tool_input = {
            "question": "What's your goal?",
            "options": [{"label": "Get fit"}],
            "free_response_placeholder": "Describe your goal...",
        }
        execute_tool("present_quiz", tool_input, context)

        params = json.loads(context["_suggestions"][0]["params_json"])
        assert params["freeResponsePlaceholder"] == "Describe your goal..."

    def test_quiz_options_without_description(self):
        context = {"goals": []}
        tool_input = {
            "question": "Pick a timeline",
            "options": [{"label": "1 month"}, {"label": "3 months"}, {"label": "6 months"}],
        }
        execute_tool("present_quiz", tool_input, context)

        params = json.loads(context["_suggestions"][0]["params_json"])
        # Options should only have label, no description key
        for opt in params["options"]:
            assert "label" in opt

    def test_quiz_accumulates_with_other_suggestions(self):
        context = {"goals": []}
        execute_tool("present_quiz", {
            "question": "What area?",
            "options": [{"label": "Career"}],
        }, context)
        execute_tool("suggest_create_goal", {"title": "Learn Spanish"}, context)

        assert len(context["_suggestions"]) == 2
        assert context["_suggestions"][0]["type"] == "quiz"
        assert context["_suggestions"][1]["type"] == "create_goal"


class TestGetAppHelp:
    def test_get_app_help_defaults_to_overview(self):
        context = {"goals": []}

        result = execute_tool("get_app_help", {}, context)

        assert result.startswith("NagAI app help")
        assert "goal accountability app" in result
        assert "Agent emails are proactive check-ins" in result
        assert len(result.splitlines()) <= 6

    def test_get_app_help_returns_topic_specific_content(self):
        context = {"goals": []}

        result = execute_tool("get_app_help", {"topic": "navigation"}, context)

        assert "/home is the dashboard" in result
        assert "/chat is the live support" in result
        assert "goal accountability app" not in result

    def test_get_app_help_invalid_topic_falls_back_to_overview(self):
        context = {"goals": []}

        result = execute_tool("get_app_help", {"topic": "unknown"}, context)

        assert "Core areas:" in result


class TestToolListCompleteness:
    def test_suggest_tools_have_four_entries(self):
        assert len(SUGGEST_TOOLS) == 4
        names = {t["name"] for t in SUGGEST_TOOLS}
        assert names == {
            "suggest_create_goal",
            "suggest_update_goal",
            "suggest_add_checklist_item",
            "suggest_complete_checklist_item",
        }

    def test_all_suggest_tools_have_required_schema_fields(self):
        for tool in SUGGEST_TOOLS:
            assert "name" in tool
            assert "description" in tool
            assert "input_schema" in tool
            assert tool["input_schema"]["type"] == "object"

    def test_quiz_tools_have_one_entry(self):
        assert len(QUIZ_TOOLS) == 1
        assert QUIZ_TOOLS[0]["name"] == "present_quiz"

    def test_app_help_tool_has_expected_topics(self):
        assert GET_APP_HELP_TOOL["name"] == "get_app_help"
        assert GET_APP_HELP_TOOL["input_schema"]["properties"]["topic"]["enum"] == [
            "overview",
            "onboarding",
            "goals",
            "today",
            "agents",
            "digests",
            "chat",
            "navigation",
        ]
        assert set(APP_HELP_CONTENT) == {
            "overview",
            "onboarding",
            "goals",
            "today",
            "agents",
            "digests",
            "chat",
            "navigation",
        }

    def test_suggest_tools_not_in_base_tools(self):
        base_names = {t["name"] for t in TOOLS}
        suggest_names = {t["name"] for t in SUGGEST_TOOLS}
        quiz_names = {t["name"] for t in QUIZ_TOOLS}
        assert base_names.isdisjoint(suggest_names)
        assert base_names.isdisjoint(quiz_names)
        assert suggest_names.isdisjoint(quiz_names)

    def test_build_chat_tools_only_includes_requested_tools(self):
        tools = build_chat_tools(
            include_quiz=False,
            include_suggest=False,
            include_history=False,
            include_news=False,
            include_app_help=True,
        )

        assert [tool["name"] for tool in tools] == [
            "get_user_progress",
            "get_app_help",
        ]
