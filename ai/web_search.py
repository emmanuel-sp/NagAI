import os
import logging

import requests

logger = logging.getLogger(__name__)

NEWSAPI_KEY = os.environ.get("NEWSAPI_KEY", "")
NEWSAPI_URL = "https://newsapi.org/v2/everything"


def search_news(query: str) -> list[dict]:
    """Search for relevant news using NewsAPI.org.
    Returns list of {title, link, snippet, date} dicts (top 5 results).
    """
    if not NEWSAPI_KEY:
        logger.warning("NEWSAPI_KEY not set — skipping news search")
        return []

    params = {
        "q": query,
        "pageSize": 5,
        "sortBy": "relevancy",
        "language": "en",
        "apiKey": NEWSAPI_KEY,
    }

    try:
        resp = requests.get(NEWSAPI_URL, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        results = []
        for article in data.get("articles", [])[:5]:
            results.append({
                "title": article.get("title", ""),
                "link": article.get("url", ""),
                "snippet": article.get("description", ""),
                "date": article.get("publishedAt", ""),
            })
        return results
    except Exception as e:
        logger.error(f"NewsAPI search failed: {e}")
        return []


def build_search_queries(goals: list[dict], user_profile: str) -> list[str]:
    """Build search queries from user goals and profile."""
    queries = []
    for goal in goals:
        title = goal.get("title", "")
        if title:
            queries.append(title)
    return queries[:3]
