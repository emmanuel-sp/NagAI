import os
import anthropic

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
MODEL = "claude-haiku-4-5-20251001"


def suggest_smart_field(field: str, goal_title: str, goal_description: str) -> str:
    prompt = (
        f"You are helping a user refine a SMART goal.\n"
        f"Goal title: {goal_title}\n"
        f"Goal description: {goal_description}\n"
        f"Provide a concise, specific value for the '{field}' dimension of this SMART goal. "
        f"Reply with only the suggestion — no preamble, no explanation."
    )
    message = client.messages.create(
        model=MODEL,
        max_tokens=256,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text.strip()


def generate_checklist_item(
    goal_title: str, goal_description: str, existing_items: list[str]
) -> dict:
    existing = "\n".join(f"- {i}" for i in existing_items) or "(none yet)"
    prompt = (
        f"Goal: {goal_title}\nDescription: {goal_description}\n"
        f"Existing checklist items:\n{existing}\n\n"
        f"Suggest ONE new, concrete checklist item not already covered. "
        f"Reply in exactly this format:\n"
        f"title: <title>\nnotes: <brief note>\ndeadline: <YYYY-MM-DD>"
    )
    message = client.messages.create(
        model=MODEL,
        max_tokens=128,
        messages=[{"role": "user", "content": prompt}],
    )
    return _parse_item(message.content[0].text.strip())


def generate_full_checklist(goal_title: str, goal_description: str) -> list[dict]:
    prompt = (
        f"Goal: {goal_title}\nDescription: {goal_description}\n\n"
        f"Generate 5 concrete, actionable checklist items. "
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
