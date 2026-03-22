# MangaVerso - Loja de Mangás Online

Uma plataforma web moderna para explorar, buscar e comprar mangás e animes utilizando a API Jikan (MyAnimeList).

## Features 

-  **Busca Avançada**: Integração com Jikan API para dados em tempo real de mangás e animes
-  **Carrinho Inteligente**: Carrito salvo no localStorage com persistência e validação de preços
-  **Checkout Simplificado**: Processo de compra com cartão de crédito
-  **Design Responsivo**: Interface moderna e fluida para todos os dispositivos
-  **Performance Otimizada**: Cache com TTL, carregamento de mangás em destaque + populares
-  **Segurança**: Validação de dados, sanitização, CORS restrito
-  **Interface Limpa**: Design intuitivo com Font Awesome e Montserrat

## Tecnologias 

**Backend:**
- Python 3.8+
- Flask 2.3+ (Framework web)
- Flask-CORS (Suporte CORS)
- Marshmallow (Validação de schemas)
- Requests (HTTP client)
- Bleach (Sanitização de dados)
- Python-dotenv (Gerenciamento de variáveis de ambiente)

**Frontend:**
- HTML5
- CSS3 (moderno e responsivo)
- JavaScript Vanilla (sem framework)
- Font Awesome 6.4 (ícones)
- Google Fonts (Montserrat)

**APIs Externas:**
- [Jikan API](https://jikan.moe/) - Dados de mangás/animes
- [ViaCEP](https://viacep.com.br/) - Validação de CEP

## Estrutura do Projeto 

```
MangaVerso/
├── app.py                  # Arquivo principal (factory pattern)
├── config.py              # Configurações centralizadas
├── requirements.txt       # Dependências Python
├── .env                   # Variáveis de ambiente
├── .gitignore             # Arquivos ignorados pelo Git
├── README.md              # Você está aqui! 
│
├── routes/                # Blueprints das rotas
│   ├── __init__.py       # Registro de blueprints
│   ├── jikan_bp.py       # Rotas da API Jikan
│   ├── cart_bp.py        # Rotas do carrinho
│   └── cep_bp.py         # Rotas de CEP
│
├── schemas/               # Schemas de validação
│   └── __init__.py       # Schemas Marshmallow
│
├── utils/                 # Utilitários
│   ├── __init__.py
│   ├── validators.py     # Validadores de dados
│   └── jikan_improved.py # Cliente Jikan com cache
│
├── templates/
│   └── index.html        # Página principal
│
└── static/
    ├── main.js           # JavaScript principal
    ├── style.css         # Estilos
    └── js/
        ├── api.js        # API client
        ├── cart.js       # Carrinho
        ├── catalog.js    # Catálogo
        ├── formatters.js # Formatadores
        └── ui.js         # Interface
```

## Como Instalar e Rodar 

### Pré-requisitos
- Python 3.8 ou superior
- pip (gerenciador de pacotes)
- Git

### Passo 1: Clonar o repositório

```bash
git clone <url-do-repositorio>
cd MangaVerso
```

### Passo 2: Criar e ativar ambiente virtual

**No Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**No macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### Passo 3: Instalar dependências

```bash
pip install -r requirements.txt
```

### Passo 4: Configurar variáveis de ambiente

1. Copie o arquivo `.env` (já está criado com valores padrão)
2. Personalize se necessário:

```bash
# .env
FLASK_ENV=development
FLASK_DEBUG=1
PORT=5000
SECRET_KEY=sua-chave-secreta-aqui
CORS_ORIGINS=http://localhost:5000,http://localhost:3000
```

### Passo 5: Executar a aplicação

```bash
python app.py
```

A aplicação estará disponível em: **http://localhost:5000**

## Endpoints da API 🔗

### Buscar Mangás

```http
GET /api/jikan/manga?q=Naruto&limit=10
```

**Parâmetros:**
- `q` (obrigatório): Termo de busca
- `limit` (opcional): Quantidade de resultados (padrão: 10, máx: 25)

**Resposta:**
```json
{
  "data": [
    {
      "mal_id": 11,
      "title": "Naruto",
      "type": "Manga",
      "status": "Finished",
      "genres": ["Action", "Adventure"],
      "score": 8.5,
      "image_url": "https://...",
      "synopsis": "..."
    }
  ]
}
```

### Mangás Populares

```http
GET /api/jikan/manga/top?limit=16&page=1
```

**Parâmetros:**
- `limit` (opcional): Quantidade de resultados (padrão: 16)
- `page` (opcional): Página de resultados (padrão: 1)

### Mangás em Destaque

```http
GET /api/jikan/manga/featured
```

**Retorna:** Dragon Ball, Naruto e Jujutsu Kaisen (sempre no topo do catálogo)

### Buscar Animes

```http
GET /api/jikan/anime?q=Attack%20on%20Titan&limit=10
```

Mesmos parâmetros da busca de mangás.

### Consultar CEP

```http
GET /api/cep/01310-100
```

**Resposta:**
```json
{
  "cep": "01310-100",
  "logradouro": "Avenida Paulista",
  "bairro": "Bela Vista",
  "cidade": "São Paulo",
  "uf": "SP"
}
```

### Adicionar ao Carrinho

```http
POST /adicionar
Content-Type: application/json

{
  "nome": "Dragon Ball Z",
  "preco": 29.90
}
```

**Resposta:**
```json
{
  "status": "ok",
  "msg": "Dragon Ball Z adicionado ao carrinho!"
}
```

## Validações e Segurança 

### Backend
-  Validação de CPF (valida dígitos verificadores)
-  Validação de Email
-  Validação de CEP
-  Validação de Telefone
-  Sanitização de strings (Bleach)
-  Schemas Marshmallow para validação declarativa
-  CORS restrito por origem
-  Tratamento robusto de erros

### Frontend
-  Validação em tempo real
-  Formatação automática (CPF, Telefone, Data)
-  Feedback visual ao usuário

## Performance 

- **Cache com TTL**: Resultados da Jikan API são cacheados por 5 minutos
- **Mangás em Destaque**: Dragon Ball, Naruto e Jujutsu Kaisen sempre no topo
- **Carregamento Otimizado**: 12 mangás na primeira página (3 destaque + 9 populares)
- **Validação de Preços**: Prevenção de valores null/inválidos no carrinho
- **Cache HTTP**: Headers de cache para recursos estáticos



