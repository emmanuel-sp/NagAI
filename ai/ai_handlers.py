import os
import datetime
import anthropic

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
MODEL = "claude-haiku-4-5-20251001"


def _profile_section(user_profile: str) -> str:
    if not user_profile or not user_profile.strip():
        return ""
    return f"\nUser profile (tailor suggestions to this person):\n{user_profile}\n"


def _smart_section(goal_smart_context: str) -> str:
    if not goal_smart_context or not goal_smart_context.strip():
        return ""
    return f"\nGoal SMART breakdown:\n{goal_smart_context}\n"


def _completed_section(completed_items: list[str]) -> str:
    if not completed_items:
        return ""
    completed = "\n".join(f"- {i}" for i in completed_items)
    return f"\nAlready completed tasks (do NOT suggest these again):\n{completed}\n"


def suggest_smart_field(
    field: str,
    goal_title: str,
    goal_description: str,
    existing_fields: dict | None = None,
    user_profile: str = "",
) -> str:
    field_order = ("specific", "measurable", "attainable", "relevant", "timely")
    context_lines = [
        f"  {f}: {existing_fields[f]}"
        for f in field_order
        if f != field and existing_fields and existing_fields.get(f)
    ]
    context_section = (
        "\nAlready defined SMART fields (your suggestion must be coherent with these):\n"
        + "\n".join(context_lines)
        + "\n"
        if context_lines
        else ""
    )
    prompt = (
        f"You are helping a user build a SMART goal.\n"
        f"Goal title: {goal_title}\n"
        f"Goal description: {goal_description}\n"
        f"{_profile_section(user_profile)}"
        f"{context_section}"
        f"Write a concise, specific value for the '{field}' dimension. "
        f"It must complement and not repeat ideas already covered in the other fields above. "
        f"Reply with only the suggestion — no preamble, no explanation."
    )
    message = client.messages.create(
        model=MODEL,
        max_tokens=256,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text.strip()


def generate_checklist_item(
    goal_title: str,
    goal_description: str,
    existing_items: list[str],
    user_profile: str = "",
    completed_items: list[str] | None = None,
    goal_smart_context: str = "",
) -> dict:
    existing = "\n".join(f"- {i}" for i in existing_items) or "(none yet)"
    today = datetime.date.today().isoformat()
    prompt = (
        f"Goal: {goal_title}\nDescription: {goal_description}\n"
        f"{_profile_section(user_profile)}"
        f"{_smart_section(goal_smart_context)}"
        f"{_completed_section(completed_items or [])}"
        f"Active checklist items (do NOT duplicate these):\n{existing}\n\n"
        f"Today's date is {today}. Suggest ONE new, concrete checklist item not already covered. "
        f"All deadlines must be on or after today's date. "
        f"Reply in exactly this format:\n"
        f"title: <title>\nnotes: <brief note>\ndeadline: <YYYY-MM-DD>"
    )
    message = client.messages.create(
        model=MODEL,
        max_tokens=128,
        messages=[{"role": "user", "content": prompt}],
    )
    return _parse_item(message.content[0].text.strip())


def generate_full_checklist(
    goal_title: str,
    goal_description: str,
    user_profile: str = "",
    completed_items: list[str] | None = None,
    goal_smart_context: str = "",
) -> list[dict]:
    today = datetime.date.today().isoformat()
    prompt = (
        f"Goal: {goal_title}\nDescription: {goal_description}\n"
        f"{_profile_section(user_profile)}"
        f"{_smart_section(goal_smart_context)}"
        f"{_completed_section(completed_items or [])}"
        f"Today's date is {today}. Generate 5 concrete, actionable checklist items. "
        f"All deadlines must be on or after today's date, spread realistically across the timeline. "
        f"For each item use exactly this format:\n"
        f"title: <title>\nnotes: <brief note>\ndeadline: <YYYY-MM-DD>\n---"
    )
    message = client.messages.create(
        model=MODEL,
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}],
    )
    return [_parse_item(b) for b in message.content[0].text.strip().split("---") if b.strip()]


def _parse_item(text: str) -> dict:
    result = {"title": "", "notes": "", "deadline": ""}
    for line in text.splitlines():
        if line.startswith("title:"):
            result["title"] = line[6:].strip()
        elif line.startswith("notes:"):
            result["notes"] = line[6:].strip()
        elif line.startswith("deadline:"):
            result["deadline"] = line[9:].strip()
    return result
