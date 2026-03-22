/**
 * Módulo de Catálogo
 * Gerencia carregamento e renderização do catálogo de mangás
 */

import { API } from './api.js';
import { Formatters } from './formatters.js';
import { UI } from './ui.js';

class Catalog {
  constructor() {
    this.page = 1;
    this.pageSize = 12;
    this.isLoading = false;
    this.cache = new Map();
  }

  /**
   * Carrega primeira página do catálogo
   */
  async initialize() {
    const loadMoreBtn = document.querySelector('.load-more-btn');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => this.loadPage(this.page + 1));
    }
    await this.loadPage(1);
  }

  /**
   * Carrega página do catálogo
   * @param {number} page - Número da página
   */
  async loadPage(page = 1) {
    if (this.isLoading) return;
    this.isLoading = true;

    const grid = document.getElementById('catalogGrid');
    if (!grid) {
      this.isLoading = false;
      return;
    }

    if (page === 1) {
      grid.innerHTML = '';
    }

    try {
      let items = [];

      if (page === 1) {
        // Carregar featured e top para primeira página
        const [featured, top] = await Promise.all([
          API.getFeaturedManga(),
          API.getTopManga(this.pageSize - 3, page)  // Reservar espaço para 3 featured
        ]);
        items = [...featured, ...top];
      } else {
        items = await API.getTopManga(this.pageSize, page);
      }

      if (items.length === 0) {
        const loadMoreBtn = document.querySelector('.load-more-btn');
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        if (page === 1) {
          grid.innerHTML = '<p class="empty-message">Nenhum mangá encontrado no momento.</p>';
        }
        return;
      }

      this._renderItems(items, page > 1);
      this.page = page;

      const loadMoreBtn = document.querySelector('.load-more-btn');
      if (loadMoreBtn) {
        loadMoreBtn.style.display = items.length < this.pageSize ? 'none' : 'block';
      }
    } catch (error) {
      console.error('Erro ao carregar catálogo:', error);
      UI.showNotification('Erro ao carregar catálogo. Verifique sua conexão.', 'error');
      grid.innerHTML = '<p class="empty-message">Erro ao carregar catálogo.</p>';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Renderiza itens no catálogo
   * @private
   */
  _renderItems(items, append = false) {
    const grid = document.getElementById('catalogGrid');
    if (!grid) return;

    const html = items
      .map(item => {
        const id = item.mal_id || 0;
        this.cache.set(String(id), item);
        return this._generateCardHTML(item, id);
      })
      .join('');

    if (append) {
      grid.insertAdjacentHTML('beforeend', html);
    } else {
      grid.innerHTML = html;
    }
  }

  /**
   * Gera HTML de um card de mangá
   * @private
   */
  _generateCardHTML(item, id) {
    const image = item.image_url || 'https://via.placeholder.com/240x340?text=Sem+Imagem';
    const title = item.title || 'Sem título';
    const score = item.score ? item.score.toFixed(1) : null;
    const synopsis = (item.synopsis || '').replace(/\s+/g, ' ').trim();
    const synopsisShort =
      synopsis.length > 120 ? synopsis.slice(0, 120).trim() + '...' : synopsis;
    const price = Formatters.makePriceFromScore(item.score);
    const genres = Array.isArray(item.genres) ? item.genres.join(', ') : '';

    return `
      <div class="manga-card" data-id="${id}" data-genre="${genres}">
        <div class="manga-cover">
          <img src="${image}" alt="${title}" class="manga-image">
        </div>
        <div class="manga-info">
          <h3 class="manga-title">${title}</h3>
          <p class="manga-genre">Score: ${score ?? 'N/A'}</p>
          <p class="manga-synopsis">${synopsisShort}</p>
          <div class="manga-price">R$ ${price.replace('.', ',')}</div>
          <button class="add-to-cart-btn" 
                  data-id="${id}" 
                  data-nome="${title}" 
                  data-preco="${price}" 
                  data-imagem="${image}">
            <i class="fas fa-cart-plus"></i> Adicionar ao Carrinho
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Obtém item do cache
   * @param {number} id - ID do item
   * @returns {Object|null}
   */
  getItem(id) {
    return this.cache.get(String(id)) || null;
  }
}

export { Catalog };
