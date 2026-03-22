
import { API } from './js/api.js';
import { Cart } from './js/cart.js';
import { Catalog } from './js/catalog.js';
import { Formatters } from './js/formatters.js';
import { UI } from './js/ui.js';
import { Validators } from './js/validators.js';

// Estado global
let cart;
let catalog;
let currentCheckoutStep = 1;

// Inicialização ao carregar DOM
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

/**
 * Inicializa a aplicação
 */
function initializeApp() {
  // Inicializar módulos
  cart = new Cart();
  catalog = new Catalog();

  // Setup event listeners iniciais
  setupCartDisplay();
  setupHeaderActions();
  setupProductModal();
  setupCheckoutForm();
  setupFormatters();

  // Carregar catálogo e search
  catalog.initialize();
  setupSearch();
}

/**
 * Configura exibição do carrinho
 */
function setupCartDisplay() {
  updateCartDisplay();

  // Event delegation para adicionar ao carrinho
  document.addEventListener('click', (e) => {
    // Botão "Adicionar ao Carrinho"
    const addBtn = e.target.closest('.add-to-cart-btn');
    if (addBtn) {
      e.preventDefault();
      handleAddToCart(addBtn);
      return;
    }

    // Botão de diminuir quantidade
    const minusBtn = e.target.closest('.minus-btn');
    if (minusBtn) {
      const id = parseInt(minusBtn.getAttribute('data-id'));
      const item = cart.items.find(item => item.id === id);
      if (item) {
        cart.updateQuantity(id, item.quantity - 1);
        updateCartDisplay();
      }
      return;
    }

    // Botão de aumentar quantidade
    const plusBtn = e.target.closest('.plus-btn');
    if (plusBtn) {
      const id = parseInt(plusBtn.getAttribute('data-id'));
      const item = cart.items.find(item => item.id === id);
      if (item) {
        cart.updateQuantity(id, item.quantity + 1);
        updateCartDisplay();
      }
      return;
    }

    // Botão de remover item
    const removeBtn = e.target.closest('.remove-item');
    if (removeBtn) {
      const id = parseInt(removeBtn.getAttribute('data-id'));
      cart.removeItem(id);
      updateCartDisplay();
      return;
    }

    // Card do mangá
    const cardEl = e.target.closest('.manga-card');
    if (cardEl) {
      const id = cardEl.getAttribute('data-id');
      handleCardClick(id);
    }
  });

  // Toggle carrinho
  const cartBtn = document.querySelector('.cart-btn');
  if (cartBtn) {
    cartBtn.addEventListener('click', () => UI.toggleCart());
  }

  // Fechar ao clicar overlay
  const overlay = document.getElementById('cartOverlay');
  if (overlay) {
    overlay.addEventListener('click', () => UI.toggleCart());
  }
}

/**
 * Adiciona item ao carrinho
 */
async function handleAddToCart(button) {
  const id = parseInt(button.getAttribute('data-id'));
  const nome = button.getAttribute('data-nome');
  const preco = parseFloat(button.getAttribute('data-preco'));
  const imagem = button.getAttribute('data-imagem');

  // Adicionar ao carrinho local
  cart.addItem(id, nome, preco, imagem);

  // Confirmar no backend
  try {
    await API.addToCart(nome, preco);
  } catch (error) {
    console.error('Erro ao confirmar no backend:', error);
  }

  // Atualizar UI
  updateCartDisplay();
  UI.showAddToCartAnimation(id);
  UI.showNotification('Item adicionado ao carrinho!', 'success');
}

/**
 * Manipula clique no card
 */
function handleCardClick(id) {
  const product = catalog.getItem(id);
  if (product) {
    UI.openProductModal(product);
  }
}

/**
 * Atualiza exibição do carrinho
 */
function updateCartDisplay() {
  const itemsEl = document.getElementById('cartItems');
  const totalEl = document.getElementById('cartTotal');
  const checkoutBtn = document.querySelector('.checkout-btn');
  const cartCount = document.querySelector('.cart-count');

  if (!itemsEl || !totalEl || !checkoutBtn) return;

  // Atualizar contagem
  if (cartCount) {
    cartCount.textContent = cart.getTotalItems();
  }

  // Atualizar total
  totalEl.textContent = Formatters.formatPrice(cart.getSubtotal());

  // Renderizar itens
  if (cart.isEmpty()) {
    itemsEl.innerHTML = `
      <div class="empty-cart">
        <i class="fas fa-shopping-cart"></i>
        <p>Seu carrinho está vazio</p>
      </div>
    `;
    checkoutBtn.disabled = true;
  } else {
    itemsEl.innerHTML = cart.items
      .filter(item => item && item.id && item.title) // Filtrar itens null/inválidos
      .map(item => `
        <div class="cart-item" data-id="${item.id}">
          <img src="${item.image}" alt="${item.title}" class="cart-item-image">
          <div class="cart-item-details">
            <div class="cart-item-title">${item.title}</div>
            <div class="cart-item-price">R$ ${Formatters.formatPrice(item.price)}</div>
            <div class="cart-item-controls">
              <button class="quantity-btn minus-btn" data-id="${item.id}">-</button>
              <span class="quantity-display">${item.quantity}</span>
              <button class="quantity-btn plus-btn" data-id="${item.id}">+</button>
              <button class="remove-item" data-id="${item.id}">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      `)
      .join('');
    checkoutBtn.disabled = false;
  }
}

/**
 * Configura ações do header
 */
function setupHeaderActions() {
  // Checkout
  const checkoutBtn = document.querySelector('.checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (!cart.isEmpty()) {
        openCheckout();
      }
    });
  }
}

/**
 * Configura modal de produto
 */
function setupProductModal() {
  const modal = document.getElementById('productModal');
  if (!modal) return;

  // Fechar ao clicar no overlay
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      UI.closeProductModal();
    }
  });

  // Fechar com Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
      UI.closeProductModal();
    }
  });

  // Botão de adicionar
  const addBtn = document.getElementById('productModalAddToCart');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const id = parseInt(document.querySelector('.manga-card.active')?.getAttribute('data-id') || 0);
      const product = catalog.getItem(id);
      if (product) {
        const price = Formatters.makePriceFromScore(product.score);
        cart.addItem(id, product.title, price, product.image_url);
        updateCartDisplay();
        UI.closeProductModal();
        UI.showNotification('Item adicionado ao carrinho!', 'success');
      }
    });
  }
}

/**
 * Configura formulário de checkout
 */
function setupCheckoutForm() {
  const modal = document.getElementById('checkoutModal');
  if (!modal) return;

  const closeBtn = document.querySelector('.close-checkout');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeCheckout);
  }

  // Validação de etapas
  const nextBtn = document.getElementById('nextStepBtn');
  if (nextBtn) {
    nextBtn.addEventListener('click', nextStep);
  }
  
  const nextBtn2 = document.getElementById('nextStepBtn2');
  if (nextBtn2) {
    nextBtn2.addEventListener('click', nextStep);
  }
  
  const prevBtn = document.getElementById('prevStepBtn');
  if (prevBtn) {
    prevBtn.addEventListener('click', prevStep);
  }
  
  const prevBtn2 = document.getElementById('prevStepBtn2');
  if (prevBtn2) {
    prevBtn2.addEventListener('click', prevStep);
  }
  
  const completeBtn = document.getElementById('completeOrderBtn');
  if (completeBtn) {
    completeBtn.addEventListener('click', completeOrder);
  }

  const prevBtns = document.querySelectorAll('.prev-step-btn');
  prevBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      currentCheckoutStep--;
      updateCheckoutStepDisplay();
    });
  });

  // CEP lookup
  const cepBtn = document.getElementById('cepLookupBtn');
  if (cepBtn) {
    cepBtn.addEventListener('click', handleCEPLookup);
  }
}

/**
 * Abre checkout
 */
function openCheckout() {
  if (cart.isEmpty()) return;
  currentCheckoutStep = 1;
  updateCheckoutStepDisplay();
  updateOrderSummary();
  UI.openCheckout();
}

/**
 * Fecha checkout
 */
function closeCheckout() {
  UI.closeCheckout();
  currentCheckoutStep = 1;
  updateCheckoutStepDisplay();
}

/**
 * Atualiza exibição de etapas do checkout
 */
function updateCheckoutStepDisplay() {
  document.querySelectorAll('.step').forEach((step, index) => {
    step.classList.toggle('active', index + 1 <= currentCheckoutStep);
  });

  document.querySelectorAll('.form-step').forEach((step, index) => {
    step.classList.toggle('active', index + 1 === currentCheckoutStep);
  });
}

/**
 * Valida etapa atual do checkout
 */
function validateCheckoutStep(step) {
  const currentForm = document.getElementById(`step${step}`);
  if (!currentForm) return false;

  const requiredInputs = currentForm.querySelectorAll('[required]');
  for (let input of requiredInputs) {
    if (!input.value.trim()) {
      UI.showNotification('Preencha todos os campos obrigatórios.', 'error');
      input.focus();
      return false;
    }
  }

  // Validações específicas
  if (step === 1) {
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const cpf = document.getElementById('cpf').value;

    console.log('Validating step 1:', { fullName, email, phone, cpf });

    if (!fullName.trim()) {
      UI.showNotification('Nome é obrigatório.', 'error');
      return false;
    }
    if (!email.trim()) {
      UI.showNotification('E-mail é obrigatório.', 'error');
      return false;
    }
    if (!phone.trim()) {
      UI.showNotification('Telefone é obrigatório.', 'error');
      return false;
    }
    if (!cpf.trim()) {
      UI.showNotification('CPF é obrigatório.', 'error');
      return false;
    }

    // Validações básicas
    if (!Validators.isValidEmail(email)) {
      UI.showNotification('E-mail inválido.', 'error');
      return false;
    }

    console.log('Step 1 validation passed');
    return true;
  }

  if (step === 2) {
    const cep = document.getElementById('cep').value;
    if (!Validators.isValidCEP(cep)) {
      UI.showNotification('CEP inválido.', 'error');
      return false;
    }
  }

  if (step === 3) {
    return validatePaymentStep();
  }

  return true;
}

/**
 * Valida etapa de pagamento
 */
function validatePaymentStep() {
  const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value;

  if (paymentMethod === 'creditCard' || paymentMethod === 'debitCard') {
    const cardNumber = document.getElementById('cardNumber').value;
    const cardName = document.getElementById('cardName').value;
    const expiryDate = document.getElementById('expiryDate').value;
    const cvv = document.getElementById('cvv').value;

    if (!Validators.isValidCardNumber(cardNumber)) {
      UI.showNotification('Número de cartão inválido.', 'error');
      return false;
    }
    if (!cardName.trim()) {
      UI.showNotification('Nome no cartão obrigatório.', 'error');
      return false;
    }
    if (!Validators.isValidExpiryDate(expiryDate)) {
      UI.showNotification('Data de validade inválida.', 'error');
      return false;
    }
    if (!Validators.isValidCVV(cvv)) {
      UI.showNotification('CVV inválido.', 'error');
      return false;
    }
  }

  return true;
}

/**
 * Manipula lookup de CEP
 */
async function handleCEPLookup() {
  const cepInput = document.getElementById('cep');
  const cep = cepInput.value.replace(/\D/g, '');

  if (!Validators.isValidCEP(cepInput.value)) {
    UI.showNotification('CEP inválido.', 'error');
    return;
  }

  try {
    const data = await API.lookupCEP(cep);
    document.getElementById('street').value = data.logradouro || '';
    document.getElementById('neighborhood').value = data.bairro || '';
    document.getElementById('city').value = data.localidade || '';
    document.getElementById('state').value = data.uf || '';
    UI.showNotification('Endereço carregado com sucesso!', 'success');
  } catch (error) {
    UI.showNotification('CEP não encontrado.', 'error');
  }
}

/**
 * Atualiza resumo do pedido
 */
function updateOrderSummary() {
  const itemsEl = document.getElementById('summaryItems');
  const subtotalEl = document.getElementById('summarySubtotal');
  const shippingEl = document.getElementById('summaryShipping');
  const totalEl = document.getElementById('summaryTotal');

  if (!itemsEl) return;

  const shippingCost = 15.0;
  const subtotal = cart.getSubtotal();
  const total = cart.getTotal(shippingCost);

  itemsEl.innerHTML = cart.items
    .map(item => {
      const itemTotal = item.price * item.quantity;
      return `
        <div class="summary-item">
          <span>${item.title} (x${item.quantity})</span>
          <span>R$ ${Formatters.formatPrice(itemTotal)}</span>
        </div>
      `;
    })
    .join('');

  if (subtotalEl) subtotalEl.textContent = Formatters.formatPrice(subtotal);
  if (shippingEl) shippingEl.textContent = Formatters.formatPrice(shippingCost);
  if (totalEl) totalEl.textContent = Formatters.formatPrice(total);
}

/**
 * Configura formatadores
 */
function setupFormatters() {
  const inputFormatters = [
    { selector: '#cpf', formatter: (el) => Formatters.formatCPF(el) },
    { selector: '#cep', formatter: (el) => Formatters.formatCEP(el) },
    { selector: '#phone', formatter: (el) => Formatters.formatPhone(el) },
    { selector: '#cardNumber', formatter: (el) => Formatters.formatCardNumber(el) },
    { selector: '#expiryDate', formatter: (el) => Formatters.formatExpiryDate(el) }
  ];

  inputFormatters.forEach(({ selector, formatter }) => {
    const input = document.querySelector(selector);
    if (input) {
      input.addEventListener('input', () => formatter(input));
    }
  });
}

/**
 * Configura busca
 */
function setupSearch() {
  const searchInput = document.querySelector('.search-input');
  const searchBtn = document.querySelector('.search-btn');

  if (!searchInput) return;

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    const cards = document.querySelectorAll('.manga-card');

    cards.forEach(card => {
      const title = card.querySelector('.manga-title')?.textContent.toLowerCase() || '';
      const genres = card.getAttribute('data-genre')?.toLowerCase() || '';

      card.style.display = title.includes(query) || genres.includes(query) ? 'block' : 'none';
    });
  });

  if (searchBtn) {
    searchBtn.addEventListener('click', () => handleRemoteSearch());
  }

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRemoteSearch();
    }
  });
}

/**
 * Manipula busca remota via API Jikan
 */
async function handleRemoteSearch() {
  const query = document.querySelector('.search-input').value.trim();
  if (!query) {
    // Mostrar catálogo normalmente
    const section = document.getElementById('catalog');
    if (section) section.style.display = '';
    return;
  }

  const results = await API.searchAnime(query, 8);

  // Renderizar resultados
  const section = document.getElementById('jikanResultsSection');
  const grid = document.getElementById('jikanResultsGrid');

  if (!section || !grid) return;

  if (results.length === 0) {
    section.style.display = 'none';
    document.getElementById('catalog').style.display = '';
    return;
  }

  section.style.display = 'block';
  document.getElementById('catalog').style.display = 'none';

  grid.innerHTML = results
    .map(item => {
      const id = item.mal_id || 0;
      catalog.cache.set(String(id), item);
      return catalog._generateCardHTML(item, id);
    })
    .join('');
}

/**
 * Configura carousséis
 */
function setupCarousels() {
  // Hero carousel
  const heroSlides = document.querySelectorAll('.hero-slide');
  const heroIndicators = document.querySelectorAll('.hero-indicator');
  let currentHeroSlide = 0;

  if (heroSlides.length > 0) {
    const showHeroSlide = (index) => {
      heroSlides.forEach(s => s.classList.remove('active'));
      heroIndicators.forEach(i => i.classList.remove('active'));
      if (heroSlides[index]) {
        heroSlides[index].classList.add('active');
        heroIndicators[index].classList.add('active');
        currentHeroSlide = index;
      }
    };

    heroIndicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => showHeroSlide(index));
    });

    setInterval(
      () => {
        currentHeroSlide = (currentHeroSlide + 1) % heroSlides.length;
        showHeroSlide(currentHeroSlide);
      },
      10000
    );
  }

  // Store carousel
  const storeSlides = document.querySelectorAll('.carousel-slide');
  const storeIndicators = document.querySelectorAll('.indicator');
  const prevBtn = document.querySelector('.prev-btn');
  const nextBtn = document.querySelector('.next-btn');
  let currentStoreSlide = 0;

  if (storeSlides.length > 0) {
    const showSlide = (index) => {
      storeSlides.forEach(s => s.classList.remove('active'));
      storeIndicators.forEach(i => i.classList.remove('active'));
      if (storeSlides[index]) {
        storeSlides[index].classList.add('active');
        storeIndicators[index].classList.add('active');
        currentStoreSlide = index;
      }
    };

    const nextSlide = () => {
      currentStoreSlide = (currentStoreSlide + 1) % storeSlides.length;
      showSlide(currentStoreSlide);
    };

    const prevSlide = () => {
      currentStoreSlide = (currentStoreSlide - 1 + storeSlides.length) % storeSlides.length;
      showSlide(currentStoreSlide);
    };

    if (nextBtn) nextBtn.addEventListener('click', nextSlide);
    if (prevBtn) prevBtn.addEventListener('click', prevSlide);

    storeIndicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => showSlide(index));
    });

    setInterval(nextSlide, 10000);
  }
}

/**
 * Configura scroll suave
 */
function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

// Expor para uso global (atualizar carrinho via onclick)
window.cart = cart;
window.updateCartDisplay = updateCartDisplay;

/**
 * Finaliza pedido
 */
/**
 * Coleta todos os dados do checkout
 * @returns {Object} Dados completos do checkout
 */
function getCheckoutData() {
  return {
    // Dados pessoais
    fullName: document.getElementById('fullName')?.value || '',
    email: document.getElementById('email')?.value || '',
    phone: document.getElementById('phone')?.value || '',
    cpf: document.getElementById('cpf')?.value || '',
    birthDate: document.getElementById('birthDate')?.value || null,

    // Endereço
    cep: document.getElementById('cep')?.value || '',
    street: document.getElementById('street')?.value || '',
    number: document.getElementById('number')?.value || '',
    neighborhood: document.getElementById('neighborhood')?.value || '',
    city: document.getElementById('city')?.value || '',
    state: document.getElementById('state')?.value || '',
    complement: document.getElementById('complement')?.value || '',

    // Pagamento
    cardNumber: document.getElementById('cardNumber')?.value || '',
    cardName: document.getElementById('cardName')?.value || '',
    expiryDate: document.getElementById('expiryDate')?.value || '',
    cvv: document.getElementById('cvv')?.value || '',
    installments: parseInt(document.getElementById('installments')?.value) || 1,

    // Total do carrinho
    total: cart.getTotal()
  };
}

function completeOrder() {
  if (!validateCheckoutStep(currentCheckoutStep)) {
    return;
  }

  // Coletar dados do checkout
  const checkoutData = getCheckoutData();

  // Mostrar processamento
  UI.showNotification('Processando pedido...', 'info');

  // Enviar para backend
  API.submitCheckout(checkoutData)
    .then(response => {
      if (response.status === 'ok') {
        // Limpar carrinho
        cart.clear();
        updateCartDisplay();

        // Fechar checkout
        closeCheckout();

        // Mostrar sucesso com ID do pedido
        UI.showSuccess(`Pedido ${response.order_id} realizado com sucesso!`);
      } else {
        UI.showNotification('Erro ao processar pedido: ' + response.msg, 'error');
      }
    })
    .catch(error => {
      console.error('Erro no checkout:', error);
      UI.showNotification('Erro ao processar pedido. Tente novamente.', 'error');
    });
}

/**
 * Avança para próxima etapa
 */
function nextStep() {
  console.log('nextStep called, currentCheckoutStep:', currentCheckoutStep);
  const isValid = validateCheckoutStep(currentCheckoutStep);
  console.log('Validation result:', isValid);
  if (isValid) {
    currentCheckoutStep++;
    console.log('Advancing to step:', currentCheckoutStep);
    updateCheckoutStepDisplay();
    if (currentCheckoutStep === 3) {
      updateOrderSummary();
    }
  } else {
    console.log('Validation failed, staying on step:', currentCheckoutStep);
  }
}

/**
 * Volta para etapa anterior
 */
function prevStep() {
  currentCheckoutStep--;
  updateCheckoutStepDisplay();
}

// Expor funções para o escopo global (necessário para onclick no HTML)
window.nextStep = nextStep;
window.prevStep = prevStep;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.clearCart = clearCart;
window.checkout = checkout;
window.completeOrder = completeOrder;
