/**
 * Módulo de Formatadores
 * Centraliza formatação de inputs
 */

const Formatters = {
  /**
   * Formata CPF enquanto digita
   * @param {HTMLInputElement} input - Campo de input
   */
  formatCPF(input) {
    let value = input.value.replace(/\D/g, '');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    input.value = value;
  },

  /**
   * Formata CEP enquanto digita
   * @param {HTMLInputElement} input - Campo de input
   */
  formatCEP(input) {
    let value = input.value.replace(/\D/g, '');
    value = value.replace(/(\d{5})(\d)/, '$1-$2');
    input.value = value;
  },

  /**
   * Formata telefone enquanto digita
   * @param {HTMLInputElement} input - Campo de input
   */
  formatPhone(input) {
    let value = input.value.replace(/\D/g, '');
    value = value.replace(/(\d{2})(\d)/, '($1) $2');
    value = value.replace(/(\d{5})(\d)/, '$1-$2');
    input.value = value;
  },

  /**
   * Formata número de cartão enquanto digita
   * @param {HTMLInputElement} input - Campo de input
   */
  formatCardNumber(input) {
    let value = input.value.replace(/\D/g, '');
    value = value.replace(/(\d{4})/g, '$1 ').trim();
    input.value = value;
  },

  /**
   * Formata data de expiração enquanto digita
   * @param {HTMLInputElement} input - Campo de input
   */
  formatExpiryDate(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 2) {
      value = value.replace(/(\d{2})(\d)/, '$1/$2');
    }
    input.value = value;
  },

  /**
   * Formata preço para exibição
   * @param {number} value - Valor numérico
   * @returns {string} Preço formatado
   */
  formatPrice(value) {
    const amount = Number(value);
    if (Number.isNaN(amount)) return '0,00';
    return amount.toFixed(2).replace('.', ',');
  },

  /**
   * Gera preço fictício baseado no score
   * @param {number} score - Score do item
   * @returns {string} Preço formatado
   */
  makePriceFromScore(score) {
    const base = 19.9;
    const extra = score ? Math.min(Math.max(score, 0), 10) * 1.5 : 0;
    return (base + extra).toFixed(2);
  }
};

export { Formatters };
