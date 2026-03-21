/**
 * Módulo de API
 * Centraliza todas as chamadas HTTP para o backend
 */

const API = {
  /**
   * Busca mangás via Jikan API
   * @param {string} query - Termo de busca
   * @param {number} limit - Quantidade máxima de resultados
   * @returns {Promise<Array>}
   */
  async searchManga(query, limit = 10) {
    if (!query) return [];
    try {
      const response = await fetch(
        `/api/jikan/manga?q=${encodeURIComponent(query)}&limit=${limit}`
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      return Array.isArray(json.data) ? json.data : [];
    } catch (error) {
      console.error('Erro ao buscar mangás:', error);
      return [];
    }
  },

  /**
   * Busca animes via Jikan API
   * @param {string} query - Termo de busca
   * @param {number} limit - Quantidade máxima de resultados
   * @returns {Promise<Array>}
   */
  async searchAnime(query, limit = 10) {
    if (!query) return [];
    try {
      const response = await fetch(
        `/api/jikan/anime?q=${encodeURIComponent(query)}&limit=${limit}`
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      return Array.isArray(json.data) ? json.data : [];
    } catch (error) {
      console.error('Erro ao buscar animes:', error);
      return [];
    }
  },

  /**
   * Carrega mangás populares (top)
   * @param {number} limit - Quantidade máxima de resultados
   * @param {number} page - Página de resultados
   * @returns {Promise<Array>}
   */
  async getTopManga(limit = 16, page = 1) {
    try {
      const response = await fetch(`/api/jikan/manga/top?limit=${limit}&page=${page}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      return Array.isArray(json.data) ? json.data : [];
    } catch (error) {
      console.error('Erro ao carregar mangás populares:', error);
      return [];
    }
  },

  /**
   * Adiciona item ao carrinho (confirmação no backend)
   * @param {string} nome - Nome do item
   * @param {number} preco - Preço do item
   * @returns {Promise<Object>}
   */
  async addToCart(nome, preco) {
    try {
      const response = await fetch('/adicionar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, preco })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      return { status: 'erro', msg: 'Falha ao comunicar com o servidor' };
    }
  },

  /**
   * Consulta CEP via ViaCEP
   * @param {string} cep - CEP sem formatação (8 dígitos)
   * @returns {Promise<Object>}
   */
  async lookupCEP(cep) {
    if (!/^[0-9]{8}$/.test(cep)) {
      throw new Error('CEP inválido');
    }
    try {
      const response = await fetch(`/api/cep/${cep}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('CEP não encontrado');
        }
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Erro ao consultar CEP:', error);
      throw error;
    }
  }
};

export { API };
