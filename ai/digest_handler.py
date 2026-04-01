import html as html_mod
import json
import os
import logging
import smtplib
import re
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import requests

import ai_handlers
import web_search

logger = logging.getLogger(__name__)

SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
BACKEND_BASE_URL = os.environ.get("BACKEND_BASE_URL", "http://localhost:8080")
BACKEND_INTERNAL_URL = os.environ.get("BACKEND_INTERNAL_URL", "http://localhost:8080")
INTERNAL_API_KEY = os.environ.get("INTERNAL_API_KEY", "")


def _save_sent_digest(digest_id: int, user_id: int, subject: str, content: str):
    """Persist the sent digest via backend callback."""
    try:
        resp = requests.post(
            f"{BACKEND_INTERNAL_URL}/internal/sent-digests",
            json={"digestId": digest_id, "userId": user_id, "subject": subject, "content": content},
            headers={"X-Internal-Key": INTERNAL_API_KEY},
            timeout=10,
        )
        resp.raise_for_status()
    except Exception as e:
        logger.error(f"Failed to save sent digest via callback: {e}")


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
    """Main entry point: called by Redis consumer with the JSON payload."""
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

    # Previous subjects now come from the stream payload (backend pre-loads them)
    previous_subjects = payload.get("previousSubjects", [])

    content_descriptions = "\n".join(
        CONTENT_TYPE_DESCRIPTIONS.get(ct, ct) for ct in content_types
    )
    goals_context = _build_goals_context(goals, last_delivered_at)
    search_results = _gather_search_results(content_types, goals)

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
    """Render the digest body into a polished on-brand HTML email."""
    sections_html = _markdown_to_sections(body)
    safe_subject = html_mod.escape(subject)
    safe_user_name = html_mod.escape(user_name) if user_name else "there"

    return f"""<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<title>{safe_subject}</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings>
  <o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
<style type="text/css">
  body, table, td, p, a, li {{ -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }}
  table, td {{ mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse !important; }}
  img {{ border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }}
  div[style*="margin: 16px 0"] {{ margin: 0 !important; }}
</style>
</head>

<body style="margin: 0; padding: 0; background-color: #eef2f6; font-family: Arial, Helvetica, sans-serif; color: #1f2937;">

<!-- PREVIEW TEXT -->
<div style="display: none; max-height: 0; overflow: hidden; font-size: 1px; color: #eef2f6; line-height: 1px; max-width: 0; opacity: 0;">
  Your NagAI digest is ready &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
</div>

<!-- PAGE WRAPPER -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; background-color: #eef2f6;">
<tr>
  <td align="center" style="padding: 0;">

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 1040px;">

      <!-- OUTER TOP SPACE -->
      <tr>
        <td style="height: 24px; font-size: 0; line-height: 0;">&nbsp;</td>
      </tr>

      <!-- MAIN SHELL -->
      <tr>
        <td style="padding: 0 20px;">

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; background-color: #ffffff; border: 1px solid #dbe3ec;">

            <!-- TOP ACCENT -->
            <tr>
              <td style="height: 6px; background-color: #8f2942; font-size: 0; line-height: 0;">&nbsp;</td>
            </tr>

            <!-- HEADER -->
            <tr>
              <td style="padding: 56px 64px 44px 64px; background-color: #f8fafc;">

                <!-- Brand row -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="left">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="background-color: #8f2942; padding: 6px 14px;">
                            <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 11px; line-height: 11px; letter-spacing: 0.22em; text-transform: uppercase; font-weight: 700; color: #ffffff;">NagAI</p>
                          </td>
                          <td style="padding-left: 12px;">
                            <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 11px; line-height: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #7b8794;">Digest</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Spacer -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr><td style="height: 30px; font-size: 0; line-height: 0;">&nbsp;</td></tr>
                </table>

                <!-- Subject -->
                <p style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 44px; line-height: 1.08; font-weight: normal; color: #0f172a; letter-spacing: -0.03em;">
                  {safe_subject}
                </p>

                <!-- Spacer -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr><td style="height: 18px; font-size: 0; line-height: 0;">&nbsp;</td></tr>
                </table>

                <!-- Rule -->
                <table role="presentation" width="72" cellpadding="0" cellspacing="0" border="0">
                  <tr><td style="height: 3px; background-color: #8f2942; font-size: 0; line-height: 0;">&nbsp;</td></tr>
                </table>

              </td>
            </tr>

            <!-- BODY -->
            <tr>
              <td style="padding: 52px 64px 56px 64px; background-color: #ffffff;">

                <!-- Greeting -->
                <p style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 25px; line-height: 1.32; color: #111827; font-weight: normal;">
                  Hey {safe_user_name},
                </p>

                <!-- Spacer -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr><td style="height: 14px; font-size: 0; line-height: 0;">&nbsp;</td></tr>
                </table>

                <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.85; color: #5b6776;">
                  Here's your curated digest below. Take a moment to review and carry what matters into your week.
                </p>

                <!-- Divider -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr><td style="height: 36px; font-size: 0; line-height: 0;">&nbsp;</td></tr>
                  <tr><td style="height: 1px; background-color: #e5ebf1; font-size: 0; line-height: 0;">&nbsp;</td></tr>
                  <tr><td style="height: 36px; font-size: 0; line-height: 0;">&nbsp;</td></tr>
                </table>

                <!-- DYNAMIC SECTIONS -->
                {sections_html}

              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="padding: 38px 64px 44px 64px; background-color: #f8fafc; border-top: 1px solid #e5ebf1; text-align: center;">

                <!-- Divider -->
                <table role="presentation" width="64" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto;">
                  <tr><td style="height: 1px; background-color: #ccd6e2; font-size: 0; line-height: 0;">&nbsp;</td></tr>
                </table>

                <!-- Spacer -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr><td style="height: 22px; font-size: 0; line-height: 0;">&nbsp;</td></tr>
                </table>

                <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 1.85; color: #6b7280;">
                  You received this because you have an active NagAI digest.<br>
                  Manage your digest preferences in the app anytime.
                </p>

                {"" if not unsubscribe_url else f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="height: 14px; font-size: 0; line-height: 0;">&nbsp;</td></tr></table><p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 1.6;"><a href="{unsubscribe_url}" style="color: #8f2942; text-decoration: underline; font-weight: 600;">Unsubscribe from digest emails</a></p>'}

                <!-- Spacer -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr><td style="height: 18px; font-size: 0; line-height: 0;">&nbsp;</td></tr>
                </table>

                <p style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 13px; line-height: 1.4; color: #8a94a3; letter-spacing: 0.05em;">
                  Built with care &mdash; NagAI
                </p>

              </td>
            </tr>

            <!-- BOTTOM ACCENT -->
            <tr>
              <td style="height: 6px; background-color: #8f2942; font-size: 0; line-height: 0;">&nbsp;</td>
            </tr>

          </table>

        </td>
      </tr>

      <!-- OUTER BOTTOM SPACE -->
      <tr>
        <td style="height: 24px; font-size: 0; line-height: 0;">&nbsp;</td>
      </tr>

    </table>

  </td>
</tr>
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
                    f'<div style="margin-bottom:16px;padding:18px 18px 16px;background-color:#ffffff;'
                    f'border:1px solid #ebddd8;border-radius:18px;">'
                    f'<p style="margin:0 0 8px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;'
                    f'font-weight:700;color:#8a3b46;">Section</p>'
                    f'<h2 style="margin:0 0 12px;font-size:18px;line-height:1.3;font-weight:700;color:#2c201f;'
                    f'letter-spacing:-0.01em;">{current_section_title}</h2>'
                    f'<div style="font-size:14px;color:#5c4643;line-height:1.75;">{content}</div>'
                    f'</div>'
                )
            else:
                html_parts.append(
                    f'<div style="margin-bottom:16px;padding:18px;background-color:#ffffff;'
                    f'border:1px solid #ebddd8;border-radius:18px;font-size:14px;color:#5c4643;line-height:1.75;">'
                    f'{content}</div>'
                )
        current_section_title = None
        current_lines = []

    for line in body.split("\n"):
        stripped = line.strip()
        if stripped.startswith("## "):
            flush_section()
            current_section_title = html_mod.escape(stripped[3:].strip())
        elif stripped.startswith("# "):
            flush_section()
            current_section_title = html_mod.escape(stripped[2:].strip())
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
                html.append('<ul style="margin:10px 0 0;padding-left:20px;">')
                in_list = True
            item_text = _linkify(stripped[2:])
            html.append(f'<li style="margin-bottom:8px;color:#5c4643;">{item_text}</li>')
        else:
            if in_list:
                html.append("</ul>")
                in_list = False
            html.append(f"<p style=\"margin:0 0 10px;\">{_linkify(stripped)}</p>")

    if in_list:
        html.append("</ul>")

    return "\n".join(html)


def _linkify(text: str) -> str:
    """Convert markdown links [text](url) and bare URLs to HTML anchors.

    Escapes HTML entities first to prevent injection, then applies
    markdown link/bold patterns on the safe text.
    """
    # Extract markdown links and bold before escaping so we can restore them
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

    # Save markdown constructs before escaping
    text = re.sub(r'\[([^\]]+)\]\((https?://[^\)]+)\)', _save_link, text)
    text = re.sub(r'\*\*([^*]+)\*\*', _save_bold, text)

    # Escape HTML entities
    text = html_mod.escape(text)

    # Restore markdown links as safe HTML
    for idx, (label, url) in enumerate(links):
        safe_label = html_mod.escape(label)
        safe_url = html_mod.escape(url)
        text = text.replace(
            f"\x00LINK{idx}\x00",
            f'<a href="{safe_url}" style="color:#8a3b46;text-decoration:underline;font-weight:600;">{safe_label}</a>',
        )

    # Restore bold
    for idx, content in enumerate(bolds):
        text = text.replace(f"\x00BOLD{idx}\x00", f"<strong>{html_mod.escape(content)}</strong>")

    # Convert bare URLs (already escaped, so &amp; etc. are safe)
    text = re.sub(
        r'(?<!\"|>)(https?://[^\s<\)]+)',
        r'<a href="\1" style="color:#8a3b46;text-decoration:underline;font-weight:600;">\1</a>',
        text,
    )
    return text
