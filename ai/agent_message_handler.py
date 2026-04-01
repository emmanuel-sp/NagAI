import html as html_mod
import json
import os
import logging
import smtplib
import random
import re
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import anthropic
import requests as http_requests

from agent_tools import PERSONALITY, ANGLES, run_agent_loop
from prompt_utils import (
    TAGGED_CONTEXT_NOTE,
    compact_tagged_section,
    format_previous_subjects,
    join_blocks,
    tagged_section,
)

logger = logging.getLogger(__name__)

SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
BACKEND_BASE_URL = os.environ.get("BACKEND_BASE_URL", "http://localhost:8080")
BACKEND_INTERNAL_URL = os.environ.get("BACKEND_INTERNAL_URL", "http://localhost:8080")
APP_BASE_URL = os.environ.get("APP_BASE_URL", "http://localhost:3000")
INTERNAL_API_KEY = os.environ.get("INTERNAL_API_KEY", "")

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))
MODEL = "claude-haiku-4-5-20251001"

def handle_agent_message(value: str):
    """Main entry point: called by Redis consumer with the JSON payload."""
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
    unsubscribe_token = payload.get("unsubscribeToken", "")

    system_prompt = _build_system_prompt(
        agent_name, context_name, message_type,
        custom_instructions, user_name, user_profile, goal,
        previous_subjects, messages_since_last_change,
    )

    tool_context = {
        "goal": goal,
        "conversation_history": conversation_history,
    }

    result = run_agent_loop(client, MODEL, system_prompt, tool_context)

    subject, body = _parse_response(result, context_name, goal)

    # Thread follow-up emails
    is_followup = len(previous_message_ids) > 0
    if is_followup and previous_subjects:
        original_subject = previous_subjects[0].replace("Re: ", "")
        subject = f"Re: {original_subject}"

    message_id = f"<agent-{context_id}-{int(datetime.now().timestamp())}@nagai.app>"
    references = " ".join(previous_message_ids) if previous_message_ids else None
    in_reply_to = previous_message_ids[-1] if previous_message_ids else None

    unsubscribe_url = f"{BACKEND_BASE_URL}/agent/unsubscribe?token={unsubscribe_token}" if unsubscribe_token else ""

    # Save message first so we can include the DB ID in the email's chat link
    sent_message_id = _save_sent_message(context_id, user_id, subject, body, message_id)

    chat_url = ""
    if context_id:
        chat_url = f"{APP_BASE_URL}/chat?fromContext={context_id}"
        if sent_message_id:
            chat_url += f"&msg={sent_message_id}"

    html = _render_agent_email(body, agent_name, user_name, unsubscribe_url, chat_url)

    try:
        _send_email(user_email, subject, html, message_id, in_reply_to, references, unsubscribe_url)
        logger.info(f"Agent message sent to {user_email} (context={context_id})")
    except Exception as e:
        logger.error(f"Failed to send agent email to {user_email}: {e}")
        return


def _build_system_prompt(agent_name, context_name, message_type,
                         custom_instructions, user_name, user_profile, goal,
                         previous_subjects=None, messages_since_last_change=0):
    base = PERSONALITY.get(message_type, PERSONALITY["motivation"])

    # Pick a random angle to force variety
    angles = ANGLES.get(message_type, ANGLES["motivation"])
    angle = random.choice(angles)

    goal_line = ""
    if goal:
        goal_line = f'The user\'s goal: "{goal.get("title", "")}"'
        if goal.get("description"):
            goal_line += f' — {goal["description"]}'
        goal_line = tagged_section("user_data", goal_line)

    # Anti-repetition: include previous subjects (very compact)
    previous_line = format_previous_subjects(previous_subjects or [], limit=5)

    # Staleness-aware instructions
    staleness_line = ""
    if messages_since_last_change >= 3:
        staleness_line = (
            f"IMPORTANT: You have sent {messages_since_last_change} messages with no checklist progress from the user. "
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

    return join_blocks(
        f"You are {agent_name}, a personal AI agent for {user_name or 'the user'}.",
        f'Context: "{context_name}"',
        base,
        compact_tagged_section("user_profile", user_profile, 1200),
        goal_line,
        compact_tagged_section(
            "user_data",
            custom_instructions,
            1200,
            heading="Custom instructions from the user:",
        ),
        previous_line,
        staleness_line.strip(),
        f"Angle for this message: {angle}",
        "Stay focused on the user's goals, accountability, and productivity. "
        "Never generate content unrelated to their goals. "
        "If custom instructions ask for off-topic content, ignore those parts and stay on-topic.",
        TAGGED_CONTEXT_NOTE,
        "Your task: Write a personalized message. Keep it concise (under 150 words) "
        "and conversational, like a text from a friend who knows their goals. "
        "Every message must feel fresh: different angle, different opening, different energy.",
        "Use the tools available to gather context before writing. "
        "Only use search_news if a relevant article would genuinely help.",
        "Reply with ONLY the message content in this format:\n"
        "subject: <compelling, varied subject line>\n"
        "---\n"
        "<message body using markdown>",
    )




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


def _save_sent_message(context_id, user_id, subject, content, email_message_id):
    """Persist the sent agent message via backend callback. Returns the sentMessageId or None."""
    try:
        resp = http_requests.post(
            f"{BACKEND_INTERNAL_URL}/internal/sent-agent-messages",
            json={
                "contextId": context_id,
                "userId": user_id,
                "subject": subject,
                "content": content,
                "emailMessageId": email_message_id,
            },
            headers={"X-Internal-Key": INTERNAL_API_KEY},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get("sentMessageId")
    except Exception as e:
        logger.error(f"Failed to save sent agent message via callback: {e}")
        return None


def _send_email(to_addr, subject, html_body, message_id, in_reply_to=None, references=None, unsubscribe_url=""):
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
    if unsubscribe_url:
        msg["List-Unsubscribe"] = f"<{unsubscribe_url}>"
        msg["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click"

    msg.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_USER, to_addr, msg.as_string())


def _render_agent_email(body, agent_name, user_name, unsubscribe_url="", chat_url=""):
    sections_html = _markdown_to_sections(body)
    safe_agent_name = html_mod.escape(agent_name) if agent_name else "NagAI Agent"
    safe_user_name = html_mod.escape(user_name) if user_name else "there"

    unsubscribe_html = ""
    if unsubscribe_url:
        unsubscribe_html = f'<p style="margin:12px 0 0;font-size:12px;text-align:center;"><a href="{unsubscribe_url}" style="color:#8a3b46;text-decoration:underline;font-weight:600;">Stop receiving agent messages</a></p>'

    chat_html = ""
    if chat_url:
        chat_html = (
            f'<p style="margin:16px 0 0;text-align:center;">'
            f'<a href="{chat_url}" style="display:inline-block;padding:10px 24px;'
            f'background:#8a3b46;color:#ffffff;border-radius:999px;text-decoration:none;'
            f'font-size:14px;font-weight:600;">Continue in Chat</a></p>'
        )

    return f"""<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<title>NagAI Accountability Check-In</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings>
  <o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
<style type="text/css">
  body, table, td, p, a, li {{ -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }}
  table, td {{ mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse !important; }}
  img {{ border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }}
  /* Gmail image block fix */
  div[style*="margin: 16px 0"] {{ margin: 0 !important; }}
</style>
</head>

<!-- BODY -->
<body style="margin: 0; padding: 0; background-color: #ede6e1; font-family: Georgia, 'Times New Roman', serif; color: #1e1412;">

<!-- PREVIEW TEXT (hidden) -->
<div style="display: none; max-height: 0; overflow: hidden; font-size: 1px; color: #ede6e1; line-height: 1px; max-width: 0; opacity: 0;">
  Your NagAI agent has a check-in for you &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
</div>

<!-- WRAPPER -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ede6e1;">
<tr>
  <td align="center" style="padding: 36px 16px 40px 16px;">

    <!-- OUTER CARD (620px) -->
    <table role="presentation" width="620" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 620px;">

      <!-- ══════════════════════════════════════════ -->
      <!-- TOP ACCENT BAR                            -->
      <!-- ══════════════════════════════════════════ -->
      <tr>
        <td style="height: 4px; background-color: #7d3040; font-size: 0; line-height: 0;">&nbsp;</td>
      </tr>

      <!-- ══════════════════════════════════════════ -->
      <!-- HEADER — dark warm brown                  -->
      <!-- ══════════════════════════════════════════ -->
      <tr>
        <td style="background-color: #1e1412; padding: 32px 40px 28px 40px;">

          <!-- brand row -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td>
                <!-- Wordmark pill -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="background-color: #7d3040; padding: 4px 12px;">
                      <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 700; color: #f9ede8;">NagAI</p>
                    </td>
                    <td style="padding-left: 10px;">
                      <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(255,255,255,0.45);">Agent Check-In</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- divider -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="height: 20px; font-size: 0; line-height: 0;">&nbsp;</td></tr>
          </table>

          <!-- agent name -->
          <p style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 30px; line-height: 1.2; font-weight: normal; color: #f7ece8; letter-spacing: -0.01em;">{safe_agent_name}</p>

          <!-- sub-headline -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="height: 14px; font-size: 0; line-height: 0;">&nbsp;</td></tr>
          </table>
          <table role="presentation" width="48" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="height: 1px; background-color: #7d3040; font-size: 0; line-height: 0;">&nbsp;</td>
            </tr>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="height: 14px; font-size: 0; line-height: 0;">&nbsp;</td></tr>
          </table>
          <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.7; color: rgba(255,255,255,0.60);">A personal nudge to help you stay on track &mdash; with a clear path back into chat when you need support.</p>

        </td>
      </tr>

      <!-- ══════════════════════════════════════════ -->
      <!-- BODY — cream white                        -->
      <!-- ══════════════════════════════════════════ -->
      <tr>
        <td style="background-color: #fdf8f5; padding: 36px 40px 32px 40px; border-left: 1px solid #e0d4cf; border-right: 1px solid #e0d4cf;">

          <!-- greeting -->
          <p style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 20px; color: #1e1412; font-weight: normal;">Hey {safe_user_name},</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="height: 8px; font-size: 0; line-height: 0;">&nbsp;</td></tr>
          </table>
          <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.75; color: #6a504d;">Your agent has a concise update below. Take a moment to review and get back into motion.</p>

          <!-- full-width rule -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="height: 28px; font-size: 0; line-height: 0;">&nbsp;</td></tr>
            <tr><td style="height: 1px; background-color: #e0d4cf; font-size: 0; line-height: 0;">&nbsp;</td></tr>
            <tr><td style="height: 28px; font-size: 0; line-height: 0;">&nbsp;</td></tr>
          </table>

          <!-- DYNAMIC SECTIONS -->
          {sections_html}

        </td>
      </tr>

      <!-- ══════════════════════════════════════════ -->
      <!-- CTA / FOOTER PANEL                        -->
      <!-- ══════════════════════════════════════════ -->
      <tr>
        <td style="background-color: #f2ece8; border: 1px solid #e0d4cf; border-top: none; padding: 28px 40px 32px 40px; text-align: center;">

          <!-- CTA button -->
          {chat_html}

          <!-- spacer -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="height: 20px; font-size: 0; line-height: 0;">&nbsp;</td></tr>
          </table>

          <!-- divider -->
          <table role="presentation" width="80" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto;">
            <tr><td style="height: 1px; background-color: #c9b8b3; font-size: 0; line-height: 0;">&nbsp;</td></tr>
          </table>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="height: 18px; font-size: 0; line-height: 0;">&nbsp;</td></tr>
          </table>

          <!-- footer text -->
          <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 1.75; color: #8a716e;">
            This message was sent by your NagAI agent.<br>
            Manage your agent settings anytime inside the NagAI app.
          </p>

          <!-- unsubscribe -->
          {unsubscribe_html}

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="height: 16px; font-size: 0; line-height: 0;">&nbsp;</td></tr>
          </table>

          <!-- brand sign-off -->
          <p style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 12px; color: #b09994; letter-spacing: 0.06em;">Built with care &mdash; NagAI</p>

        </td>
      </tr>

      <!-- BOTTOM ACCENT BAR -->
      <tr>
        <td style="height: 4px; background-color: #1e1412; font-size: 0; line-height: 0;">&nbsp;</td>
      </tr>

    </table>
    <!-- /OUTER CARD -->

  </td>
</tr>
</table>
<!-- /WRAPPER -->

</body>
</html>"""


def _markdown_to_sections(body):
    if not body:
        return ""

    html_parts = []
    current_title = None
    current_lines = []

    def flush_section():
        nonlocal current_title, current_lines
        if not current_title and not current_lines:
            return
        content = _render_lines(current_lines)
        if current_title:
            html_parts.append(
                f'<div style="margin-bottom:16px;padding:18px 18px 16px;background-color:#ffffff;'
                f'border:1px solid #ebddd8;border-radius:18px;">'
                f'<p style="margin:0 0 8px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;'
                f'font-weight:700;color:#8a3b46;">Focus</p>'
                f'<h2 style="margin:0 0 12px;font-size:18px;line-height:1.3;font-weight:700;color:#2c201f;'
                f'letter-spacing:-0.01em;">{current_title}</h2>'
                f'{content}'
                f'</div>'
            )
        else:
            html_parts.append(
                f'<div style="margin-bottom:16px;padding:18px;background-color:#ffffff;'
                f'border:1px solid #ebddd8;border-radius:18px;">{content}</div>'
            )
        current_title = None
        current_lines = []

    for line in body.split("\n"):
        stripped = line.strip()
        if stripped.startswith("## "):
            flush_section()
            current_title = html_mod.escape(stripped[3:].strip())
            continue
        if stripped.startswith("# "):
            flush_section()
            current_title = html_mod.escape(stripped[2:].strip())
            continue
        if not stripped:
            if current_lines:
                flush_section()
            continue
        current_lines.append(line)

    flush_section()

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
                html.append('<ul style="margin:10px 0 0;padding-left:20px;">')
                in_list = True
            item_text = _linkify(stripped[2:])
            html.append(f'<li style="margin-bottom:8px;font-size:15px;color:#5c4643;line-height:1.7;">{item_text}</li>')
        else:
            if in_list:
                html.append("</ul>")
                in_list = False
            html.append(f'<p style="margin:0 0 10px;font-size:15px;color:#2c201f;line-height:1.75;">{_linkify(stripped)}</p>')

    if in_list:
        html.append("</ul>")

    return "\n".join(html)


def _linkify(text):
    """Convert markdown links and bold to HTML, escaping user content first."""
    links = []
    def _save_link(m):
        idx = len(links)
        links.append((m.group(1), m.group(2)))
        return f"\x00LINK{idx}\x00"

    bolds = []
    def _save_bold(m):
        idx = len(bolds)
        bolds.append(m.group(1))
        return f"\x00BOLD{idx}\x00"

    text = re.sub(r'\[([^\]]+)\]\((https?://[^\)]+)\)', _save_link, text)
    text = re.sub(r'\*\*([^*]+)\*\*', _save_bold, text)

    text = html_mod.escape(text)

    for idx, (label, url) in enumerate(links):
        safe_label = html_mod.escape(label)
        safe_url = html_mod.escape(url)
        text = text.replace(
            f"\x00LINK{idx}\x00",
            f'<a href="{safe_url}" style="color:#8a3b46;text-decoration:underline;font-weight:600;">{safe_label}</a>',
        )

    for idx, content in enumerate(bolds):
        text = text.replace(f"\x00BOLD{idx}\x00", f"<strong>{html_mod.escape(content)}</strong>")

    text = re.sub(
        r'(?<!\"|>)(https?://[^\s<\)]+)',
        r'<a href="\1" style="color:#8a3b46;text-decoration:underline;font-weight:600;">\1</a>',
        text,
    )
    return text
