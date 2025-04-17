document.addEventListener('DOMContentLoaded', function() {
    // Hide loader after 2 seconds
    setTimeout(() => {
        document.querySelector('.loader').classList.add('hidden');
    }, 2000);

    // Global variables
    let currentProducts = [];
    let currentLimit = 8;
    let cart = [];
    const productsContainer = document.getElementById('products-container');
    const loadMoreBtn = document.getElementById('load-more-btn');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const categoryCards = document.querySelectorAll('.category-card');
    const viewOptions = document.querySelectorAll('.view-option');
    const productModal = document.getElementById('product-modal');
    const modalBody = document.getElementById('modal-body');
    const closeModal = document.querySelector('.close-modal');
    const cartIcon = document.querySelector('.cart-icon');
    const cartSidebar = document.querySelector('.cart-sidebar');
    const closeCart = document.querySelector('.close-cart');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCount = document.querySelector('.cart-count');
    const cartTotal = document.querySelector('.total-amount');
    const checkoutBtn = document.querySelector('.checkout-btn');
    const cartOverlay = document.createElement('div');
    cartOverlay.className = 'cart-overlay';
    document.body.appendChild(cartOverlay);

    // API Configuration
    const API_BASE_URL = 'https://dummyjson.com/products';
    const PRODUCTS_PER_PAGE = 8;

    // Initialize
    fetchProducts();

    /* ========== EXISTING EVENT LISTENERS ========== */
    loadMoreBtn.addEventListener('click', loadMoreProducts);
    searchBtn.addEventListener('click', searchProducts);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchProducts();
    });
    
    closeModal.addEventListener('click', () => {
        productModal.classList.remove('active');
    });

    productModal.addEventListener('click', (e) => {
        if (e.target === productModal) {
            productModal.classList.remove('active');
        }
    });

    cartIcon.addEventListener('click', toggleCart);
    closeCart.addEventListener('click', toggleCart);
    cartOverlay.addEventListener('click', toggleCart);
    checkoutBtn.addEventListener('click', proceedToCheckout);

    // Category filters
    categoryCards.forEach(card => {
        card.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            fetchProductsByCategory(category);
            
            // Update active category
            categoryCards.forEach(c => c.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // View options
    viewOptions.forEach(option => {
        option.addEventListener('click', function() {
            viewOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            const viewType = this.getAttribute('data-view');
            productsContainer.className = 'recommendations-' + viewType;
        });
    });

    /* ========== EXISTING FUNCTIONS ========== */
    async function fetchProducts() {
        try {
            showLoader();
            const response = await fetch(`${API_BASE_URL}?limit=100`);
            const data = await response.json();
            currentProducts = data.products;
            displayProducts(currentProducts.slice(0, currentLimit));
            hideLoader();
        } catch (error) {
            console.error('Error fetching products:', error);
            hideLoader();
            showError('Failed to load products. Please try again later.');
        }
    }

    async function fetchProductsByCategory(category) {
        try {
            showLoader();
            const response = await fetch(`${API_BASE_URL}/category/${category}`);
            const data = await response.json();
            currentProducts = data.products;
            currentLimit = PRODUCTS_PER_PAGE;
            displayProducts(data.products.slice(0, currentLimit));
            window.scrollTo({ top: productsContainer.offsetTop - 100, behavior: 'smooth' });
            hideLoader();
        } catch (error) {
            console.error('Error fetching products by category:', error);
            hideLoader();
            showError('Failed to load category products. Please try again.');
        }
    }

    function displayProducts(products) {
        if (products.length === 0) {
            productsContainer.innerHTML = '<p class="no-products">No products found. Try a different search.</p>';
            loadMoreBtn.style.display = 'none';
            return;
        }

        productsContainer.innerHTML = products.map(product => `
            <div class="product-card" data-id="${product.id}">
                <div class="product-image-container">
                    <img src="${product.thumbnail}" alt="${product.title}" class="product-image">
                    <span class="product-badge">${product.brand || product.category}</span>
                    ${product.discountPercentage > 10 ? 
                      `<span class="discount-badge">${Math.round(product.discountPercentage)}% OFF</span>` : ''}
                </div>
                <div class="product-info">
                    <h4 class="product-title">${product.title}</h4>
                    <p class="product-category">${product.category}</p>
                    <div class="product-rating">
                        <div class="stars">
                            ${generateStarRating(product.rating)}
                        </div>
                        <span class="stock-indicator ${product.stock > 0 ? 'stock-in' : 'stock-out'}">
                            ${product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                        </span>
                    </div>
                    <div class="product-price">
                        <span class="price">$${product.price}</span>
                        <button class="add-to-cart" data-id="${product.id}">
                            <i class="fas fa-shopping-cart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Add event listeners to product cards
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', function(e) {
                // Don't open modal if clicking on add to cart button
                if (!e.target.closest('.add-to-cart')) {
                    const productId = this.getAttribute('data-id');
                    showProductDetails(productId);
                }
            });
        });

        // Add event listeners to add to cart buttons
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                const productId = this.getAttribute('data-id');
                addToCart(productId);
            });
        });

        // Show/hide load more button
        loadMoreBtn.style.display = currentProducts.length > currentLimit ? 'block' : 'none';
    }

    function generateStarRating(rating) {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5 ? 1 : 0;
        const emptyStars = 5 - fullStars - halfStar;
        
        return `
            ${'<i class="fas fa-star"></i>'.repeat(fullStars)}
            ${halfStar ? '<i class="fas fa-star-half-alt"></i>' : ''}
            ${'<i class="far fa-star"></i>'.repeat(emptyStars)}
        `;
    }

    function loadMoreProducts() {
        currentLimit += PRODUCTS_PER_PAGE;
        displayProducts(currentProducts.slice(0, currentLimit));
    }

    async function searchProducts() {
        const query = searchInput.value.trim();
        if (!query) return fetchProducts(); // Show all products if search is empty

        try {
            showLoader();
            const response = await fetch(`${API_BASE_URL}/search?q=${query}`);
            const data = await response.json();
            currentProducts = data.products;
            currentLimit = PRODUCTS_PER_PAGE;
            displayProducts(data.products.slice(0, currentLimit));
            window.scrollTo({ top: productsContainer.offsetTop - 100, behavior: 'smooth' });
            hideLoader();
        } catch (error) {
            console.error('Error searching products:', error);
            hideLoader();
            showError('Search failed. Please try again.');
        }
    }

    async function showProductDetails(productId) {
        try {
            showLoader();
            const response = await fetch(`${API_BASE_URL}/${productId}`);
            const product = await response.json();

            modalBody.innerHTML = `
                <div class="modal-image-container">
                    <img src="${product.thumbnail}" alt="${product.title}" class="modal-image">
                    <div class="image-gallery">
                        ${product.images.map((img, index) => 
                            `<img src="${img}" alt="${product.title}" ${index === 0 ? 'class="active"' : ''}>`
                        ).join('')}
                    </div>
                </div>
                <div class="modal-details">
                    <span class="modal-category">${product.category}</span>
                    <h2>${product.title}</h2>
                    <div class="modal-rating">
                        <div class="stars">
                            ${generateStarRating(product.rating)}
                        </div>
                        <span class="stock-indicator ${product.stock > 0 ? 'stock-in' : 'stock-out'}">
                            ${product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                        </span>
                    </div>
                    <div class="modal-price">
                        $${product.price}
                        ${product.discountPercentage > 0 ? 
                          `<span class="discount">${Math.round(product.discountPercentage)}% OFF</span>` : ''}
                    </div>
                    <p class="modal-description">${product.description}</p>
                    <div class="product-specs">
                        <h4>Specifications</h4>
                        <ul>
                            <li><strong>Brand:</strong> ${product.brand}</li>
                            <li><strong>Availability:</strong> ${product.stock > 0 ? 'In Stock' : 'Out of Stock'}</li>
                            <li><strong>Rating:</strong> ${product.rating}/5</li>
                            <li><strong>SKU:</strong> ${product.id}${Math.floor(1000 + Math.random() * 9000)}</li>
                        </ul>
                    </div>
                    <div class="modal-actions">
                        <button class="modal-btn primary add-to-cart-modal" data-id="${product.id}">Add to Cart</button>
                        <button class="modal-btn secondary">Wishlist</button>
                    </div>
                </div>
            `;

            // Initialize image gallery
            const galleryImages = document.querySelectorAll('.image-gallery img');
            const mainImage = document.querySelector('.modal-image');
            
            galleryImages.forEach(img => {
                img.addEventListener('click', function() {
                    // Update active state
                    galleryImages.forEach(i => i.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Update main image
                    mainImage.src = this.src;
                });
            });

            // Add event listener to modal add to cart button
            document.querySelector('.add-to-cart-modal').addEventListener('click', function() {
                const productId = this.getAttribute('data-id');
                addToCart(productId);
                productModal.classList.remove('active');
            });

            productModal.classList.add('active');
            hideLoader();
        } catch (error) {
            console.error('Error fetching product details:', error);
            hideLoader();
            showError('Failed to load product details. Please try again.');
        }
    }

    function addToCart(productId) {
        const product = currentProducts.find(p => p.id == productId);
        if (!product) return;

        const existingItem = cart.find(item => item.id == productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: product.id,
                title: product.title,
                price: product.price,
                thumbnail: product.thumbnail,
                quantity: 1
            });
        }

        updateCart();
        showToast(`${product.title} added to cart`);
    }

    function updateCart() {
        // Update cart count
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = totalItems;

        // Update cart items
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Your cart is empty</p>
                </div>
            `;
        } else {
            cartItemsContainer.innerHTML = cart.map(item => `
                <div class="cart-item" data-id="${item.id}">
                    <img src="${item.thumbnail}" alt="${item.title}" class="cart-item-image">
                    <div class="cart-item-details">
                        <h4 class="cart-item-title">${item.title}</h4>
                        <div class="cart-item-price">$${item.price}</div>
                        <div class="cart-item-quantity">
                            <button class="quantity-btn decrease">-</button>
                            <input type="number" class="quantity-input" value="${item.quantity}" min="1">
                            <button class="quantity-btn increase">+</button>
                        </div>
                        <button class="remove-item">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    </div>
                </div>
            `).join('');

            // Add event listeners to quantity buttons
            document.querySelectorAll('.quantity-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const cartItem = this.closest('.cart-item');
                    const itemId = cartItem.getAttribute('data-id');
                    const input = cartItem.querySelector('.quantity-input');
                    let quantity = parseInt(input.value);

                    if (this.classList.contains('decrease')) {
                        if (quantity > 1) {
                            quantity -= 1;
                        }
                    } else {
                        quantity += 1;
                    }

                    input.value = quantity;
                    updateCartItem(itemId, quantity);
                });
            });

            // Add event listeners to quantity inputs
            document.querySelectorAll('.quantity-input').forEach(input => {
                input.addEventListener('change', function() {
                    const cartItem = this.closest('.cart-item');
                    const itemId = cartItem.getAttribute('data-id');
                    let quantity = parseInt(this.value) || 1;
                    this.value = quantity; // Ensure it's at least 1
                    updateCartItem(itemId, quantity);
                });
            });

            // Add event listeners to remove buttons
            document.querySelectorAll('.remove-item').forEach(button => {
                button.addEventListener('click', function() {
                    const cartItem = this.closest('.cart-item');
                    const itemId = cartItem.getAttribute('data-id');
                    removeFromCart(itemId);
                });
            });
        }

        // Update cart total
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotal.textContent = `$${total.toFixed(2)}`;
    }

    function updateCartItem(productId, quantity) {
        const item = cart.find(item => item.id == productId);
        if (item) {
            item.quantity = quantity;
            updateCart();
        }
    }

    function removeFromCart(productId) {
        cart = cart.filter(item => item.id != productId);
        updateCart();
        showToast('Item removed from cart');
    }

    function toggleCart() {
        cartSidebar.classList.toggle('active');
        cartOverlay.classList.toggle('active');
        document.body.style.overflow = cartSidebar.classList.contains('active') ? 'hidden' : '';
    }

    function proceedToCheckout() {
        if (cart.length === 0) {
            showToast('Your cart is empty!', 'error');
            return;
        }
        showToast('Proceeding to checkout!');
        // In a real app, you would redirect to checkout page
        console.log('Checkout:', cart);
    }

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }

    function showError(message) {
        productsContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
            </div>
        `;
    }

    function showLoader() {
        productsContainer.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading products...</p>
            </div>
        `;
    }

    function hideLoader() {
        const loader = document.querySelector('.loading-spinner');
        if (loader) loader.remove();
    }

/* ========== IMPROVED CHATBOT CODE ========== */
const chatbotToggle = document.querySelector('.chatbot-toggle');
const chatbotWindow = document.querySelector('.chatbot-window');
const closeChatbot = document.querySelector('.close-chatbot');
const chatbotMessages = document.getElementById('chatbot-messages');
const chatbotInput = document.getElementById('chatbot-user-input');
const chatbotSend = document.getElementById('chatbot-send');

// Enhanced category mapping
const categories = {
    'shirt': 'tops', 'shirts': 'tops', 't-shirt': 'tops', 'tshirt': 'tops',
    'jeans': 'pants', 'pant': 'pants', 'trousers': 'pants',
    'shoe': 'footwear', 'shoes': 'footwear', 'sneaker': 'footwear', 'sneakers': 'footwear',
    'phone': 'smartphones', 'mobile': 'smartphones', 'smartphone': 'smartphones',
    'laptop': 'laptops', 'notebook': 'laptops', 'macbook': 'laptops',
    'perfume': 'fragrances', 'cologne': 'fragrances', 'attar': 'fragrances',
    'cream': 'skincare', 'lotion': 'skincare', 'facewash': 'skincare', 'serum': 'skincare',
    'grocery': 'groceries', 'food': 'groceries', 'snacks': 'groceries',
    'home': 'home-decoration', 'decor': 'home-decoration', 'furniture': 'home-decoration',
    'watch': 'watches', 'clock': 'watches', 'smartwatch': 'watches',
    'bag': 'bags', 'handbag': 'bags', 'backpack': 'bags'
};

// Enhanced attributes mapping
const attributes = {
    'formal': 'formal', 'office': 'formal', 'business': 'formal',
    'casual': 'casual', 'regular': 'casual', 'everyday': 'casual',
    'wedding': 'wedding', 'marriage': 'wedding', 'function': 'wedding',
    'party': 'party', 'night': 'party', 'club': 'party',
    'gift': 'gift', 'present': 'gift', 'surprise': 'gift',
    'trendy': 'trendy', 'fashionable': 'trendy', 'stylish': 'trendy',
    'cheap': 'affordable', 'affordable': 'affordable', 'budget': 'affordable',
    'expensive': 'premium', 'luxury': 'premium', 'premium': 'premium',
    'summer': 'summer', 'hot': 'summer', 'light': 'summer',
    'winter': 'winter', 'cold': 'winter', 'woolen': 'winter'
};

// Chatbot Event Listeners
chatbotToggle.addEventListener('click', toggleChatbot);
closeChatbot.addEventListener('click', toggleChatbot);
chatbotSend.addEventListener('click', sendChatMessage);
chatbotInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') sendChatMessage();
});

function toggleChatbot() {
    chatbotWindow.classList.toggle('active');
}

function sendChatMessage() {
    const message = chatbotInput.value.trim();
    if (!message) return;

    // Add user message to chat
    addChatMessage(message, 'user');
    chatbotInput.value = '';
    
    // Show typing indicator
    const typingIndicator = showTypingIndicator();
    
    // Process the message (with slight delay for natural feel)
    setTimeout(() => {
        try {
            processUserMessage(message);
        } catch (error) {
            console.error('Chatbot error:', error);
            typingIndicator.remove();
            addChatMessage("I'm having trouble understanding. Could you try rephrasing?", 'bot');
        }
    }, 1000);
}

function addChatMessage(message, sender, isProduct = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chatbot-message ${sender}`;
    
    if (isProduct) {
        messageDiv.classList.add('recommendation');
        messageDiv.innerHTML = message;
    } else {
        messageDiv.innerHTML = `<p>${message}</p>`;
    }
    
    chatbotMessages.appendChild(messageDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chatbot-message bot';
    typingDiv.innerHTML = `
        <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    chatbotMessages.appendChild(typingDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    return typingDiv;
}

function processUserMessage(message) {
    // Remove any existing typing indicator
    document.querySelector('.typing-indicator')?.remove();
    
    // First try to understand the request
    const requirements = understandRequestLocally(message);
    
    // Get matching products from our database
    const recommendedProducts = findMatchingProducts(requirements);
    
    // Display response and recommendations
    if (recommendedProducts.length > 0) {
        addChatMessage(generateResponseMessage(requirements, recommendedProducts.length), 'bot');
        
        const productsHTML = recommendedProducts.map(product => `
            <div class="recommendation-product" data-id="${product.id}">
                <img src="${product.thumbnail}" alt="${product.title}" class="recommendation-product-image">
                <div class="recommendation-product-details">
                    <div class="recommendation-product-title">${product.title}</div>
                    <div class="recommendation-product-price">$${product.price}</div>
                </div>
            </div>
        `).join('');
        
        addChatMessage(productsHTML, 'bot', true);
        
        // Add click event to recommended products
        document.querySelectorAll('.recommendation-product').forEach(product => {
            product.addEventListener('click', function() {
                const productId = this.getAttribute('data-id');
                showProductDetails(productId);
                toggleChatbot();
            });
        });
    } else {
        // More helpful fallback message
        addChatMessage("I couldn't find exact matches for your request. Here are some popular items you might like:", 'bot');
        
        // Show some fallback products (sorted by rating)
        const fallbackProducts = [...currentProducts]
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 3);
            
        const productsHTML = fallbackProducts.map(product => `
            <div class="recommendation-product" data-id="${product.id}">
                <img src="${product.thumbnail}" alt="${product.title}" class="recommendation-product-image">
                <div class="recommendation-product-details">
                    <div class="recommendation-product-title">${product.title}</div>
                    <div class="recommendation-product-price">$${product.price}</div>
                </div>
            </div>
        `).join('');
        
        addChatMessage(productsHTML, 'bot', true);
    }
}

function understandRequestLocally(message) {
    const lowerMessage = message.toLowerCase();
    
    // 1. Detect category
    let detectedCategory = null;
    for (const [keyword, category] of Object.entries(categories)) {
        if (lowerMessage.includes(keyword)) {
            detectedCategory = category;
            break;
        }
    }
    
    // 2. Detect price range (support multiple currencies and formats)
    let maxPrice = null;
    const priceMatches = [
        ...lowerMessage.matchAll(/(under|below|less than)\s*(\$|₹|rs\.?)?\s*(\d+)/gi),
        ...lowerMessage.matchAll(/(\$|₹|rs\.?)\s*(\d+)/gi),
        ...lowerMessage.matchAll(/\b(\d+)\s*(dollars|rupees|rs)/gi)
    ];
    
    if (priceMatches.length > 0) {
        // Take the last matched price (most likely the one user intended)
        const lastMatch = priceMatches[priceMatches.length - 1];
        maxPrice = parseInt(lastMatch[3] || lastMatch[2] || lastMatch[1]);
    }
    
    // 3. Detect other attributes
    const detectedAttributes = [];
    for (const [keyword, attribute] of Object.entries(attributes)) {
        if (lowerMessage.includes(keyword)) {
            detectedAttributes.push(attribute);
        }
    }
    
    // 4. Detect special keywords
    const specialKeywords = {
        'best': { sort: 'rating', order: 'desc' },
        'cheapest': { sort: 'price', order: 'asc' },
        'newest': { sort: 'id', order: 'desc' },
        'popular': { sort: 'rating', order: 'desc' }
    };
    
    let sortOption = null;
    for (const [keyword, option] of Object.entries(specialKeywords)) {
        if (lowerMessage.includes(keyword)) {
            sortOption = option;
            break;
        }
    }
    
    return {
        category: detectedCategory,
        maxPrice: maxPrice,
        attributes: detectedAttributes,
        sort: sortOption,
        originalMessage: message
    };
}

function findMatchingProducts(requirements) {
    let products = [...currentProducts]; // Create a copy
    
    // 1. Filter by category if specified
    if (requirements.category) {
        products = products.filter(product => 
            product.category.toLowerCase().includes(requirements.category)
        );
    }
    
    // 2. Filter by max price if specified
    if (requirements.maxPrice) {
        products = products.filter(product => product.price <= requirements.maxPrice);
    }
    
    // 3. Filter by attributes if specified
    if (requirements.attributes.length > 0) {
        products = products.filter(product => {
            const productText = `${product.title} ${product.description} ${product.brand}`.toLowerCase();
            return requirements.attributes.some(attr => 
                productText.includes(attr)
            );
        });
    }
    
    // 4. Sort if specified
    if (requirements.sort) {
        products.sort((a, b) => {
            if (requirements.sort.order === 'asc') {
                return a[requirements.sort.sort] - b[requirements.sort.sort];
            } else {
                return b[requirements.sort.sort] - a[requirements.sort.sort];
            }
        });
    }
    
    // 5. If still no results, try keyword matching
    if (products.length === 0) {
        const keywords = requirements.originalMessage.toLowerCase()
            .split(' ')
            .filter(word => word.length > 3 && !['want', 'need', 'show', 'me', 'find'].includes(word));
        
        if (keywords.length > 0) {
            products = currentProducts.filter(product => {
                const productText = `${product.title} ${product.description}`.toLowerCase();
                return keywords.some(kw => productText.includes(kw));
            });
        }
    }
    
    // Return top 3 matches (or all if less than 3)
    return products.slice(0, 3);
}

function generateResponseMessage(requirements, count) {
    let messageParts = [];
    
    // Basic response
    if (count === 1) {
        messageParts.push("I found 1 product");
    } else {
        messageParts.push(`I found ${count} products`);
    }
    
    messageParts.push("that might interest you");
    
    // Add category if specified
    if (requirements.category) {
        messageParts.push(`in ${requirements.category}`);
    }
    
    // Add price if specified
    if (requirements.maxPrice) {
        messageParts.push(`under ₹${requirements.maxPrice}`);
    }
    
    // Add attributes if specified
    if (requirements.attributes.length > 0) {
        messageParts.push(`that are ${requirements.attributes.join(', ')}`);
    }
    
    // Add sorting if specified
    if (requirements.sort) {
        if (requirements.sort.sort === 'rating') {
            messageParts.push("(top rated)");
        } else if (requirements.sort.sort === 'price' && requirements.sort.order === 'asc') {
            messageParts.push("(most affordable)");
        } else if (requirements.sort.sort === 'id') {
            messageParts.push("(newest arrivals)");
        }
    }
    
    // Construct final message
    let message = messageParts.join(' ');
    
    // Add some variety to responses
    const prefixes = [
        "Great news!",
        "Here you go!",
        "Perfect!",
        "I've got just what you need!",
        "You'll love these!"
    ];
    
    if (count > 0) {
        message = `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${message}:`;
    }
    
    return message;
}
/* ========== END OF IMPROVED CHATBOT CODE ========== */
});