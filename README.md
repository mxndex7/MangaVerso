- Como Utilizar :
  1) Clone o projeto e abra no VS Code
  2) Instale dependências: `pip install -r requirements.txt`
  3) Execute a aplicação: `python app.py`

  A aplicação usa a **Jikan API** para carregar capas e informações de mangás/animes em tempo real.
  Endpoints disponíveis:
  - `GET /api/jikan/manga/top` (catálogo de mangás mais populares)
  - `GET /api/jikan/manga?q=<termo>` (busca por termo)
  - `GET /api/jikan/anime?q=<termo>` (busca por animes)
  - `GET /api/cep/<cep>` (consulta CEP via ViaCEP para preencher endereço no checkout)

- Modelagem

├──static 
  └──assets
  └──style.css
  └──script.js
├──template
  └──index.html
├──app.py
├──db_factory.py
├──init_db.py
├──loja.db
├──requeriments.txt

- Tecnologias e Metodo Utilizado
  HTML, CSS, JS, Python, SQLite e Factory

# MangaVerso
