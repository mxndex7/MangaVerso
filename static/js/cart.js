/**
 * Módulo de Carrinho
 * Gerencia estado e manipulação do carrinho de compras
 */

import { Formatters } from './formatters.js';
import { UI } from './ui.js';

class Cart {
  constructor() {
    this.items = this.loadFromStorage();
    this.cleanInvalidItems(); // Limpar itens inválidos ao inicializar
  }

  /**
   * Carrega itens do localStorage
   * @returns {Array}
   */
  loadFromStorage() {
    try {
      const items = JSON.parse(localStorage.getItem('cart')) || [];
      // Filtrar itens inválidos
      return items.filter(item => 
        item && 
        typeof item.id === 'number' && 
        item.title && 
        typeof item.price === 'number' && 
        item.price > 0 &&
        typeof item.quantity === 'number' &&
        item.quantity > 0
      );
    } catch {
      return [];
    }
  }

  /**
   * Salva itens no localStorage
   */
  saveToStorage() {
    localStorage.setItem('cart', JSON.stringify(this.items));
  }

  /**
   * Adiciona item ao carrinho
   * @param {number} id - ID do item
   * @param {string} title - Título do item
   * @param {number} price - Preço do item
   * @param {string} image - URL da imagem
   * @returns {Object} Item adicionado
   */
  addItem(id, title, price, image) {
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      console.error('Preço inválido:', price);
      return null;
    }

    const existingItem = this.items.find(item => item.id === id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.items.push({
        id,
        title,
        price: numericPrice,
        image,
        quantity: 1
      });
    }

    this.saveToStorage();
    return existingItem || this.items[this.items.length - 1];
  }

  /**
   * Remove item do carrinho
   * @param {number} id - ID do item
   */
  removeItem(id) {
    this.items = this.items.filter(item => item.id !== id);
    this.saveToStorage();
  }

  /**
   * Atualiza quantidade de um item
   * @param {number} id - ID do item
   * @param {number} quantity - Nova quantidade
   */
  updateQuantity(id, quantity) {
    if (quantity <= 0) {
      this.removeItem(id);
      return;
    }

    const item = this.items.find(item => item.id === id);
    if (item) {
      item.quantity = quantity;
      this.saveToStorage();
    }
  }

  /**
   * Limpa o carrinho completamente
   */
  clear() {
    this.items = [];
    localStorage.removeItem('cart');
  }

  /**
   * Remove itens inválidos do carrinho
   */
  cleanInvalidItems() {
    this.items = this.items.filter(item => 
      item && 
      typeof item.id === 'number' && 
      item.title && 
      typeof item.price === 'number' && 
      item.price > 0 &&
      typeof item.quantity === 'number' &&
      item.quantity > 0
    );
    this.saveToStorage();
  }

  /**
   * Retorna total de itens
   * @returns {number}
   */
  getTotalItems() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  /**
   * Retorna subtotal do carrinho
   * @returns {number}
   */
  getSubtotal() {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  /**
   * Retorna total com frete
   * @param {number} shippingCost - Custo do frete
   * @returns {number}
   */
  getTotal(shippingCost = 15.0) {
    return this.getSubtotal() + shippingCost;
  }

  /**
   * Verifica se carrinho está vazio
   * @returns {boolean}
   */
  isEmpty() {
    return this.items.length === 0;
  }
}

export { Cart };
