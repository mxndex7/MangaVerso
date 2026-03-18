"""Cliente simples para a API Jikan (MyAnimeList).

A Jikan é uma API não oficial gratuita que fornece dados de animes, mangás e mais do MyAnimeList.
"""

import requests

JIKAN_BASE_URL = "https://api.jikan.moe/v4"
DEFAULT_TIMEOUT = 10


def _format_date(date_str):
    """Formata uma string de data para YYYY-MM-DD."""
    if not date_str:
        return None
    return date_str[:10]


def _process_item(item):
    """Processa um item da API Jikan para um dicionário padronizado."""
    genres = [g.get("name") for g in item.get("genres", []) if g.get("name")]
    authors = [a.get("name") for a in item.get("authors", []) if a.get("name")]
    published = item.get("published") or {}
    published_from = published.get("from")
    published_to = published.get("to")

    return {
        "mal_id": item.get("mal_id"),
        "title": item.get("title"),
        "type": item.get("type"),
        "status": item.get("status"),
        "genres": genres,
        "authors": authors,
        "published_from": _format_date(published_from),
        "published_to": _format_date(published_to),
        "episodes": item.get("episodes"),
        "volumes": item.get("volumes"),
        "chapters": item.get("chapters"),
        "score": item.get("score"),
        "synopsis": item.get("synopsis"),
        "image_url": item.get("images", {}).get("jpg", {}).get("image_url"),
        "url": item.get("url"),
    }


def _format_date(date_str):
    """Formata uma string de data para YYYY-MM-DD."""
    if not date_str:
        return None
    return date_str[:10]


def _process_item(item):
    """Processa um item da API Jikan para um dicionário padronizado."""
    genres = [g.get("name") for g in item.get("genres", []) if g.get("name")]
    authors = [a.get("name") for a in item.get("authors", []) if a.get("name")]
    published = item.get("published") or {}
    published_from = published.get("from")
    published_to = published.get("to")

    return {
        "mal_id": item.get("mal_id"),
        "title": item.get("title"),
        "type": item.get("type"),
        "status": item.get("status"),
        "genres": genres,
        "authors": authors,
        "published_from": _format_date(published_from),
        "published_to": _format_date(published_to),
        "episodes": item.get("episodes"),
        "volumes": item.get("volumes"),
        "chapters": item.get("chapters"),
        "score": item.get("score"),
        "synopsis": item.get("synopsis"),
        "image_url": item.get("images", {}).get("jpg", {}).get("image_url"),
        "url": item.get("url"),
    }


def _search_jikan(endpoint: str, query: str, limit: int = 10):
    """Busca na API Jikan para o endpoint especificado (anime ou manga)."""

    if not query:
        return []

    params = {
        "q": query,
        "limit": min(max(limit, 1), 25),
    }

    try:
        resp = requests.get(f"{JIKAN_BASE_URL}/{endpoint}", params=params, timeout=DEFAULT_TIMEOUT)
        resp.raise_for_status()
        data = resp.json().get("data", [])

        results = []
        for item in data:
            results.append(_process_item(item))

        return results
    except requests.RequestException:
        return []


def search_manga(query: str, limit: int = 10):
    return _search_jikan("manga", query, limit=limit)


def find_manga_by_title(title: str):
    """Busca um mangá pelo título e retorna o melhor resultado.

    Prioriza correspondência exata de título. Se não encontrar, retorna o item
    com maior score dentre os resultados.
    """
    if not title:
        return None

    results = search_manga(title, limit=6)
    if not results:
        return None

    normalized = title.strip().lower()
    for item in results:
        if item.get("title", "").strip().lower() == normalized:
            return item

    return max(results, key=lambda it: (it.get("score") or 0))


def search_anime(query: str, limit: int = 10):
    return _search_jikan("anime", query, limit=limit)


def top_manga(limit: int = 20, page: int = 1):
    if limit < 1:
        limit = 1
    if page < 1:
        page = 1

    params = {
        "limit": min(limit, 25),
        "page": page,
    }

    try:
        resp = requests.get(f"{JIKAN_BASE_URL}/top/manga", params=params, timeout=DEFAULT_TIMEOUT)
        resp.raise_for_status()
        data = resp.json().get("data", [])

        results = []
        for item in data:
            processed_item = _process_item(item)
            processed_item["rank"] = item.get("rank")
            results.append(processed_item)

        return results
    except requests.RequestException:
        return []
