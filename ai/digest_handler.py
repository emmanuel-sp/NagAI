import json
import os
import logging
import smtplib
import re
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import psycopg2

import ai_handlers
import web_search

logger = logging.getLogger(__name__)

SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
BACKEND_BASE_URL = os.environ.get("BACKEND_BASE_URL", "http://localhost:8080")

DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_PORT = os.environ.get("DB_PORT", "5432")
DB_NAME = os.environ.get("DB_NAME", "nagai")
DB_USER = os.environ.get("DB_USER", "")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "")


def _get_db_connection():
    return psycopg2.connect(
        host=DB_HOST, port=DB_PORT, dbname=DB_NAME,
        user=DB_USER, password=DB_PASSWORD,
    )


def _get_previous_digest_subjects(user_id: int, limit: int = 3) -> list[str]:
    """Get subjects of the user's recent sent digests for anti-repetition."""
    try:
        conn = _get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "SELECT subject FROM sent_digests WHERE user_id = %s ORDER BY sent_at DESC LIMIT %s",
            (user_id, limit),
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return [row[0] for row in rows if row[0]]
    except Exception as e:
        logger.error(f"Failed to fetch previous digest subjects: {e}")
        return []


def _save_sent_digest(digest_id: int, user_id: int, subject: str, content: str):
    """Persist the sent digest to the database."""
    try:
        conn = _get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO sent_digests (digest_id, user_id, subject, content) VALUES (%s, %s, %s, %s)",
            (digest_id, user_id, subject, content),
        )
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        logger.error(f"Failed to save sent digest: {e}")


def _build_goals_context(goals: list[dict], last_delivered_at: str | None) -> str:
    """Build a formatted string of goal progress for the AI prompt."""
    if not goals:
        return "No goals set yet."

    lines = []
    for goal in goals:
        title = goal.get("title", "Untitled")
        desc = goal.get("description", "")
        smart = goal.get("smartContext", "")
        items = goal.get("checklistItems", [])

        total = len(items)
        completed = sum(1 for i in items if i.get("completed"))
        newly_completed = []
        active = []

        for item in items:
            if item.get("completed"):
                if last_delivered_at and item.get("completedAt", "") > last_delivered_at[:10]:
                    newly_completed.append(item["title"])
            else:
                active.append(item["title"])

        line = f"Goal: {title}"
        if desc:
            line += f"\n  Description: {desc}"
        if smart:
            line += f"\n  SMART: {smart}"
        line += f"\n  Progress: {completed}/{total} tasks complete"
        if newly_completed:
            line += f"\n  Recently completed: {', '.join(newly_completed)}"
        if active:
            line += f"\n  Still active: {', '.join(active[:5])}"
        lines.append(line)

    return "\n\n".join(lines)


def _gather_search_results(content_types: list[str], goals: list[dict]) -> str:
    """Run web searches for content types that need them."""
    results_text = ""
    queries = web_search.build_search_queries(goals, "")

    if "news" in content_types and queries:
        all_results = []
        for q in queries[:2]:
            all_results.extend(web_search.search_news(q))
        if all_results:
            results_text += "\n\nRelevant news (real search results — use these links):\n"
            for r in all_results[:5]:
                results_text += f"- {r['title']}: {r['link']}\n  {r['snippet']}\n"

    return results_text


CONTENT_TYPE_DESCRIPTIONS = {
    "affirmations": "Affirmations — Write 2-3 first-person 'I am/I will' statements tied to their specific goals.",
    "news": "Curated News — Summarize 1-2 real articles from the search results with links. Only use provided links.",
    "knowledge_snippets": "Knowledge Snippets — Share one useful fact or insight relevant to their goal domain.",
    "tips": "Practical Tips — Give 1-2 specific, actionable tips they can apply today toward their goals.",
    "motivational_quotes": "Motivational Quotes — Include one real quote from a notable person, relevant to their situation.",
    "resource_recommendations": "Resource Recommendations — Suggest one specific book, course, tool, or community related to their goals.",
    "progress_insights": "Progress Insights — Analyze their actual checklist progress. What's on track? What needs attention?",
    "reflection_prompts": "Reflection Prompts — Ask 1-2 thoughtful questions that help them reflect on their approach.",
}


def handle_digest_delivery(value: str):
    """Main entry point: called by Kafka consumer with the JSON payload."""
    try:
        payload = json.loads(value)
    except json.JSONDecodeError as e:
        logger.error(f"Invalid digest payload JSON: {e}")
        return

    digest_id = payload.get("digestId")
    user_id = payload.get("userId")
    user_email = payload.get("userEmail", "")
    user_name = payload.get("userName", "")
    user_location = payload.get("userLocation", "")
    user_profile = payload.get("userProfile", "")
    content_types = payload.get("contentTypes", [])
    last_delivered_at = payload.get("lastDeliveredAt")
    unsubscribe_token = payload.get("unsubscribeToken", "")
    goals = payload.get("goals", [])

    stale_count = payload.get("staleCount", 0)
    progress_since_last = payload.get("progressSinceLastDelivery", True)

    content_descriptions = "\n".join(
        CONTENT_TYPE_DESCRIPTIONS.get(ct, ct) for ct in content_types
    )
    goals_context = _build_goals_context(goals, last_delivered_at)
    search_results = _gather_search_results(content_types, goals)
    previous_subjects = _get_previous_digest_subjects(user_id)

    result = ai_handlers.generate_digest_content(
        user_name=user_name,
        user_profile=user_profile,
        goals_context=goals_context,
        content_types=content_descriptions,
        last_delivered_at=last_delivered_at or "first digest",
        search_results=search_results,
        previous_digest_subjects=previous_subjects,
        stale_count=stale_count,
        progress_since_last=progress_since_last,
    )

    subject = result.get("subject", f"Your NagAI Digest")
    body = result.get("body", "")

    unsubscribe_url = f"{BACKEND_BASE_URL}/digest/unsubscribe?token={unsubscribe_token}" if unsubscribe_token else ""
    html = render_email_html(subject, body, user_name, unsubscribe_url)

    try:
        _send_email(user_email, subject, html, unsubscribe_url)
        logger.info(f"Digest email sent to {user_email} (digest={digest_id})")
    except Exception as e:
        logger.error(f"Failed to send digest email to {user_email}: {e}")
        return

    _save_sent_digest(digest_id, user_id, subject, body)


def _send_email(to_addr: str, subject: str, html_body: str, unsubscribe_url: str = ""):
    """Send an HTML email via SMTP."""
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning("SMTP credentials not configured — skipping email send")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"NagAI <{SMTP_USER}>"
    msg["To"] = to_addr
    if unsubscribe_url:
        msg["List-Unsubscribe"] = f"<{unsubscribe_url}>"
        msg["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click"
    msg.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_USER, to_addr, msg.as_string())


def render_email_html(subject: str, body: str, user_name: str, unsubscribe_url: str = "") -> str:
    """Render the digest body into a beautiful, light-themed HTML email."""
    sections_html = _markdown_to_sections(body)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#faf5f4;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#2a1f1e;line-height:1.6;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf5f4;">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(158,96,90,0.10);">

<!-- Header -->
<tr>
<td style="background:linear-gradient(135deg,#2a1f1e 0%,#3d2b29 100%);padding:32px 40px;text-align:center;">
  <h1 style="margin:0;font-size:28px;font-weight:700;color:#d4918b;letter-spacing:-0.5px;">NagAI</h1>
  <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.65);font-weight:400;">Your Personal Digest</p>
</td>
</tr>

<!-- Greeting -->
<tr>
<td style="padding:32px 40px 16px;">
  <p style="margin:0;font-size:18px;color:#2a1f1e;font-weight:600;">Hey {user_name or "there"} &#128075;</p>
  <p style="margin:8px 0 0;font-size:15px;color:#6b5550;">Here's what's happening with your goals.</p>
</td>
</tr>

<!-- Content sections -->
<tr>
<td style="padding:0 40px 24px;">
  {sections_html}
</td>
</tr>

<!-- Footer -->
<tr>
<td style="background-color:#faf5f4;padding:24px 40px;border-top:1px solid #e8d8d5;">
  <p style="margin:0;font-size:12px;color:#8a706b;text-align:center;">
    You received this because you have an active digest on NagAI.<br>
    Manage your digest preferences in the app.
  </p>
  {"" if not unsubscribe_url else f'<p style="margin:12px 0 0;font-size:12px;text-align:center;"><a href="{unsubscribe_url}" style="color:#9e605a;text-decoration:underline;">Unsubscribe from digest emails</a></p>'}
  <p style="margin:12px 0 0;font-size:11px;color:#b09a96;text-align:center;">
    Built with care by NagAI
  </p>
</td>
</tr>

</table>
</td></tr>
</table>
</body>
</html>"""


def _markdown_to_sections(body: str) -> str:
    """Convert Claude's markdown-ish body into styled HTML sections."""
    if not body:
        return ""

    html_parts = []
    current_section_title = None
    current_lines: list[str] = []

    def flush_section():
        nonlocal current_section_title, current_lines
        if current_section_title or current_lines:
            content = _render_lines(current_lines)
            if current_section_title:
                html_parts.append(
                    f'<div style="margin-bottom:24px;">'
                    f'<h2 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#1a1a2e;'
                    f'padding-left:12px;border-left:3px solid #9e605a;">{current_section_title}</h2>'
                    f'<div style="font-size:14px;color:#4a3935;line-height:1.7;">{content}</div>'
                    f'</div>'
                )
            else:
                html_parts.append(
                    f'<div style="margin-bottom:16px;font-size:14px;color:#4a3935;line-height:1.7;">'
                    f'{content}</div>'
                )
        current_section_title = None
        current_lines = []

    for line in body.split("\n"):
        stripped = line.strip()
        if stripped.startswith("## "):
            flush_section()
            current_section_title = stripped[3:].strip()
        elif stripped.startswith("# "):
            flush_section()
            current_section_title = stripped[2:].strip()
        else:
            current_lines.append(line)

    flush_section()
    return "\n".join(html_parts)


def _render_lines(lines: list[str]) -> str:
    """Render a block of lines into HTML, handling bullet points and links."""
    html = []
    in_list = False

    for line in lines:
        stripped = line.strip()
        if not stripped:
            if in_list:
                html.append("</ul>")
                in_list = False
            continue

        if stripped.startswith("- ") or stripped.startswith("* "):
            if not in_list:
                html.append('<ul style="margin:8px 0;padding-left:20px;">')
                in_list = True
            item_text = _linkify(stripped[2:])
            html.append(f'<li style="margin-bottom:6px;">{item_text}</li>')
        else:
            if in_list:
                html.append("</ul>")
                in_list = False
            html.append(f"<p style=\"margin:6px 0;\">{_linkify(stripped)}</p>")

    if in_list:
        html.append("</ul>")

    return "\n".join(html)


def _linkify(text: str) -> str:
    """Convert markdown links [text](url) and bare URLs to HTML anchors."""
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
