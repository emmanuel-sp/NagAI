import json
import os
import time
import logging
import smtplib
import random
import re
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import anthropic
import psycopg2

import web_search

logger = logging.getLogger(__name__)

SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")

DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_PORT = os.environ.get("DB_PORT", "5432")
DB_NAME = os.environ.get("DB_NAME", "nagai")
DB_USER = os.environ.get("DB_USER", "")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "")

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))
MODEL = "claude-haiku-4-5-20251001"

TOOLS = [
    {
        "name": "get_user_progress",
        "description": "Get the user's goal progress including checklist completion status, SMART breakdown, and recent activity.",
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "get_previous_messages",
        "description": "Get the conversation history between the agent and user for this context.",
        "input_schema": {
            "type": "object",
            "properties": {
                "limit": {
                    "type": "integer",
                    "description": "Max messages to retrieve (default 5).",
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


def handle_agent_message(value: str):
    """Main entry point: called by Kafka consumer with the JSON payload."""
    try:
        payload = json.loads(value)
    except json.JSONDecodeError as e:
        logger.error(f"Invalid agent message payload JSON: {e}")
        return

    context_id = payload.get("contextId")
    user_id = payload.get("userId")
    user_email = payload.get("userEmail", "")
    user_name = payload.get("userName", "")
    user_profile = payload.get("userProfile", "")
    agent_name = payload.get("agentName", "NagAI Agent")
    context_name = payload.get("contextName", "")
    message_type = payload.get("messageType", "motivation")
    custom_instructions = payload.get("customInstructions", "")
    goal = payload.get("goal")
    conversation_history = payload.get("conversationHistory", [])
    previous_message_ids = payload.get("previousMessageIds", [])
    previous_subjects = payload.get("previousSubjects", [])
    messages_since_last_change = payload.get("messagesSinceLastChange", 0)

    system_prompt = _build_system_prompt(
        agent_name, context_name, message_type,
        custom_instructions, user_name, user_profile, goal,
        previous_subjects, messages_since_last_change,
    )

    tool_context = {
        "goal": goal,
        "conversation_history": conversation_history,
    }

    result = _run_agent_loop(system_prompt, tool_context)

    subject, body = _parse_response(result, context_name, goal)

    # Thread follow-up emails
    is_followup = len(previous_message_ids) > 0
    if is_followup:
        original_subject = _get_original_subject(context_id)
        if original_subject:
            subject = f"Re: {original_subject}"

    message_id = f"<agent-{context_id}-{int(datetime.now().timestamp())}@nagai.app>"
    references = " ".join(previous_message_ids) if previous_message_ids else None
    in_reply_to = previous_message_ids[-1] if previous_message_ids else None

    html = _render_agent_email(body, agent_name, user_name)

    try:
        _send_email(user_email, subject, html, message_id, in_reply_to, references)
        logger.info(f"Agent message sent to {user_email} (context={context_id})")
    except Exception as e:
        logger.error(f"Failed to send agent email to {user_email}: {e}")
        return

    _save_sent_message(context_id, user_id, subject, body, message_id)


def _build_system_prompt(agent_name, context_name, message_type,
                         custom_instructions, user_name, user_profile, goal,
                         previous_subjects=None, messages_since_last_change=0):
    base = PERSONALITY.get(message_type, PERSONALITY["motivation"])

    # Pick a random angle to force variety
    angles = ANGLES.get(message_type, ANGLES["motivation"])
    angle = random.choice(angles)

    goal_line = ""
    if goal:
        goal_line = f'\nThe user\'s goal: "{goal.get("title", "")}"'
        if goal.get("description"):
            goal_line += f' — {goal["description"]}'

    # Anti-repetition: include previous subjects (very compact)
    previous_line = ""
    if previous_subjects:
        subjects_list = "\n".join(f'- "{s}"' for s in previous_subjects[-5:])
        previous_line = (
            f"\nYour recent message subjects (do NOT reuse these themes, angles, or openings):\n"
            f"{subjects_list}\n"
        )

    # Staleness-aware instructions
    staleness_line = ""
    if messages_since_last_change >= 3:
        staleness_line = (
            f"\nIMPORTANT: You have sent {messages_since_last_change} messages with no checklist progress from the user. "
            "Do NOT repeat that they haven't made progress or guilt-trip them. "
            "Instead, take a fundamentally different approach:\n"
        )
        if messages_since_last_change >= 5:
            staleness_line += (
                "- Ask whether this goal is still a priority, or if it needs to be redefined.\n"
                "- Suggest they might need to break the goal into something smaller and more immediate.\n"
                "- Be honest that the current approach might not be working, and explore why.\n"
            )
        else:
            staleness_line += (
                "- Ask what specific obstacle is in the way.\n"
                "- Suggest a much smaller first step than what's on their checklist.\n"
                "- Try a completely different angle than your previous messages.\n"
            )

    prompt = (
        f"You are {agent_name}, a personal AI agent for {user_name or 'the user'}.\n"
        f'Context: "{context_name}"\n'
        f"{base}\n"
        f"{f'User profile: {user_profile}' if user_profile else ''}\n"
        f"{goal_line}\n"
        f"{f'Custom instructions from the user: {custom_instructions}' if custom_instructions else ''}\n"
        f"{previous_line}"
        f"{staleness_line}\n"
        f"Angle for this message: {angle}\n\n"
        "Your task: Write a personalized message. Keep it concise (under 150 words) "
        "and conversational — like a text from a friend who knows their goals, not a newsletter.\n"
        "Every message must feel fresh — different angle, different opening, different energy.\n\n"
        "Use the tools available to gather context before writing. "
        "Only use search_news if a relevant article would genuinely help.\n\n"
        "Reply with ONLY the message content in this format:\n"
        "subject: <compelling, varied subject line>\n"
        "---\n"
        "<message body using markdown>"
    )
    return prompt


def _run_agent_loop(system_prompt, tool_context, max_iterations=5):
    messages = [{"role": "user", "content": "Generate a personalized message for the user now."}]
    loop_start = time.monotonic()
    total_input_tokens = 0
    total_output_tokens = 0

    for iteration in range(max_iterations):
        call_start = time.monotonic()
        response = client.messages.create(
            model=MODEL,
            max_tokens=512,
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
            result = _execute_tool(tool_block.name, tool_block.input, tool_context)
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


def _execute_tool(tool_name, tool_input, context):
    if tool_name == "get_user_progress":
        goal = context.get("goal")
        if not goal:
            return "No specific goal is linked to this context."
        items = goal.get("checklistItems", [])
        total = len(items)
        completed = sum(1 for i in items if i.get("completed"))
        active = [i["title"] for i in items if not i.get("completed")]
        recent = [i["title"] for i in items if i.get("completed") and i.get("completedAt")]

        result = f"Goal: {goal['title']}\n"
        if goal.get("description"):
            result += f"Description: {goal['description']}\n"
        if goal.get("smartContext"):
            result += f"SMART breakdown:\n{goal['smartContext']}\n"
        result += f"Progress: {completed}/{total} tasks complete\n"
        if recent:
            result += f"Recently completed: {', '.join(recent[-3:])}\n"
        if active:
            result += f"Still active: {', '.join(active[:5])}\n"
        return result

    elif tool_name == "get_previous_messages":
        history = context.get("conversation_history", [])
        if not history:
            return "This is the first message in this conversation. No previous messages."
        limit = tool_input.get("limit", 5)
        lines = []
        for entry in history[-limit:]:
            role = entry.get("role", "agent")
            content = entry.get("content", "")[:120]
            sent_at = entry.get("sentAt", "")
            lines.append(f"[{role}] ({sent_at}): {content}...")
        return "\n".join(lines)

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


def _parse_response(text, context_name, goal):
    if "---" in text:
        parts = text.split("---", 1)
        header = parts[0].strip()
        body = parts[1].strip()
        subject = header.replace("subject:", "").replace("Subject:", "").strip()
        if not subject:
            subject = _default_subject(context_name, goal)
    else:
        subject = _default_subject(context_name, goal)
        body = text.strip()
    return subject, body


def _default_subject(context_name, goal):
    if goal:
        return f"{context_name}: {goal.get('title', 'Check-in')}"
    return f"{context_name}: Check-in"


def _get_original_subject(context_id):
    try:
        conn = _get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "SELECT subject FROM sent_agent_messages WHERE context_id = %s ORDER BY sent_at ASC LIMIT 1",
            (context_id,),
        )
        row = cur.fetchone()
        cur.close()
        conn.close()
        if row and row[0]:
            return row[0].replace("Re: ", "")
        return None
    except Exception as e:
        logger.error(f"Failed to fetch original subject: {e}")
        return None


def _get_db_connection():
    return psycopg2.connect(
        host=DB_HOST, port=DB_PORT, dbname=DB_NAME,
        user=DB_USER, password=DB_PASSWORD,
    )


def _save_sent_message(context_id, user_id, subject, content, email_message_id):
    try:
        conn = _get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO sent_agent_messages (context_id, user_id, subject, content, email_message_id) "
            "VALUES (%s, %s, %s, %s, %s)",
            (context_id, user_id, subject, content, email_message_id),
        )
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        logger.error(f"Failed to save sent agent message: {e}")


def _send_email(to_addr, subject, html_body, message_id, in_reply_to=None, references=None):
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning("SMTP credentials not configured — skipping email send")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"NagAI Agent <{SMTP_USER}>"
    msg["To"] = to_addr
    msg["Message-ID"] = message_id

    if in_reply_to:
        msg["In-Reply-To"] = in_reply_to
    if references:
        msg["References"] = references

    msg.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_USER, to_addr, msg.as_string())


def _render_agent_email(body, agent_name, user_name):
    sections_html = _markdown_to_sections(body)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#faf5f4;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#2a1f1e;line-height:1.6;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf5f4;">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(158,96,90,0.10);">

<!-- Header -->
<tr>
<td style="background:linear-gradient(135deg,#2a1f1e 0%,#3d2b29 100%);padding:24px 40px;text-align:center;">
  <h1 style="margin:0;font-size:22px;font-weight:700;color:#d4918b;letter-spacing:-0.3px;">{agent_name}</h1>
  <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.55);font-weight:400;">NagAI Agent</p>
</td>
</tr>

<!-- Body -->
<tr>
<td style="padding:28px 40px;">
  {sections_html}
</td>
</tr>

<!-- Footer -->
<tr>
<td style="background-color:#faf5f4;padding:20px 40px;border-top:1px solid #e8d8d5;">
  <p style="margin:0;font-size:12px;color:#8a706b;text-align:center;">
    This message is from your NagAI agent. Reply to this email to continue the conversation.
  </p>
  <p style="margin:8px 0 0;font-size:11px;color:#b09a96;text-align:center;">
    Manage your agent in the NagAI app.
  </p>
</td>
</tr>

</table>
</td></tr>
</table>
</body>
</html>"""


def _markdown_to_sections(body):
    if not body:
        return ""

    html_parts = []
    current_lines = []

    for line in body.split("\n"):
        stripped = line.strip()
        if not stripped:
            if current_lines:
                html_parts.append(_render_lines(current_lines))
                current_lines = []
            continue
        current_lines.append(line)

    if current_lines:
        html_parts.append(_render_lines(current_lines))

    return "\n".join(html_parts)


def _render_lines(lines):
    html = []
    in_list = False

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        if stripped.startswith("- ") or stripped.startswith("* "):
            if not in_list:
                html.append('<ul style="margin:8px 0;padding-left:20px;">')
                in_list = True
            item_text = _linkify(stripped[2:])
            html.append(f'<li style="margin-bottom:6px;font-size:15px;color:#4a3935;">{item_text}</li>')
        else:
            if in_list:
                html.append("</ul>")
                in_list = False
            html.append(f'<p style="margin:6px 0;font-size:15px;color:#2a1f1e;line-height:1.7;">{_linkify(stripped)}</p>')

    if in_list:
        html.append("</ul>")

    return "\n".join(html)


def _linkify(text):
    text = re.sub(
        r'\[([^\]]+)\]\((https?://[^\)]+)\)',
        r'<a href="\2" style="color:#9e605a;text-decoration:underline;">\1</a>',
        text,
    )
    text = re.sub(
        r'(?<!\"|>)(https?://[^\s<\)]+)',
        r'<a href="\1" style="color:#9e605a;text-decoration:underline;">\1</a>',
        text,
    )
    text = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', text)
    return text
