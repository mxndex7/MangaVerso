"""Blueprint para rotas de busca de mangás e animes via Jikan API."""
from flask import Blueprint, request, jsonify
from utils.jikan_improved import (
    search_manga, search_anime, top_manga, search_multiple_manga_parallel
)

jikan_bp = Blueprint('jikan', __name__, url_prefix='/api/jikan')


@jikan_bp.route('/manga', methods=['GET'])
def api_search_manga():
    """Busca mangás usando a API gratuita Jikan (MyAnimeList)."""
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify({'data': [], 'message': "Parâmetro 'q' é obrigatório."}), 400

    try:
        limit = int(request.args.get('limit', 10))
        limit = max(1, min(limit, 25))  # Limitar entre 1 e 25
    except (TypeError, ValueError):
        limit = 10

    results = search_manga(query, limit=limit)
    return jsonify({'data': results}), 200


@jikan_bp.route('/anime', methods=['GET'])
def api_search_anime():
    """Busca animes usando a API gratuita Jikan (MyAnimeList)."""
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify({'data': [], 'message': "Parâmetro 'q' é obrigatório."}), 400

    try:
        limit = int(request.args.get('limit', 10))
        limit = max(1, min(limit, 25))
    except (TypeError, ValueError):
        limit = 10

    results = search_anime(query, limit=limit)
    return jsonify({'data': results}), 200


@jikan_bp.route('/manga/top', methods=['GET'])
def api_top_manga():
    """Retorna os mangás mais populares da API Jikan."""
    try:
        limit = int(request.args.get('limit', 16))
        limit = max(1, min(limit, 25))
    except (TypeError, ValueError):
        limit = 16

    try:
        page = int(request.args.get('page', 1))
        page = max(1, page)
    except (TypeError, ValueError):
        page = 1

    results = top_manga(limit=limit, page=page)
    return jsonify({'data': results}), 200


@jikan_bp.route('/manga/featured', methods=['GET'])
def api_featured_manga():
    """Retorna mangás em destaque."""
    from config import Config
    featured_results = search_multiple_manga_parallel(Config.FEATURED_TITLES)
    results = list(featured_results.values())
    return jsonify({'data': results}), 200
