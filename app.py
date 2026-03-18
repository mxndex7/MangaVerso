import os
import requests

from flask import Flask, jsonify, render_template, request
from flask_cors import CORS

from jikan_client import find_manga_by_title, search_manga, search_anime, top_manga

app = Flask(__name__, template_folder='templates', static_folder='static')
CORS(app)

# Títulos destacados para aparecer no topo da primeira página
FEATURED_TITLES = [
    'Dragon Ball Z',
    'Naruto',
    'Demon Slayer',
    'Attack on Titan',
    'Gachiakuta',
    'Blue Lock',
]


featured_cache = {}


def preload_featured_titles():
    """Pré-carrega os dados dos títulos destacados para evitar chamadas HTTP no runtime."""
    global featured_cache
    for title in FEATURED_TITLES:
        try:
            item = find_manga_by_title(title)
            if item and item.get('mal_id'):
                featured_cache[item['mal_id']] = item
        except Exception:
            pass  



preload_featured_titles()

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/adicionar', methods=['POST'])
def adicionar():
    """Rota de exemplo que confirma o recebimento dos itens adicionados ao carrinho."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'status': 'erro', 'msg': 'JSON inválido ou ausente.'}), 400

    nome = data.get('nome')
    preco = data.get('preco')
    if not nome or preco is None:
        return jsonify({'status': 'erro', 'msg': 'Dados incompletos: nome e preco são obrigatórios.'}), 400

    return jsonify({'status': 'ok', 'msg': f"{nome} adicionado ao carrinho!"})


@app.route('/api/jikan/manga', methods=['GET'])
def api_jikan_manga():
    """Busca mangás usando a API gratuita Jikan (MyAnimeList)."""
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify({'data': [], 'message': "Parâmetro 'q' é obrigatório."}), 400

    try:
        limit = int(request.args.get('limit', 10))
    except (TypeError, ValueError):
        limit = 10

    results = search_manga(query, limit=limit)
    return jsonify({'data': results})


@app.route('/api/jikan/manga/top', methods=['GET'])
def api_jikan_manga_top():
    """Retorna os mangás mais populares (top) da API Jikan.

    Inclui um conjunto de itens "favoritos" no topo quando a página inicial for solicitada.
    """
    try:
        limit = int(request.args.get('limit', 16))
    except (TypeError, ValueError):
        limit = 16

    try:
        page = int(request.args.get('page', 1))
    except (TypeError, ValueError):
        page = 1

    results = top_manga(limit=limit, page=page)

    # Adiciona títulos "destacados" ao topo da primeira página
    if page == 1:
        featured_items = []
        seen_ids = {item.get('mal_id') for item in results if item.get('mal_id')}

        for mal_id, item in featured_cache.items():
            if mal_id not in seen_ids:
                featured_items.append(item)
                seen_ids.add(mal_id)

        if featured_items:
            results = featured_items + results

        # Limita o total a 12 itens para a primeira página
        results = results[:12]

    return jsonify({'data': results})


@app.route('/api/jikan/anime', methods=['GET'])
def api_jikan_anime():
    """Busca animes usando a API gratuita Jikan (MyAnimeList)."""
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify({'data': [], 'message': "Parâmetro 'q' é obrigatório."}), 400

    try:
        limit = int(request.args.get('limit', 10))
    except (TypeError, ValueError):
        limit = 10

    results = search_anime(query, limit=limit)
    return jsonify({'data': results})


@app.route('/api/cep/<cep>', methods=['GET'])
def api_cep(cep):
    """Consulta CEP via ViaCEP.

    Retorna dados como logradouro, bairro, cidade e estado.
    """
    cep_clean = ''.join(filter(str.isdigit, cep))[:8]
    if len(cep_clean) != 8:
        return jsonify({'error': 'CEP inválido'}), 400

    try:
        resp = requests.get(f'https://viacep.com.br/ws/{cep_clean}/json/')
        resp.raise_for_status()
    except requests.RequestException:
        return jsonify({'error': 'Falha ao consultar o CEP'}), 502

    data = resp.json()
    if data.get('erro'):
        return jsonify({'error': 'CEP não encontrado'}), 404

    return jsonify(data)


if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('PORT', 5000)),
        debug=os.getenv('FLASK_DEBUG', '1') in ('1', 'true', 'True'),
    )