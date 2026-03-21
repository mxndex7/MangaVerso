/**
 * Módulo de UI
 * Centraliza manipulação de interface do usuário
 */

const UI = {
  /**
   * Exibe notificação ao usuário
   * @param {string} message - Mensagem a exibir
   * @param {string} type - Tipo de notificação (info, success, error, warning)
   * @param {number} duration - Duração em ms
   */
  showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.role = 'alert';

    document.body.appendChild(notification);

    // Forçar reflow para trigger animação
    notification.offsetHeight;
    notification.classList.add('show');

    setTimeout(() => {
      notification.classList.remove('show');
      notification.addEventListener('transitionend', () => {
        notification.remove();
      }, { once: true });
    }, duration);
  },

  /**
   * Toggle carrinho lateral
   */
  toggleCart() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('cartOverlay');
    if (sidebar && overlay) {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('show');
    }
  },

  /**
   * Abre modal de checkout
   */
  openCheckout() {
    const modal = document.getElementById('checkoutModal');
    if (modal) {
      modal.classList.add('show');
    }
  },

  /**
   * Fecha modal de checkout
   */
  closeCheckout() {
    const modal = document.getElementById('checkoutModal');
    if (modal) {
      modal.classList.remove('show');
    }
  },

  /**
   * Abre modal de produto
   * @param {Object} product - Dados do produto
   */
  openProductModal(product) {
    const modal = document.getElementById('productModal');
    if (!modal) return;

    // Preencher dados do modal
    this._populateProductModal(product);

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  },

  /**
   * Fecha modal de produto
   */
  closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = '';
    }
  },

  /**
   * Preenche dados no modal de produto
   * @private
   */
  _populateProductModal(product) {
    const mapping = {
      'productModalTitle': product.title || 'Sem título',
      'productModalGenres': Array.isArray(product.genres) ? product.genres.join(', ') : '',
      'productModalType': product.type || '—',
      'productModalStatus': product.status || '—',
      'productModalVolumes': product.volumes ?? '—',
      'productModalChapters': product.chapters ?? '—',
      'productModalAuthors': Array.isArray(product.authors) && product.authors.length > 0
        ? product.authors.join(', ')
        : '—'
    };

    Object.entries(mapping).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    });

    // Score
    const scoreEl = document.getElementById('productModalScore');
    if (scoreEl) {
      const parts = [];
      if (product.score) parts.push(`Score: ${product.score.toFixed(1)}`);
      else parts.push('Score: N/A');
      if (product.type) parts.push(product.type);
      if (product.status) parts.push(product.status);
      if (product.rank) parts.push(`Rank #${product.rank}`);
      scoreEl.textContent = parts.join(' • ');
    }

    // Período de publicação
    const publishedEl = document.getElementById('productModalPublished');
    if (publishedEl) {
      const from = product.published_from;
      const to = product.published_to;
      if (from && to) {
        publishedEl.textContent = `${from} → ${to}`;
      } else if (from) {
        publishedEl.textContent = from;
      } else {
        publishedEl.textContent = '—';
      }
    }

    // Sinopse e preço
    const synopsisEl = document.getElementById('productModalSynopsis');
    if (synopsisEl) synopsisEl.textContent = product.synopsis || '';

    const priceEl = document.getElementById('productModalPrice');
    if (priceEl) {
      const price = (19.9 + (product.score ? Math.min(Math.max(product.score, 0), 10) * 1.5 : 0)).toFixed(2);
      priceEl.textContent = `R$ ${price.replace('.', ',')}`;
    }

    // Imagem e link
    const imageEl = document.getElementById('productModalImage');
    if (imageEl) {
      imageEl.src = product.image_url || 'https://via.placeholder.com/240x340?text=Sem+Imagem';
      imageEl.alt = product.title;
    }

    const linkEl = document.getElementById('productModalLink');
    if (linkEl) {
      linkEl.href = product.url || '#';
      linkEl.target = '_blank';
    }
  },

  /**
   * Mostra modal de sucesso
   * @param {string} orderNumber - Número do pedido
   */
  showSuccessModal(orderNumber) {
    const orderNumberEl = document.getElementById('orderNumber');
    if (orderNumberEl) {
      orderNumberEl.textContent = orderNumber;
    }

    const modal = document.getElementById('successModal');
    if (modal) {
      modal.classList.add('show');
    }
  },

  /**
   * Fecha modal de sucesso
   */
  closeSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
      modal.classList.remove('show');
    }
  },

  /**
   * Mostra animação de adição ao carrinho
   * @param {number} id - ID do item
   */
  showAddToCartAnimation(id) {
    const button = document.querySelector(`.add-to-cart-btn[data-id="${id}"]`);
    if (!button) return;

    button.classList.add('adding');
    button.innerHTML = '<i class="fas fa-check"></i> Adicionado!';

    setTimeout(() => {
      button.classList.remove('adding');
      button.innerHTML = '<i class="fas fa-cart-plus"></i> Adicionar ao Carrinho';
    }, 1500);
  }
};

export { UI };
