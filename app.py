"""Aplicação principal do MangaVerso."""
import os
from flask import Flask, render_template
from flask_cors import CORS

from config import get_config
from routes import register_blueprints


def create_app(config=None):
    """Factory pattern para criar a aplicação Flask.
    
    Args:
        config: Configuração customizada (usa get_config() por padrão)
    
    Returns:
        Aplicação Flask configurada
    """
    app = Flask(
        __name__,
        template_folder='templates',
        static_folder='static'
    )
    
    # Carregar configurações
    if config is None:
        config = get_config()
    
    app.config.from_object(config)
    
    # Configurar CORS com restrições
    allowed_origins = [origin.strip() for origin in config.CORS_ORIGINS]
    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": allowed_origins,
                "methods": ["GET", "POST", "OPTIONS"],
                "allow_headers": ["Content-Type"]
            }
        }
    )
    
    # Registrar blueprints de rotas
    register_blueprints(app)
    
    # Rota principal
    @app.route('/')
    def index():
        """Renderiza a página principal."""
        return render_template('index.html')
    
    # Handler de erros
    @app.errorhandler(404)
    def not_found(error):
        """Manipula erros 404."""
        return {'error': 'Recurso não encontrado'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        """Manipula erros 500."""
        return {'error': 'Erro interno do servidor'}, 500
    
    return app


# Criar instância da aplicação
app = create_app()


if __name__ == '__main__':
    config = get_config()
    app.run(
        host='0.0.0.0',
        port=config.PORT,
        debug=config.FLASK_DEBUG,
    ) 