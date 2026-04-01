import os
from types import SimpleNamespace

os.environ.setdefault("ANTHROPIC_API_KEY", "test-key")

import ai_handlers


def test_generate_daily_checklist_prompt_stays_same_day(monkeypatch):
    captured = {}

    def fake_call(prompt, max_tokens, operation, system="", temperature=None):
        captured["prompt"] = prompt
        captured["system"] = system
        return SimpleNamespace(
            content=[SimpleNamespace(text="label: [NEW]\ntitle: Wrap up inbox\nscheduled_time: 18:00\nnotes:")]
        )

    monkeypatch.setattr(ai_handlers, "_call_claude", fake_call)

    ai_handlers.generate_daily_checklist(
        candidates=[],
        recurring_items=[],
        max_items=5,
        current_time="17:30",
        user_profile="",
        day_of_week="Wednesday",
        plan_date="2026-04-01",
        busy_blocks=[{"start_time": "10:00", "end_time": "11:00", "summary": "Team sync"}],
    )

    assert "tomorrow prep" not in captured["system"]
    assert "tomorrow planning only" not in captured["system"]
    assert "Every item must be something the user can do on 2026-04-01." in captured["system"]
    assert "never repeat them, restate them, or output them as checklist items" in captured["system"]
