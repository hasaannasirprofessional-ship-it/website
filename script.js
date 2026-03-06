/* ============================================================
   LATE NIGHT PIZZA — JAVASCRIPT  (Production-ready refactor)
   ============================================================ */

'use strict';

// ============================================================
// CONFIGURATION
// ============================================================
const WHATSAPP_NUMBER = '923097741500';

// ============================================================
// CART STATE  (single source of truth)
// Each item: { id, name, price, qty }
// id = name + size label, ensures no duplicate when same pizza
// different sizes are stored separately.
// ============================================================
let cart = [];

/** Return validated numeric price (guards against NaN / undefined) */
function safePrice(price) {
    const n = Number(price);
    return isFinite(n) ? n : 0;
}

function getCartTotal() {
    return cart.reduce((sum, item) => sum + safePrice(item.price) * item.qty, 0);
}

function getTotalItems() {
    return cart.reduce((sum, item) => sum + item.qty, 0);
}

// ============================================================
// CART BADGE
// ============================================================
function updateCartBadge() {
    const el = document.getElementById('cartCount');
    if (!el) return;
    const count = getTotalItems();
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
}

// ============================================================
// ADD TO CART
// name  — display name (already includes size label when relevant)
// price — numeric price in PKR
// ============================================================
function addToCart(name, price) {
    const numPrice = safePrice(price);
    if (!name || numPrice <= 0) return; // guard against bad calls

    const id = name; // cart key == full display name (incl. size)
    const existing = cart.find(i => i.id === id);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ id, name, price: numPrice, qty: 1 });
    }
    syncCart();
    showToast(`🛒 Added: ${name}`);
}

/** Central sync — call after every cart mutation */
function syncCart() {
    updateCartBadge();
    renderCartSidebar();
    updateModalCart();
}

// ============================================================
// PIZZA SIZE PICKER MODAL
// Call this from pizza .menu-item clicks instead of addToCart
// directly, so the customer chooses S / M / L.
// sizes = [{ label:'S', price:449 }, { label:'M', price:800 }, ...]
// ============================================================
function openSizePicker(flavour, sizes) {
    // Build or reuse a lightweight size-picker overlay
    let picker = document.getElementById('sizePicker');
    if (!picker) {
        picker = document.createElement('div');
        picker.id = 'sizePicker';
        picker.style.cssText = [
            'position:fixed', 'inset:0', 'z-index:9999',
            'display:flex', 'align-items:center', 'justify-content:center',
            'background:rgba(0,0,0,0.75)', 'backdrop-filter:blur(4px)'
        ].join(';');
        document.body.appendChild(picker);
    }

    const validSizes = sizes.filter(s => safePrice(s.price) > 0);

    picker.innerHTML = `
      <div style="
        background:var(--dark-card,#1a1a1a);
        border:1px solid rgba(255,211,0,.25);
        border-radius:16px;
        padding:28px 24px;
        min-width:260px;
        text-align:center;
        box-shadow:0 8px 40px rgba(0,0,0,.6);
      ">
        <p style="color:var(--yellow,#ffd300);font-weight:700;font-size:0.72rem;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Choose Size</p>
        <h3 style="color:#fff;font-size:1.1rem;margin-bottom:20px;">${flavour}</h3>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
          ${validSizes.map(s => `
            <button onclick="pickSize('${flavour}','${s.label}',${s.price})"
              style="
                background:rgba(255,211,0,0.1);
                border:1.5px solid var(--yellow,#ffd300);
                color:#fff;
                border-radius:10px;
                padding:12px 18px;
                cursor:pointer;
                font-size:0.9rem;
                font-family:inherit;
                transition:background .2s;
              "
              onmouseover="this.style.background='rgba(255,211,0,0.25)'"
              onmouseout="this.style.background='rgba(255,211,0,0.1)'"
            >
              <strong>${s.label}</strong><br>
              <span style="font-size:0.78rem;color:#ccc;">Rs. ${safePrice(s.price).toLocaleString()}</span>
            </button>
          `).join('')}
        </div>
        <button onclick="closeSizePicker()"
          style="margin-top:18px;background:none;border:none;color:#888;cursor:pointer;font-size:0.8rem;">
          Cancel
        </button>
      </div>
    `;

    picker.style.display = 'flex';
    picker.onclick = (e) => { if (e.target === picker) closeSizePicker(); };
}

function pickSize(flavour, sizeLabel, price) {
    closeSizePicker();
    addToCart(`${flavour} (${sizeLabel})`, price);
}

function closeSizePicker() {
    const picker = document.getElementById('sizePicker');
    if (picker) picker.style.display = 'none';
}

// Pizza size data map — keyed by flavour name as used in HTML
const PIZZA_SIZES = {
    // ── Pizzas ──────────────────────────────────────────
    'Chicken Fajita': [{ label: 'S', price: 449 }, { label: 'M', price: 800 }, { label: 'L', price: 1250 }],
    'Chicken BBQ': [{ label: 'S', price: 449 }, { label: 'M', price: 800 }, { label: 'L', price: 1250 }],
    'Super Supreme': [{ label: 'S', price: 500 }, { label: 'M', price: 850 }, { label: 'L', price: 1300 }],
    'Creamy Lasagna': [{ label: 'S', price: 580 }, { label: 'M', price: 899 }, { label: 'L', price: 1300 }],
    'Cheese Lover': [{ label: 'S', price: 500 }, { label: 'M', price: 850 }, { label: 'L', price: 1299 }],
    'Veggie Pizza': [{ label: 'S', price: 400 }, { label: 'M', price: 750 }, { label: 'L', price: 999 }],
    'Malai Boti': [{ label: 'S', price: 500 }, { label: 'M', price: 900 }, { label: 'L', price: 1350 }],
    'Pepperoni Pizza': [{ label: 'S', price: 500 }, { label: 'M', price: 850 }, { label: 'L', price: 1299 }],
    // ── Fries ───────────────────────────────────────────
    'Plain Fries': [{ label: 'S', price: 199 }, { label: 'L', price: 350 }],
    'Garlic Fries': [{ label: 'S', price: 250 }, { label: 'L', price: 350 }],
    'Masala Fries': [{ label: 'S', price: 250 }, { label: 'L', price: 350 }],
    'Loaded Fries': [{ label: 'S', price: 450 }, { label: 'L', price: 580 }],
    // ── Wings ───────────────────────────────────────────
    'Baked Wings': [{ label: '5pc', price: 299 }, { label: '10pc', price: 520 }],
    'Fried Wings': [{ label: '5pc', price: 299 }, { label: '10pc', price: 530 }],
    'Honey Wings': [{ label: '5pc', price: 350 }, { label: '10pc', price: 550 }],
    'Buffalo Wings': [{ label: '5pc', price: 350 }, { label: '10pc', price: 560 }],
};

/**
 * Called from pizza item clicks in HTML.
 * Uses the size picker overlay for multi-size pizzas.
 */
function selectPizza(flavour) {
    const sizes = PIZZA_SIZES[flavour];
    if (sizes) {
        openSizePicker(flavour, sizes);
    } else {
        // Fallback for single-price pizza items
        addToCart(flavour, 0);
    }
}

// ============================================================
// CART SIDEBAR RENDER
// ============================================================
function renderCartSidebar() {
    const container = document.getElementById('cartItems');
    const footer = document.getElementById('cartFooter');
    const totalEl = document.getElementById('cartTotal');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = '<p class="cart-empty">Your cart is empty. Add some delicious items!</p>';
        if (footer) footer.style.display = 'none';
        return;
    }

    if (footer) footer.style.display = 'block';
    if (totalEl) totalEl.textContent = `Rs. ${getCartTotal().toLocaleString()}`;

    container.innerHTML = cart.map((item, idx) => `
      <div class="cart-item-entry">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">Rs. ${(safePrice(item.price) * item.qty).toLocaleString()}</div>
        </div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="changeQty(${idx}, -1)">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty(${idx}, 1)">+</button>
        </div>
      </div>
    `).join('');
}

function changeQty(idx, delta) {
    if (!cart[idx]) return;
    cart[idx].qty += delta;
    if (cart[idx].qty <= 0) cart.splice(idx, 1);
    syncCart();
}

function clearCart() {
    cart = [];
    syncCart();
    showToast('🗑️ Cart cleared');
}

// ============================================================
// CART SIDEBAR TOGGLE
// ============================================================
function toggleCart() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('cartOverlay');
    if (!sidebar || !overlay) return;
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
    document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
}


// ============================================================
// WHATSAPP ORDER  (single, authoritative function)
// Prompts for delivery address, builds formatted message.
// ============================================================
function sendToWhatsApp() {
    if (cart.length === 0) {
        showToast('⚠️ Your cart is empty!');
        return;
    }

    const address = prompt('📍 Please enter your Current Address:');
    if (!address || address.trim() === '') {
        showToast('⚠️ Delivery address is required to place order.');
        return;
    }

    let message = '🛒 *New Order — Late Night Pizza*\n\n';

    cart.forEach(item => {
        const lineTotal = (safePrice(item.price) * item.qty).toLocaleString();
        message += `• ${item.name} ×${item.qty}  —  Rs. ${lineTotal}\n`;
    });

    message += `\n💰 *Total: Rs. ${getCartTotal().toLocaleString()}*`;
    message += `\n\n📍 *Delivery Address:*\n${address.trim()}`;

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
}

// ============================================================
// CONTACT FORM → WHATSAPP
// ============================================================
function submitForm(e) {
    e.preventDefault();
    const name = document.getElementById('name')?.value.trim() ?? '';
    const phone = document.getElementById('phone')?.value.trim() ?? '';
    const message = document.getElementById('message')?.value.trim() ?? '';

    if (!name || !phone || !message) {
        showToast('⚠️ Please fill all fields');
        return;
    }

    const waText = encodeURIComponent(
        `*Complain*\n\n👤 Name: ${name}\n📞 Phone: ${phone}\n📝 Message: ${message}`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`, '_blank');
    e.target.reset();
    showToast('✅ Message sent via WhatsApp!');
}

// ============================================================
// TOAST NOTIFICATION
// ============================================================
let toastTimer;
function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ============================================================
// OPEN / CLOSED STATUS BADGE
// ============================================================
function updateOpenStatus() {
    const badge = document.querySelector('.timing-badge');
    if (!badge) return;
    const hours = new Date().getHours(); // 0–23
    const isOpen = hours >= 14 || hours < 4;
    badge.innerHTML = `<span class="pulse-dot"></span> ${isOpen ? 'Open Now | 2PM – 4AM' : 'Closed Now | Opens 2PM'}`;
    badge.style.backgroundColor = isOpen ? '#1f3d1f' : '#3d1f1f';
}

// ============================================================
// NAVBAR — SCROLL & ACTIVE LINK
// ============================================================
function initNavbar() {
    const navbar = document.getElementById('navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');

    window.addEventListener('scroll', () => {
        navbar?.classList.toggle('scrolled', window.scrollY > 60);

        let current = '';
        sections.forEach(section => {
            if (window.scrollY >= section.offsetTop - 100) {
                current = section.getAttribute('id');
            }
        });
        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
        });
    }, { passive: true });
}

// ============================================================
// HAMBURGER MENU
// ============================================================
function toggleMenu() {
    document.getElementById('hamburger')?.classList.toggle('open');
    document.getElementById('navLinks')?.classList.toggle('open');
}

// ============================================================
// MENU FILTER TABS
// ============================================================
function filterMenu(category, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    document.querySelectorAll('.menu-column').forEach(col => {
        const cat = col.getAttribute('data-category');
        col.classList.toggle('hidden', category !== 'all' && cat !== category);
    });
}

// ============================================================
// SCROLL ANIMATIONS — Intersection Observer
// ============================================================
function initScrollAnimations() {
    const elements = document.querySelectorAll(
        '.deal-card, .menu-column, .contact-card, .contact-form-wrapper, .section-header'
    );
    elements.forEach(el => el.classList.add('animate-on-scroll'));

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                setTimeout(() => entry.target.classList.add('visible'), i * 60);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    elements.forEach(el => observer.observe(el));
}

// ============================================================
// DEAL CARD TILT EFFECT (subtle 3-D hover)
// ============================================================
function initTiltEffect() {
    document.querySelectorAll('.deal-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const rotateX = (((e.clientY - rect.top) / rect.height) - 0.5) * -8;
            const rotateY = (((e.clientX - rect.left) / rect.width) - 0.5) * 8;
            card.style.transform = `translateY(-8px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
        card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
}

// ============================================================
// SMOOTH SCROLL for anchor links
// ============================================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// ============================================================
// KEYBOARD: Escape closes cart / size picker
// ============================================================
document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeSizePicker();
    const sidebar = document.getElementById('cartSidebar');
    if (sidebar?.classList.contains('open')) toggleCart();
});

// Close mobile nav on any nav-link click
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        document.getElementById('hamburger')?.classList.remove('open');
        document.getElementById('navLinks')?.classList.remove('open');
    });
});

// ============================================================
// INIT — runs after DOM is ready
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    updateOpenStatus();
    initNavbar();
    initScrollAnimations();
    initTiltEffect();
    initSmoothScroll();
    renderCartSidebar();
    updateCartBadge();

    // Stagger animation delay on deal cards
    document.querySelectorAll('.deal-card').forEach((card, i) => {
        card.style.transitionDelay = `${i * 50}ms`;
    });
});

// ============================================================
// SEARCH FUNCTIONALITY
// ============================================================
function openSearch() {
    const query = prompt("What are you looking for? (e.g. pizza, burger, fries)");
    if (query) {
        searchMenu(query.toLowerCase());
    }
}

function searchMenu(input) {
    input = input.trim();
    if (input.includes("pizza") || input.includes("fajita") || input.includes("tikka")) {
        document.getElementById("pizza")?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (input.includes("burger") || input.includes("zinger") || input.includes("patty") || input.includes("wrap")) {
        document.getElementById("burgers")?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (input.includes("fries") || input.includes("side") || input.includes("wing") || input.includes("nugget")) {
        document.getElementById("fries")?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (input.includes("deal") || input.includes("combo") || input.includes("hot")) {
        document.getElementById("deals")?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
        showToast("🔍 Item not found in menu");
    }
}
