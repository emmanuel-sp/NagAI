import os
import time
import logging
import datetime
import anthropic

logger = logging.getLogger(__name__)

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
MODEL = "claude-haiku-4-5-20251001"


def _call_claude(prompt: str, max_tokens: int, operation: str):
    """Call Claude API with timing and token logging."""
    start = time.monotonic()
    message = client.messages.create(
        model=MODEL,
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}],
    )
    elapsed_ms = round((time.monotonic() - start) * 1000, 1)
    logger.info(
        "Claude API call: operation=%s model=%s input_tokens=%d output_tokens=%d latency_ms=%.1f",
        operation,
        MODEL,
        message.usage.input_tokens,
        message.usage.output_tokens,
        elapsed_ms,
    )
    return message


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
    message = _call_claude(prompt, 256, "suggest_smart_field")
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
    message = _call_claude(prompt, 128, "generate_checklist_item")
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
    message = _call_claude(prompt, 512, "generate_full_checklist")
    return [_parse_item(b) for b in message.content[0].text.strip().split("---") if b.strip()]


def generate_digest_content(
    user_name: str,
    user_profile: str,
    goals_context: str,
    content_types: str,
    last_delivered_at: str,
    search_results: str,
    previous_digest_excerpt: str,
) -> dict:
    """Generate personalized digest email content.
    Returns {"subject": "...", "body": "..."}.
    """
    today = datetime.date.today().isoformat()

    previous_section = ""
    if previous_digest_excerpt:
        previous_section = (
            f"\nPrevious digest excerpt (vary your tone and do NOT repeat this content):\n"
            f'"{previous_digest_excerpt}"\n'
        )

    search_section = ""
    if search_results:
        search_section = (
            f"\nWeb search results (incorporate real links where relevant):\n"
            f"{search_results}\n"
        )

    prompt = (
        f"You are writing a personalized digest email for {user_name}.\n"
        f"Today's date: {today}\n"
        f"{_profile_section(user_profile)}"
        f"\nContent types to include (generate a section for EACH): {content_types}\n"
        f"\nGoals and progress since {last_delivered_at}:\n{goals_context}\n"
        f"{search_section}"
        f"{previous_section}"
        f"\nWrite a warm, concise digest email with a section for each content type listed above.\n"
        f"Use ## headers for each section. Keep the total under 500 words.\n"
        f"For sections with search results, include the real links as markdown links.\n"
        f"Be encouraging and specific to their actual goals and progress.\n"
        f"Reply in exactly this format:\n"
        f"subject: <one compelling email subject line>\n"
        f"---\n"
        f"<email body with ## section headers>"
    )

    message = _call_claude(prompt, 1024, "generate_digest_content")

    text = message.content[0].text.strip()
    return _parse_digest_response(text)


def _parse_digest_response(text: str) -> dict:
    """Parse the subject: / --- / body format from Claude."""
    subject = "Your NagAI Digest"
    body = text

    if text.startswith("subject:"):
        parts = text.split("---", 1)
        subject_line = parts[0].strip()
        if subject_line.startswith("subject:"):
            subject = subject_line[8:].strip()
        if len(parts) > 1:
            body = parts[1].strip()

    return {"subject": subject, "body": body}


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
