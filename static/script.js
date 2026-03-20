
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentStep = 1;
let orderNumber = '';

let catalogPage = 1;
const catalogPageSize = 12;
let isCatalogLoading = false;

const catalogCache = new Map();

document.addEventListener('DOMContentLoaded', function() {
    // Inicialização
    updateCartDisplay();
    updateCartCount();

    // Inicializa todas as funcionalidades
    initializeFilters();
    initializeSearch();
    initializeCarousels();
    initializePaymentMethods();
    initializeMangaCards(); // Interliga botões do carrinho
    initializeProductModal();
    initializeCepLookup();
    initializeSmoothScroll();
    initializeCatalog(); // Carrega catálogo usando Jikan
});


function initializeMangaCards() {
    document.addEventListener('click', function(event) {
        // Botão de adicionar ao carrinho
        const button = event.target.closest('.add-to-cart-btn');
        if (button) {
            const id = parseInt(button.getAttribute('data-id'));
            const nome = button.getAttribute('data-nome');
            const preco = parseFloat(button.getAttribute('data-preco'));
            const imagem = button.getAttribute('data-imagem');

            addToCart(id, nome, preco, imagem);
            return;
        }

        // Clique no card para abrir modal de detalhes
        const card = event.target.closest('.manga-card');
        if (!card) return;

        const id = card.getAttribute('data-id');
        if (id) {
            openProductModalById(id);
        }
    });
}

function initializeProductModal() {
    const modal = document.getElementById('productModal');
    if (!modal) return;

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeProductModal();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.classList.contains('show')) {
            closeProductModal();
        }
    });
}

function initializeCepLookup() {
    const cepInput = document.getElementById('cep');
    const cepButton = document.getElementById('cepLookupBtn');
    if (!cepInput || !cepButton) return;

    cepButton.addEventListener('click', () => {
        const cepDigits = cepInput.value.replace(/\D/g, '');
        if (!/^[0-9]{8}$/.test(cepDigits)) {
            showNotification('Informe um CEP válido (8 dígitos).', 'error');
            cepInput.focus();
            return;
        }
        lookupCep(cepDigits);
    });
}

function formatPrice(value) {
    const amount = Number(value);
    if (Number.isNaN(amount)) {
        return '0,00';
    }
    return amount.toFixed(2).replace('.', ',');
}

function makePriceFromScore(score) {
    // Gera um preço fictício baseado no score do mangá/anime
    const base = 19.9;
    const extra = score ? Math.min(Math.max(score, 0), 10) * 1.5 : 0;
    return (base + extra).toFixed(2);
}

function getItemCacheKey(item, useNegativeId = false) {
    if (!item || !item.mal_id) return null;
    const id = useNegativeId ? -Math.abs(item.mal_id) : item.mal_id;
    return String(id);
}

function cacheCatalogItem(item, useNegativeId = false) {
    const key = getItemCacheKey(item, useNegativeId);
    if (!key) return null;
    catalogCache.set(key, item);
    return key;
}

function getCachedProductById(id) {
    return catalogCache.get(String(id));
}

function openProductModalById(id) {
    const product = getCachedProductById(id);
    if (!product) return;
    openProductModal(product, id);
}

function openProductModal(product, id) {
    const modal = document.getElementById('productModal');
    if (!modal) return;

    const titleEl = document.getElementById('productModalTitle');
    const genresEl = document.getElementById('productModalGenres');
    const scoreEl = document.getElementById('productModalScore');
    const synopsisEl = document.getElementById('productModalSynopsis');
    const priceEl = document.getElementById('productModalPrice');
    const imageEl = document.getElementById('productModalImage');
    const linkEl = document.getElementById('productModalLink');
    const addToCartBtn = document.getElementById('productModalAddToCart');

    if (titleEl) titleEl.textContent = product.title || 'Sem título';
    if (genresEl) genresEl.textContent = Array.isArray(product.genres) ? product.genres.join(', ') : '';
    if (scoreEl) {
        const parts = [];
        if (product.score) parts.push(`Score: ${product.score.toFixed(1)}`);
        else parts.push('Score: N/A');

        if (product.type) parts.push(product.type);
        if (product.status) parts.push(product.status);
        if (product.rank) parts.push(`Rank #${product.rank}`);

        scoreEl.textContent = parts.join(' • ');
    }

    const typeEl = document.getElementById('productModalType');
    const statusEl = document.getElementById('productModalStatus');
    const publishedEl = document.getElementById('productModalPublished');
    const volumesEl = document.getElementById('productModalVolumes');
    const chaptersEl = document.getElementById('productModalChapters');
    const authorsEl = document.getElementById('productModalAuthors');

    if (typeEl) typeEl.textContent = product.type || '—';
    if (statusEl) statusEl.textContent = product.status || '—';

    if (publishedEl) {
        const from = product.published_from || null;
        const to = product.published_to || null;
        if (from && to) {
            publishedEl.textContent = `${from} → ${to}`;
        } else if (from) {
            publishedEl.textContent = from;
        } else {
            publishedEl.textContent = '—';
        }
    }

    if (volumesEl) volumesEl.textContent = product.volumes ?? '—';
    if (chaptersEl) chaptersEl.textContent = product.chapters ?? '—';
    if (authorsEl) authorsEl.textContent = Array.isArray(product.authors) && product.authors.length > 0 ? product.authors.join(', ') : '—';

    if (synopsisEl) synopsisEl.textContent = product.synopsis || '';
    if (priceEl) priceEl.textContent = `R$ ${makePriceFromScore(product.score).replace('.', ',')}`;
    if (imageEl) imageEl.src = product.image_url || product.image || 'https://via.placeholder.com/240x340?text=Sem+Imagem';

    if (linkEl) {
        linkEl.href = product.url || '#';
        linkEl.target = '_blank';
    }

    if (addToCartBtn) {
        addToCartBtn.onclick = () => {
            addToCart(parseInt(id, 10), product.title, makePriceFromScore(product.score), imageEl.src);
            closeProductModal();
        };
    }

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (!modal) return;
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

function initializeCatalog() {
    const loadMoreBtn = document.querySelector('.load-more-btn');

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            loadCatalogPage(catalogPage + 1);
        });
    }

    loadCatalogPage(1);
}

async function loadCatalogPage(page = 1) {
    if (isCatalogLoading) return;
    isCatalogLoading = true;

    const grid = document.getElementById('catalogGrid');
    if (!grid) {
        isCatalogLoading = false;
        return;
    }

    if (page === 1) {
        grid.innerHTML = '';
    }

    try {
        const response = await fetch(`/api/jikan/manga/top?limit=${catalogPageSize}&page=${page}`);
        if (!response.ok) {
            console.error('Falha ao carregar catálogo', response.status);
            showNotification('Não foi possível carregar o catálogo de mangás. Tente novamente em alguns instantes.', 'error');
            return;
        }

        const json = await response.json();
        const items = Array.isArray(json.data) ? json.data : [];
        if (items.length === 0) {
            console.warn('Nenhum item retornado do catálogo');
            const loadMoreBtn = document.querySelector('.load-more-btn');
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
            grid.innerHTML = '<p class="empty-message">Nenhum mangá encontrado no momento. Tente novamente mais tarde.</p>';
            return;
        }

        renderCatalogItems(items, page > 1);
        catalogPage = page;
        const loadMoreBtn = document.querySelector('.load-more-btn');
        if (loadMoreBtn) loadMoreBtn.style.display = items.length < catalogPageSize ? 'none' : 'block';
    } catch (error) {
        console.error('Erro ao carregar catálogo:', error);
        showNotification('Erro de conexão ao carregar o catálogo.', 'error');
        grid.innerHTML = '<p class="empty-message">Erro ao carregar catálogo. Verifique sua conexão.</p>';
    } finally {
        isCatalogLoading = false;
    }
}

function generateMangaCardHTML(item, id) {
    const image = item.image_url || 'https://via.placeholder.com/240x340?text=Sem+Imagem';
    const title = item.title || 'Sem título';
    const score = item.score ? item.score.toFixed(1) : null;
    const synopsis = (item.synopsis || '').replace(/\s+/g, ' ').trim();
    const synopsisShort = synopsis.length > 120 ? synopsis.slice(0, 120).trim() + '...' : synopsis;
    const price = makePriceFromScore(item.score);
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

function renderCatalogItems(items, append = false) {
    const grid = document.getElementById('catalogGrid');
    if (!grid) return;

    const html = items.map(item => {
        const id = item.mal_id || 0;
        cacheCatalogItem(item);
        return generateMangaCardHTML(item, id);
    }).join('');

    if (append) {
        grid.insertAdjacentHTML('beforeend', html);
    } else {
        grid.innerHTML = html;
    }

    if (initializeFilters && typeof initializeFilters.updateFilterButtons === 'function') {
        initializeFilters.updateFilterButtons();
    }
}


// Funcao de Carrinho
function addToCart(id, title, price, image) {
    const finalPrice = parseFloat(price);
    
    const existingItem = cart.find(item => item.id === id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: id,
            title: title,
            price: finalPrice,
            image: image, 
            quantity: 1
        });
    }
    
    // Confirmação para o backend 
    fetch('/adicionar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nome: title, preco: finalPrice })
    }).then(response => {
        if (!response.ok) {
            console.error('Erro ao comunicar com o servidor.');
        }
        // Continua a lógica de frontend
        saveCart();
        updateCartDisplay();
        updateCartCount();
        showAddToCartAnimation(id);
    });
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateCartDisplay();
    updateCartCount();
}

function updateQuantity(id, newQuantity) {
    if (newQuantity <= 0) {
        removeFromCart(id);
        return;
    }
    
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity = newQuantity;
        saveCart();
        updateCartDisplay();
        updateCartCount();
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartCount() {
    const cartCount = document.querySelector('.cart-count');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const checkoutBtn = document.querySelector('.checkout-btn');
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Seu carrinho está vazio</p>
            </div>
        `;
        cartTotal.textContent = '0,00';
        checkoutBtn.disabled = true;
    } else {
        cartItems.innerHTML = cart.map(item => {
            const imagePath = item.image; 
            
            return `
                <div class="cart-item">
                    <img src="${imagePath}" alt="${item.title}" class="cart-item-image">
                    <div class="cart-item-details">
                        <div class="cart-item-title">${item.title}</div>
                        <div class="cart-item-price">R$ ${item.price.toFixed(2).replace('.', ',')}</div>
                        <div class="cart-item-controls">
                            <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                            <span class="quantity-display">${item.quantity}</span>
                            <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                            <button class="remove-item" onclick="removeFromCart(${item.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotal.textContent = total.toFixed(2).replace('.', ',');
        checkoutBtn.disabled = false;
    }
}

function showAddToCartAnimation(id) {
    const button = document.querySelector(`.add-to-cart-btn[data-id="${id}"]`);
    if (button) {
        button.classList.add('adding');
        button.innerHTML = '<i class="fas fa-check"></i> Adicionado!';
        setTimeout(() => {
            button.classList.remove('adding');
            button.innerHTML = '<i class="fas fa-cart-plus"></i> Adicionar ao Carrinho';
        }, 1500);
    }
}

// Funções (carrinho lateral, checkout, filtros, etc.)
function toggleCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    cartSidebar.classList.toggle('open');
    cartOverlay.classList.toggle('show');
}

function openCheckout() {
    if (cart.length === 0) return;
    const checkoutModal = document.getElementById('checkoutModal');
    checkoutModal.classList.add('show');
    updateOrderSummary();
    resetCheckoutForm();
}

function closeCheckout() {
    const checkoutModal = document.getElementById('checkoutModal');
    checkoutModal.classList.remove('show');
    currentStep = 1;
    updateStepDisplay();
}

function nextStep() {
    if (validateCurrentStep()) {
        currentStep++;
        updateStepDisplay();
    }
}

function prevStep() {
    currentStep--;
    updateStepDisplay();
}

function updateStepDisplay() {
    document.querySelectorAll('.step').forEach((step, index) => {
        step.classList.toggle('active', index + 1 <= currentStep);
    });

    document.querySelectorAll('.form-step').forEach((step, index) => {
        step.classList.toggle('active', index + 1 === currentStep);
    });
}

function validateCurrentStep() {
    const currentFormStep = document.getElementById(`step${currentStep}`);
    const requiredInputs = currentFormStep.querySelectorAll('input[required], select[required]');

    for (let input of requiredInputs) {
        if (!input.value.trim()) {
            input.focus();
            showNotification('Por favor, preencha todos os campos obrigatórios.', 'error');
            return false;
        }
    }

    // Validações específicas de cada etapa
    if (currentStep === 1) {
        const fullName = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const cpf = document.getElementById('cpf').value.trim();

        if (!/^[A-Za-zÀ-ÿ\s]+$/.test(fullName)) {
            showNotification('O nome deve conter apenas letras e espaços.', 'error');
            document.getElementById('fullName').focus();
            return false;
        }

        if (!isValidEmail(email)) {
            showNotification('E-mail inválido. Deve conter @ e domínio válido.', 'error');
            document.getElementById('email').focus();
            return false;
        }

        if (!isValidPhone(phone)) {
            showNotification('Telefone inválido. Use 10 ou 11 dígitos (DDD + número).', 'error');
            document.getElementById('phone').focus();
            return false;
        }

        if (!isValidCpf(cpf)) {
            showNotification('CPF inválido. Verifique os 11 dígitos.', 'error');
            document.getElementById('cpf').focus();
            return false;
        }
    }

    if (currentStep === 2) {
        const cep = document.getElementById('cep').value.trim();
        if (!isValidCep(cep)) {
            showNotification('Informe um CEP válido (8 dígitos).', 'error');
            document.getElementById('cep').focus();
            return false;
        }
    }

    if (currentStep === 3 && !validatePayment()) {
        return false;
    }

    return true;
}

function initializePaymentMethods() {
    const paymentMethods = document.querySelectorAll('input[name="payment"]');
    const cardDetails = document.getElementById('cardDetails');

    paymentMethods.forEach(input => {
        input.addEventListener('change', function() {
            if (this.value === 'creditCard' || this.value === 'debitCard') {
                cardDetails.style.display = 'block';
            } else {
                cardDetails.style.display = 'none';
            }
        });
    });
}

function updateOrderSummary() {
    const summaryItems = document.getElementById('summaryItems');
    const summarySubtotal = document.getElementById('summarySubtotal');
    const summaryShipping = document.getElementById('summaryShipping');
    const summaryTotal = document.getElementById('summaryTotal');
    const shippingCost = 15.00; // Custo fixo de frete

    let subtotal = 0;
    
    if (cart.length === 0) {
        summaryItems.innerHTML = '<p>Seu carrinho está vazio.</p>';
        subtotal = 0;
    } else {
        summaryItems.innerHTML = cart.map(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            return `
                <div class="summary-item">
                    <span>${item.title} (x${item.quantity})</span>
                    <span>R$ ${itemTotal.toFixed(2).replace('.', ',')}</span>
                </div>
            `;
        }).join('');
    }

    const total = subtotal + shippingCost;
    
    summarySubtotal.textContent = subtotal.toFixed(2).replace('.', ',');
    summaryShipping.textContent = shippingCost.toFixed(2).replace('.', ',');
    summaryTotal.textContent = total.toFixed(2).replace('.', ',');
}

function completeOrder() {
    const prevStep = currentStep;
    currentStep = 3;
    if (!validateCurrentStep()) {
        currentStep = prevStep;
        return;
    }
    currentStep = prevStep;

    orderNumber = 'MV-' + Math.floor(Math.random() * 900000 + 100000);

    cart = [];
    localStorage.removeItem('cart'); // Limpa completamente
    updateCartDisplay();
    updateCartCount();

    closeCheckout();
    openSuccessModal(orderNumber);
}

function validatePayment() {
    const paymentType = document.querySelector('input[name="payment"]:checked').value;
    
    if (paymentType === 'creditCard' || paymentType === 'debitCard') {
        const cardNumberRaw = document.getElementById('cardNumber').value.replace(/\D/g, '');
        const cardName = document.getElementById('cardName').value.trim();
        const expiryDate = document.getElementById('expiryDate').value.trim();
        const cvv = document.getElementById('cvv').value.replace(/\D/g, '');

        if (!/^[0-9]{16}$/.test(cardNumberRaw)) {
            showNotification('Número do cartão inválido. Deve ter 16 dígitos.', 'error');
            document.getElementById('cardNumber').focus();
            return false;
        }

        if (!cardName) {
            showNotification('Nome no cartão é obrigatório.', 'error');
            document.getElementById('cardName').focus();
            return false;
        }

        if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
            showNotification('Validade do cartão inválida. Use formato MM/AA.', 'error');
            document.getElementById('expiryDate').focus();
            return false;
        }

        const [month, year] = expiryDate.split('/').map(Number);
        if (month < 1 || month > 12) {
            showNotification('Mês de validade inválido.', 'error');
            document.getElementById('expiryDate').focus();
            return false;
        }

        if (!/^[0-9]{3,4}$/.test(cvv)) {
            showNotification('CVV inválido. Use 3 ou 4 dígitos.', 'error');
            document.getElementById('cvv').focus();
            return false;
        }
    }
    
    return true;
}

function openSuccessModal(num) {
    document.getElementById('orderNumber').textContent = num;
    document.getElementById('successModal').classList.add('show');
}

function closeSuccess() {
    document.getElementById('successModal').classList.remove('show');
    // Força o recarregamento do carrinho vazio na sidebar
    toggleCart(); 
}

function resetCheckoutForm() {
    currentStep = 1;
    updateStepDisplay();
    
    document.querySelectorAll('.checkout-form input').forEach(input => {
        if (input.type !== 'radio') input.value = '';
    });
    document.getElementById('state').selectedIndex = 0;
    document.getElementById('creditCard').checked = true;
    document.getElementById('cardDetails').style.display = 'block';
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.classList.add('notification', type);
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        notification.addEventListener('transitionend', () => {
            notification.remove();
        });
    }, 3000);
}

function initializeFilters() {
    const filterContainer = document.getElementById('filterContainer');
    if (!filterContainer) return;

    function buildButtons(genres) {
        filterContainer.innerHTML = '';

        const allBtn = document.createElement('button');
        allBtn.className = 'filter-btn active';
        allBtn.textContent = 'Todos';
        allBtn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            allBtn.classList.add('active');
            document.querySelectorAll('.manga-card').forEach(card => (card.style.display = 'block'));
        });
        filterContainer.appendChild(allBtn);

        genres.forEach(genre => {
            const btn = document.createElement('button');
            btn.className = 'filter-btn';
            btn.textContent = genre;
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                document.querySelectorAll('.manga-card').forEach(card => {
                    const cardGenres = (card.getAttribute('data-genre') || '').toLowerCase();
                    card.style.display = cardGenres.includes(genre.toLowerCase()) ? 'block' : 'none';
                });
            });
            filterContainer.appendChild(btn);
        });
    }

    function updateFilterButtons() {
        const cards = document.querySelectorAll('.manga-card');
        const genreSet = new Set();

        cards.forEach(card => {
            const genresText = card.getAttribute('data-genre') || '';
            genresText.split(',').forEach(g => {
                const trimmed = g.trim();
                if (trimmed) genreSet.add(trimmed);
            });
        });

        const genres = Array.from(genreSet).sort();
        buildButtons(genres);
    }

    // Atualiza os filtros a cada vez que o catálogo é renderizado
    updateFilterButtons();

    // Expor para uso externo (por exemplo, após renderizar novas páginas)
    initializeFilters.updateFilterButtons = updateFilterButtons;
}

async function fetchJikanResults(query, limit = 8) {
    if (!query) return [];

    try {
        const response = await fetch(`/api/jikan/anime?q=${encodeURIComponent(query)}&limit=${limit}`);
        if (!response.ok) {
            console.error('Falha ao buscar Jikan', response.status);
            return [];
        }
        const json = await response.json();
        return Array.isArray(json.data) ? json.data : [];
    } catch (error) {
        console.error('Erro ao buscar Jikan:', error);
        return [];
    }
}

function renderJikanResults(items) {
    const section = document.getElementById('jikanResultsSection');
    const grid = document.getElementById('jikanResultsGrid');
    if (!section || !grid) return;

    if (!items || items.length === 0) {
        section.style.display = 'none';
        grid.innerHTML = '';
        setCatalogVisible(true);
        return;
    }

    section.style.display = 'block';
    setCatalogVisible(false);

    grid.innerHTML = items.map(item => {
        const id = item.mal_id ? -item.mal_id : 0;
        cacheCatalogItem(item, true);
        return generateMangaCardHTML(item, id);
    }).join('');
}

function setCatalogVisible(visible) {
    const catalogSection = document.getElementById('catalog');
    if (!catalogSection) return;
    catalogSection.style.display = visible ? '' : 'none';
}

function initializeSearch() {
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');
    let searchTimeout;

    async function doRemoteSearch() {
        const query = searchInput.value.trim();
        if (!query) {
            renderJikanResults([]);
            setCatalogVisible(true);
            return;
        }

        const results = await fetchJikanResults(query, 8);
        renderJikanResults(results);
        setCatalogVisible(false);
    }

    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();

        if (!searchTerm) {
            renderJikanResults([]);
            setCatalogVisible(true);
            return;
        }

        // Apenas filtra o catálogo local enquanto o usuário digita.
        const mangaCards = document.querySelectorAll('#catalog .manga-card');
        mangaCards.forEach(card => {
            const title = card.querySelector('.manga-title').textContent.toLowerCase();
            const genres = card.getAttribute('data-genre').toLowerCase();

            if (title.includes(searchTerm) || genres.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });

    if (searchBtn) {
        searchBtn.addEventListener('click', async () => {
            await doRemoteSearch();
        });
    }

    searchInput.addEventListener('keydown', async (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            await doRemoteSearch();
        }
    });
}

function initializeCarousels() {
    const heroSlides = document.querySelectorAll('.hero-slide');
    const heroIndicators = document.querySelectorAll('.hero-indicator');
    let currentHeroSlide = 0;

    function showHeroSlide(index) {
        heroSlides.forEach(slide => slide.classList.remove('active'));
        heroIndicators.forEach(indicator => indicator.classList.remove('active'));
        
        if (heroSlides[index] && heroIndicators[index]) {
            heroSlides[index].classList.add('active');
            heroIndicators[index].classList.add('active');
            currentHeroSlide = index;
        }
    }

    function nextHeroSlide() {
        currentHeroSlide = (currentHeroSlide + 1) % heroSlides.length;
        showHeroSlide(currentHeroSlide);
    }

    heroIndicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => showHeroSlide(index));
    });

    setInterval(nextHeroSlide, 10000);

    const storeSlides = document.querySelectorAll('.carousel-slide');
    const storeIndicators = document.querySelectorAll('.indicator');
    const storePrevBtn = document.querySelector('.prev-btn');
    const storeNextBtn = document.querySelector('.next-btn');
    let currentStoreSlide = 0;

    function showStoreSlide(index) {
        storeSlides.forEach(slide => slide.classList.remove('active'));
        storeIndicators.forEach(indicator => indicator.classList.remove('active'));
        
        if (storeSlides[index] && storeIndicators[index]) {
            storeSlides[index].classList.add('active');
            storeIndicators[index].classList.add('active');
            currentStoreSlide = index;
        }
    }

    function nextStoreSlide() {
        currentStoreSlide = (currentStoreSlide + 1) % storeSlides.length;
        showStoreSlide(currentStoreSlide);
    }

    function prevStoreSlide() {
        currentStoreSlide = (currentStoreSlide - 1 + storeSlides.length) % storeSlides.length;
        showStoreSlide(currentStoreSlide);
    }

    if (storeNextBtn && storePrevBtn) {
        storeNextBtn.addEventListener('click', nextStoreSlide);
        storePrevBtn.addEventListener('click', prevStoreSlide);
    }

    storeIndicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => showStoreSlide(index));
    });

    setInterval(nextStoreSlide, 10000);
}

function initializeSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();

            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
}

// Funções de formatação de inputs (CPF, CEP, etc.)
function formatCPF(input) {
    let value = input.value.replace(/\D/g, '');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    input.value = value;
}

function formatCEP(input) {
    let value = input.value.replace(/\D/g, '');
    value = value.replace(/(\d{5})(\d)/, '$1-$2');
    input.value = value;

    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 8) {
        lookupCep(cleaned);
    }
}

async function lookupCep(cep) {
    const cepField = document.getElementById('cep');
    const streetField = document.getElementById('street');
    const neighborhoodField = document.getElementById('neighborhood');
    const cityField = document.getElementById('city');
    const stateField = document.getElementById('state');

    if (!cepField || !streetField || !neighborhoodField || !cityField || !stateField) return;
    if (!/^[0-9]{8}$/.test(cep)) return;

    try {
        const response = await fetch(`/api/cep/${cep}`);
        if (!response.ok) {
            throw new Error('CEP não encontrado');
        }

        const data = await response.json();
        streetField.value = data.logradouro || '';
        neighborhoodField.value = data.bairro || '';
        cityField.value = data.localidade || '';
        stateField.value = data.uf || '';

        showNotification('Endereço carregado a partir do CEP.', 'success');
    } catch (err) {
        console.warn('Falha ao buscar endereço via CEP:', err);
        streetField.value = '';
        neighborhoodField.value = '';
        cityField.value = '';
        stateField.value = '';
        showNotification('Não foi possível localizar o CEP informado.', 'error');
    }
}

function formatPhone(input) {
    let value = input.value.replace(/\D/g, '');
    value = value.replace(/(\d{2})(\d)/, '($1) $2');
    value = value.replace(/(\d{5})(\d)/, '$1-$2');
    input.value = value;
}

function formatCardNumber(input) {
    let value = input.value.replace(/\D/g, '');
    value = value.replace(/(\d{4})/g, '$1 ').trim();
    input.value = value;
}

function formatExpiryDate(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 2) {
        value = value.replace(/(\d{2})(\d)/, '$1/$2');
    }
    input.value = value;
}

function isValidEmail(email) {
    const trimmed = email.trim();
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(trimmed);
}

function isValidPhone(phone) {
    const digits = phone.replace(/\D/g, '');
    return /^(?:\d{10}|\d{11})$/.test(digits);
}

function isValidCpf(cpf) {
    const digits = cpf.replace(/\D/g, '');
    if (!/^\d{11}$/.test(digits)) return false;
    if (/^(\d)\1{10}$/.test(digits)) return false;

    const calcCheckDigit = (baseDigits) => {
        let multiplier = baseDigits.length + 1;
        const sum = baseDigits.split('').reduce((acc, digit) => acc + Number(digit) * multiplier--, 0);
        const result = 11 - (sum % 11);
        return result >= 10 ? 0 : result;
    };

    const firstNine = digits.slice(0, 9);
    const firstCheck = calcCheckDigit(firstNine);
    const secondCheck = calcCheckDigit(firstNine + firstCheck);

    return Number(digits[9]) === firstCheck && Number(digits[10]) === secondCheck;
}

function isValidCep(cep) {
    const digits = cep.replace(/\D/g, '');
    return /^\d{8}$/.test(digits);
}

document.addEventListener('DOMContentLoaded', function() {
    const cpfInput = document.getElementById('cpf');
    if (cpfInput) cpfInput.addEventListener('input', function() { formatCPF(this); });

    const cepInput = document.getElementById('cep');
    if (cepInput) cepInput.addEventListener('input', function() { formatCEP(this); });

    const phoneInput = document.getElementById('phone');
    if (phoneInput) phoneInput.addEventListener('input', function() { formatPhone(this); });

    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) cardNumberInput.addEventListener('input', function() { formatCardNumber(this); });

    const expiryInput = document.getElementById('expiryDate');
    if (expiryInput) expiryInput.addEventListener('input', function() { formatExpiryDate(this); });
});