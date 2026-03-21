"""Inicialização dos blueprints de rotas."""
from routes.jikan_bp import jikan_bp
from routes.cart_bp import cart_bp
from routes.cep_bp import cep_bp


def register_blueprints(app):
    """Registra todos os blueprints na aplicação."""
    app.register_blueprint(jikan_bp)
    app.register_blueprint(cart_bp)
    app.register_blueprint(cep_bp)
