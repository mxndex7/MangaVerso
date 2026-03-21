/**
 * Módulo de Validadores
 * Centraliza todas as funções de validação
 */

const Validators = {
  /**
   * Valida e-mail
   * @param {string} email - E-mail a validar
   * @returns {boolean}
   */
  isValidEmail(email) {
    const trimmed = email.trim();
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(trimmed);
  },

  /**
   * Valida telefone brasileiro
   * @param {string} phone - Telefone com formatação
   * @returns {boolean}
   */
  isValidPhone(phone) {
    const digits = phone.replace(/\D/g, '');
    return /^(?:\d{10}|\d{11})$/.test(digits);
  },

  /**
   * Valida CPF brasileiro
   * @param {string} cpf - CPF com formatação
   * @returns {boolean}
   */
  isValidCPF(cpf) {
    const digits = cpf.replace(/\D/g, '');
    
    if (!/^\d{11}$/.test(digits)) return false;
    if (/^(\d)\1{10}$/.test(digits)) return false;

    const calcCheckDigit = (baseDigits) => {
      let multiplier = baseDigits.length + 1;
      const sum = baseDigits.split('').reduce(
        (acc, digit) => acc + Number(digit) * multiplier--,
        0
      );
      const result = 11 - (sum % 11);
      return result >= 10 ? 0 : result;
    };

    const firstNine = digits.slice(0, 9);
    const firstCheck = calcCheckDigit(firstNine);
    const secondCheck = calcCheckDigit(firstNine + firstCheck);

    return (
      Number(digits[9]) === firstCheck &&
      Number(digits[10]) === secondCheck
    );
  },

  /**
   * Valida CEP brasileiro
   * @param {string} cep - CEP com formatação
   * @returns {boolean}
   */
  isValidCEP(cep) {
    const digits = cep.replace(/\D/g, '');
    return /^\d{8}$/.test(digits);
  },

  /**
   * Valida número de cartão de crédito (16 dígitos)
   * @param {string} cardNumber - Número do cartão com formatação
   * @returns {boolean}
   */
  isValidCardNumber(cardNumber) {
    const digits = cardNumber.replace(/\D/g, '');
    return /^\d{16}$/.test(digits);
  },

  /**
   * Valida data de expiração (MM/YY)
   * @param {string} expiryDate - Data no formato MM/YY
   * @returns {boolean}
   */
  isValidExpiryDate(expiryDate) {
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) return false;
    const [month] = expiryDate.split('/').map(Number);
    return month >= 1 && month <= 12;
  },

  /**
   * Valida CVV
   * @param {string} cvv - CVV (3 ou 4 dígitos)
   * @returns {boolean}
   */
  isValidCVV(cvv) {
    const digits = cvv.replace(/\D/g, '');
    return /^[0-9]{3,4}$/.test(digits);
  },

  /**
   * Valida nome completo
   * @param {string} name - Nome a validar
   * @returns {boolean}
   */
  isValidName(name) {
    return /^[A-Za-zÀ-ÿ\s]+$/.test(name.trim());
  }
};

export { Validators };
