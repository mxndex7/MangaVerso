"""Blueprint para rotas de busca de CEP via ViaCEP."""
import requests
from flask import Blueprint, jsonify
from config import Config
from utils.validators import validate_cep

cep_bp = Blueprint('cep', __name__, url_prefix='/api')


@cep_bp.route('/cep/<cep>', methods=['GET'])
def api_cep(cep):
    """Consulta CEP via ViaCEP.
    
    Retorna dados como logradouro, bairro, cidade e estado.
    """
    # Validar formato do CEP
    if not validate_cep(cep):
        return jsonify({'error': 'CEP inválido. Use o formato XXXXX-XXX'}), 400

    cep_clean = ''.join(filter(str.isdigit, cep))

    try:
        resp = requests.get(
            f'{Config.VIACEP_BASE_URL}/{cep_clean}/json/',
            timeout=Config.VIACEP_TIMEOUT
        )
        resp.raise_for_status()
    except requests.RequestException as e:
        return jsonify({'error': 'Falha ao consultar o CEP. Tente novamente.'}), 502

    data = resp.json()
    if data.get('erro'):
        return jsonify({'error': 'CEP não encontrado'}), 404

    return jsonify(data), 200
