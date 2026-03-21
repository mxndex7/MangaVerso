"""Blueprint para rotas de carrinho de compras."""
from flask import Blueprint, request, jsonify
from marshmallow import ValidationError
from schemas import add_to_cart_schema
from utils.validators import sanitize_string

cart_bp = Blueprint('cart', __name__, url_prefix='')


@cart_bp.route('/adicionar', methods=['POST'])
def add_to_cart():
    """Rota que confirma o recebimento dos itens adicionados ao carrinho.
    
    Valida os dados antes de processar.
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'status': 'erro', 'msg': 'JSON inválido ou ausente.'}), 400

    try:
        # Validar dados com schema
        validated_data = add_to_cart_schema.load(data)
    except ValidationError as err:
        return jsonify({'status': 'erro', 'msg': err.messages}), 400

    # Sanitizar nome
    nome = sanitize_string(validated_data['nome'])
    preco = validated_data['preco']

    return jsonify({
        'status': 'ok',
        'msg': f"{nome} adicionado ao carrinho!"
    }), 200
