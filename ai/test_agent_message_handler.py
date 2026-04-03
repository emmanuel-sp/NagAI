import os

os.environ.setdefault("ANTHROPIC_API_KEY", "test-key")

import agent_message_handler


def test_build_system_prompt_pushes_nag_messages_to_quick_read_format():
    prompt = agent_message_handler._build_system_prompt(
        agent_name="Alex",
        context_name="Ship the launch",
        message_type="nag",
        custom_instructions="Keep me honest.",
        user_name="Emmanuel",
        user_profile="Founder with limited time",
        goal={"title": "Launch v1", "description": "Ship the first version"},
    )

    assert "make it a very quick read" in prompt
    assert "Target 40-70 words total." in prompt
    assert "Use 1 or 2 very short paragraphs only" in prompt
    assert "No headings, no bullet lists, no long setup, and no sign-off." in prompt


def test_normalize_message_body_collapses_long_nag_into_two_short_paragraphs():
    raw = (
        "# Reset\n\n"
        "You do not need a perfect plan tonight. Open the doc and write the first rough paragraph now.\n\n"
        "- Block 15 minutes after dinner and draft the intro.\n"
        "- Put your phone in another room before you start.\n\n"
        "If that still feels heavy, shrink it to five minutes and just outline the first section. "
        "Send yourself a start time before you close this email."
    )

    normalized = agent_message_handler._normalize_message_body(raw, "nag")

    assert normalized.count("\n\n") <= 1
    assert "# " not in normalized
    assert "\n-" not in normalized
    assert len(normalized.split()) <= agent_message_handler.NAG_TARGET_WORDS
    assert normalized.startswith("Reset")


def test_normalize_message_body_keeps_short_copy_as_one_quick_paragraph():
    raw = "Open the budget sheet tonight. Pick the next line item and finish just that."

    normalized = agent_message_handler._normalize_message_body(raw, "nag")

    assert normalized == raw
