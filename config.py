"""Configurações centralizadas da aplicação MangaVerso."""
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()


class Config:
    """Configuração base da aplicação."""

    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    DEBUG = os.getenv('FLASK_ENV') == 'development'
    TESTING = os.getenv('TESTING', 'False').lower() == 'true'
    PORT = int(os.getenv('PORT', '5000'))
    FLASK_DEBUG = DEBUG

    # CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:5000').split(',')

    # Featured titles for homepage
    FEATURED_TITLES = [
        'Dragon Ball', 'Naruto', 'Jujutsu Kaisen'
    ]

    # Outras configurações podem ser adicionadas aqui
    # Exemplo: DATABASE_URL, API_KEYS, etc.


def get_config():
    """Retorna a configuração apropriada baseada no ambiente."""
    return Config