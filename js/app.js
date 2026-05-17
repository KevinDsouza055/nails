// ============================================
// KOMAURA — Core App (cart, wishlist, ui, search)
// ============================================

const INR = (n) => "₹" + Number(n).toLocaleString("en-IN");
const WA_NUMBER = "917900187209"; // Your WhatsApp number with country code

const Storage = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  },
  set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }
};

const State = {
  cart: Storage.get("k_cart", []),
  wishlist: Storage.get("k_wish", []),
  recent: Storage.get("k_recent", []),
  products: []
};

async function loadProducts() {
  if (State.products.length) return State.products;
  try {
    const res = await fetch("data/products.json");
    State.products = await res.json();
  } catch (e) {
    console.error("Failed to load products", e);
    State.products = [];
  }
  return State.products;
}

// ============================================
// TOAST
// ============================================
function toast(msg) {
  let wrap = document.querySelector(".toast-wrap");
  if (!wrap) { wrap = document.createElement("div"); wrap.className = "toast-wrap"; document.body.appendChild(wrap); }
  const t = document.createElement("div");
  t.className = "toast"; t.textContent = msg;
  wrap.appendChild(t);
  requestAnimationFrame(() => t.classList.add("show"));
  setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 400); }, 2400);
}

// ============================================
// CART
// ============================================
const Cart = {
  add(productId, qty = 1) {
    const p = State.products.find(x => x.id === productId);
    if (!p) return;
    const existing = State.cart.find(i => i.id === productId);
    if (existing) existing.qty = Math.min(existing.qty + qty, p.stock);
    else State.cart.push({ id: productId, qty: Math.min(qty, p.stock) });
    Storage.set("k_cart", State.cart);
    this.render(); this.updateBadge();
    toast(`${p.name} added to cart`);
  },
  update(productId, qty) {
    const item = State.cart.find(i => i.id === productId);
    if (!item) return;
    if (qty <= 0) { State.cart = State.cart.filter(i => i.id !== productId); }
    else { item.qty = qty; }
    Storage.set("k_cart", State.cart);
    this.render(); this.updateBadge();
  },
  remove(productId) { this.update(productId, 0); toast("Removed from cart"); },
  total() {
    return State.cart.reduce((sum, item) => {
      const p = State.products.find(x => x.id === item.id);
      return sum + (p ? p.price * item.qty : 0);
    }, 0);
  },
  count() { return State.cart.reduce((s, i) => s + i.qty, 0); },
  updateBadge() {
    document.querySelectorAll('[data-cart-count]').forEach(el => {
      const c = this.count();
      el.textContent = c; el.dataset.count = c;
      el.style.display = c > 0 ? "inline-flex" : "none";
    });
  },
  render() {
    const body = document.querySelector("[data-cart-body]");
    const foot = document.querySelector("[data-cart-foot]");
    if (!body) return;
    if (!State.cart.length) {
      body.innerHTML = `<div class="cart-empty"><span class="script">It's empty here</span><p>Discover our handcrafted sets to begin.</p></div>`;
      if (foot) foot.innerHTML = `<a href="shop.html" class="btn btn-primary btn-block">Shop the collection</a>`;
      return;
    }
    body.innerHTML = State.cart.map(item => {
      const p = State.products.find(x => x.id === item.id);
      if (!p) return "";
      return `
        <div class="cart-item">
          <img src="${p.images[0]}" alt="${p.name}" loading="lazy"/>
          <div>
            <div class="nm">${p.name}</div>
            <div class="meta">${p.shape} • ${p.length}</div>
            <div class="qty">
              <button aria-label="Decrease" data-qty-dec="${p.id}">−</button>
              <span>${item.qty}</span>
              <button aria-label="Increase" data-qty-inc="${p.id}">+</button>
            </div>
          </div>
          <div style="text-align:right">
            <div class="pr">${INR(p.price * item.qty)}</div>
            <button class="rm" data-remove="${p.id}">Remove</button>
          </div>
        </div>`;
    }).join("");
    const total = this.total();
    if (foot) {
      foot.innerHTML = `
        <div class="cart-totals"><span>Subtotal</span><span>${INR(total)}</span></div>
        <div class="cart-totals"><span>Shipping</span><span>${total >= 1499 ? "Complimentary" : INR(99)}</span></div>
        <div class="cart-totals grand"><span>Total</span><span>${INR(total + (total >= 1499 ? 0 : 99))}</span></div>
        <a href="checkout.html" class="btn btn-primary btn-block" style="margin-top:14px">Proceed to checkout</a>
        <p style="font-size:12px;color:var(--mauve);text-align:center;margin-top:10px">Free shipping on orders above ₹1,499</p>
      `;
    }
  },
  open() {
    document.querySelector(".drawer-backdrop")?.classList.add("open");
    document.querySelector(".drawer")?.classList.add("open");
    document.body.classList.add("lock");
  },
  close() {
    document.querySelector(".drawer-backdrop")?.classList.remove("open");
    document.querySelector(".drawer")?.classList.remove("open");
    document.body.classList.remove("lock");
  }
};

// ============================================
// WISHLIST
// ============================================
const Wish = {
  toggle(id) {
    const idx = State.wishlist.indexOf(id);
    if (idx >= 0) { State.wishlist.splice(idx, 1); toast("Removed from wishlist"); }
    else { State.wishlist.push(id); toast("Saved to wishlist"); }
    Storage.set("k_wish", State.wishlist);
    this.updateUI();
  },
  has(id) { return State.wishlist.includes(id); },
  updateUI() {
    document.querySelectorAll("[data-wish]").forEach(btn => {
      btn.classList.toggle("active", this.has(btn.dataset.wish));
    });
    document.querySelectorAll("[data-wish-count]").forEach(el => {
      const c = State.wishlist.length;
      el.textContent = c; el.dataset.count = c;
      el.style.display = c > 0 ? "inline-flex" : "none";
    });
  }
};

// ============================================
// RECENT
// ============================================
const Recent = {
  add(id) {
    State.recent = [id, ...State.recent.filter(x => x !== id)].slice(0, 6);
    Storage.set("k_recent", State.recent);
  }
};

// ============================================
// CARD HTML
// ============================================
function cardHTML(p) {
  const sale = p.compareAt ? `<span class="card-tag">Sale</span>` : (p.collection === "Bridal" ? `<span class="card-tag">Bridal</span>` : "");
  return `
    <article class="card reveal">
      <div class="card-media">
        ${sale}
        <button class="card-wish ${Wish.has(p.id) ? "active" : ""}" data-wish="${p.id}" aria-label="Save to wishlist">
          <svg viewBox="0 0 24 24"><path d="M12 21s-7-4.5-9.5-9C.5 8 3 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 4 0 6.5 4 4.5 8C19 16.5 12 21 12 21z"/></svg>
        </button>
        <a href="product.html?id=${p.id}" aria-label="${p.name}">
          <img class="main" src="${p.images[0]}" alt="${p.name}" loading="lazy"/>
          <img class="alt" src="${p.images[1] || p.images[0]}" alt="" loading="lazy"/>
        </a>
        <div class="card-quick"><button class="btn" data-add="${p.id}">Quick add</button></div>
      </div>
      <div class="card-body">
        <a href="product.html?id=${p.id}">
          <div class="card-name">${p.name}</div>
          <div class="card-tagline">${p.tagline}</div>
        </a>
        <div class="card-foot">
          <div class="card-price">${p.compareAt ? `<span class="compare">${INR(p.compareAt)}</span>` : ""}${INR(p.price)}</div>
          <div class="card-rating">★ ${p.rating}</div>
        </div>
      </div>
    </article>`;
}

// ============================================
// EVENT DELEGATION
// ============================================
document.addEventListener("click", (e) => {
  const add = e.target.closest("[data-add]");
  if (add) { e.preventDefault(); Cart.add(add.dataset.add); return; }
  const wish = e.target.closest("[data-wish]");
  if (wish) { e.preventDefault(); e.stopPropagation(); Wish.toggle(wish.dataset.wish); return; }
  const inc = e.target.closest("[data-qty-inc]");
  if (inc) {
    const item = State.cart.find(i => i.id === inc.dataset.qtyInc);
    const p = State.products.find(x => x.id === inc.dataset.qtyInc);
    if (item && p && item.qty < p.stock) Cart.update(item.id, item.qty + 1);
    return;
  }
  const dec = e.target.closest("[data-qty-dec]");
  if (dec) {
    const item = State.cart.find(i => i.id === dec.dataset.qtyDec);
    if (item) Cart.update(item.id, item.qty - 1);
    return;
  }
  const rm = e.target.closest("[data-remove]");
  if (rm) { Cart.remove(rm.dataset.remove); return; }

  if (e.target.closest("[data-cart-open]")) { Cart.open(); }
  if (e.target.closest("[data-cart-close]") || e.target.classList.contains("drawer-backdrop")) { Cart.close(); }

  const searchOpen = e.target.closest("[data-search-open]");
  if (searchOpen) {
    const so = document.querySelector(".search-overlay");
    so?.classList.add("open");
    so?.setAttribute("aria-hidden", "false");
    setTimeout(() => so?.querySelector("input")?.focus(), 200);
  }

  if (e.target.closest("[data-menu-open]")) {
    const mm = document.querySelector(".mobile-menu");
    mm?.classList.add("open");
    mm?.setAttribute("aria-hidden", "false");
    document.body.classList.add("lock");
  }

  if (e.target.closest("[data-menu-close]")) {
    const mm = document.querySelector(".mobile-menu");
    mm?.classList.remove("open");
    mm?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lock");
  }
});

// ============================================
// NAVBAR / MOBILE MENU / SEARCH
// ============================================
function initUI() {
  const nav = document.querySelector(".nav");
  const onScroll = () => nav?.classList.toggle("scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const mm = document.querySelector(".mobile-menu");
  mm?.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
    mm.classList.remove("open");
    mm?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lock");
  }));

  // search
  const so = document.querySelector(".search-overlay");
  so?.addEventListener("click", (e) => { 
    if (e.target === so) { 
      so.classList.remove("open"); 
      so.setAttribute("aria-hidden", "true");
    } 
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      so?.classList.remove("open"); 
      so?.setAttribute("aria-hidden", "true");
      Cart.close();
      mm?.classList.remove("open"); mm?.setAttribute("aria-hidden", "true"); document.body.classList.remove("lock"); menuBtn?.focus();
    }
  });

  const si = so?.querySelector("input");
  si?.addEventListener("input", () => {
    const q = si.value.trim().toLowerCase();
    const out = so.querySelector(".search-results");
    if (!q) { out.innerHTML = ""; return; }
    const matches = State.products.filter(p =>
      p.name.toLowerCase().includes(q) || p.tagline.toLowerCase().includes(q) || p.collection.toLowerCase().includes(q)
    ).slice(0, 6);
    out.innerHTML = matches.length
      ? matches.map(p => `<a class="search-result" href="product.html?id=${p.id}"><img src="${p.images[0]}" alt=""/><div><div class="nm">${p.name}</div><div class="pr">${INR(p.price)}</div></div></a>`).join("")
      : `<p style="color:var(--mauve);font-size:14px;padding:12px 4px">No results for "${q}"</p>`;
  });
}

// ============================================
// REVEAL ON SCROLL
// ============================================
function initReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("in")); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en, i) => {
      if (en.isIntersecting) {
        setTimeout(() => en.target.classList.add("in"), i * 60);
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(el => io.observe(el));
}

// ============================================
// ACCORDION
// ============================================
function initAccordion(scope = document) {
  scope.querySelectorAll(".acc-item").forEach(item => {
    const t = item.querySelector(".acc-trigger");
    const c = item.querySelector(".acc-content");
    t?.addEventListener("click", () => {
      const open = item.classList.toggle("open");
      c.style.maxHeight = open ? c.scrollHeight + "px" : "0";
    });
  });
}

// ============================================
// COMPONENT INJECTION
// ============================================
function navHTML(active = "") {
  const a = (h, l) => `<a href="${h}" ${active === h ? 'class="active"' : ""}>${l}</a>`;
  const isA = (h) => (active === h || (active === "" && h === "index.html")) ? "active" : "";

  return `
  <nav class="nav">
    <div class="nav-inner">
      <div class="nav-left">
        <div class="nav-links">
          ${a("shop.html", "Shop")}
          ${a("about.html", "Story")}
          ${a("faq.html", "FAQ")}
          ${a("contact.html", "Contact")}
        </div>
      </div>
      <a href="index.html" class="logo"><img src="assets/pics/komauralogo.jpg" alt=""/>Komaura <span>Beauty</span></a>
      <div class="nav-actions">
        <button class="icon-btn" data-search-open aria-label="Search">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        </button>
        <a href="wishlist.html" class="icon-btn" aria-label="Wishlist">
          <svg viewBox="0 0 24 24"><path d="M12 21s-7-4.5-9.5-9C.5 8 3 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 4 0 6.5 4 4.5 8C19 16.5 12 21 12 21z"/></svg>
          <span class="badge" data-wish-count></span>
        </a>
        <button class="icon-btn" data-cart-open aria-label="Open cart">
          <svg viewBox="0 0 24 24"><path d="M6 7h12l-1.4 11.2a2 2 0 0 1-2 1.8H9.4a2 2 0 0 1-2-1.8L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>
          <span class="badge" data-cart-count></span>
        </button>
      </div>
    </div>
  </nav>

  <div class="mobile-bottom-nav">
    <a href="index.html" class="mbn-item ${isA("index.html")}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5z"/></svg>
      <span>Home</span>
    </a>
    <a href="shop.html" class="mbn-item ${isA("shop.html")}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 7h12l1 13H5L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>
      <span>Shop</span>
    </a>
    <button class="mbn-item" data-search-open>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
      <span>Search</span>
    </button>
    <a href="wishlist.html" class="mbn-item ${isA("wishlist.html")}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 21s-7-4.5-9.5-9C.5 8 3 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 4 0 6.5 4 4.5 8C19 16.5 12 21 12 21z"/></svg>
      <span class="badge" data-wish-count></span>
      <span>Wishlist</span>
    </a>
    <button class="mbn-item" data-cart-open>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 7h12l-1.4 11.2a2 2 0 0 1-2 1.8H9.4a2 2 0 0 1-2-1.8L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>
      <span class="badge" data-cart-count></span>
      <span>Bag</span>
    </button>
    <button class="mbn-item" data-menu-open>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 8h16M4 16h16" stroke-width="1.5"/></svg>
      <span>Menu</span>
    </button>
  </div>

  <div class="mobile-menu" aria-hidden="true">
    <div class="mm-head">
      <div class="logo"><img src="assets/pics/komauralogo.jpg" alt=""/>Komaura <span>Beauty</span></div>
      <button class="icon-btn" data-menu-close aria-label="Close menu">
        <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
      </button>
    </div>
    <div class="mm-links">
      <a href="index.html">Home</a>
      <a href="shop.html">Shop All</a>
      <a href="wishlist.html">Wishlist</a>
      <a href="about.html">Our Story</a>
      <div class="secondary-links">
        <a href="faq.html">FAQ & Care</a>
        <a href="contact.html">Contact Us</a>
      </div>
    </div>
    <div class="mm-foot">
      <span class="script">handcrafted in Jodhpur</span>
      <p>Soft gel press-ons. Made slow, made beautiful.</p>
    </div>
  </div>

  <div class="search-overlay" aria-hidden="true">
    <div class="search-box">
      <input type="search" placeholder="Search the collection…" aria-label="Search products"/>
      <div class="search-results"></div>
    </div>
  </div>

  <div class="drawer-backdrop"></div>
  <aside class="drawer" aria-label="Shopping cart">
    <div class="drawer-head">
      <h3>Your bag</h3>
      <button class="icon-btn" data-cart-close aria-label="Close cart">
        <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
      </button>
    </div>
    <div class="drawer-body" data-cart-body></div>
    <div class="drawer-foot" data-cart-foot></div>
  </aside>
  `;
}

function footerHTML() {
  return `
  <footer class="footer">
    <div class="container">
      <div class="f-grid">
        <div class="f-col f-brand">
          <div class="logo"><img src="assets/pics/komauralogo.jpg" alt=""/>Komaura <span>Beauty</span></div>
          <p>Soft gel press-on nails, hand-painted in Jodhpur. Slow craft for the modern woman.</p>
        </div>
        <div class="f-col">
          <h4>Shop</h4>
          <a href="shop.html">All sets</a>
          <a href="shop.html?c=Signature">Signature</a>
          <a href="shop.html?c=Bridal">Bridal</a>
          <a href="shop.html?c=Editorial">Editorial</a>
        </div>
        <div class="f-col">
          <h4>Care</h4>
          <a href="faq.html">FAQ</a>
          <a href="faq.html#shipping">Shipping</a>
          <a href="faq.html#returns">Returns</a>
          <a href="contact.html">Contact</a>
        </div>
        <div class="f-col">
          <h4>Studio</h4>
          <a href="about.html">Our story</a>
          <a href="https://instagram.com" target="_blank" rel="noopener">Instagram</a>
          <a href="mailto:growsites1512@gmail.com">growsites1512@gmail.com</a>
          <a href="#">Jodhpur, India</a>
        </div>
      </div>
      <div class="f-bottom">
        <div style="display:flex;gap:16px;flex-wrap:wrap">
          <span>© ${new Date().getFullYear()} Komaura Beauty</span>
          <a href="privacy.html" style="text-decoration:underline">Privacy Policy</a>
          <a href="terms.html" style="text-decoration:underline">Terms of Service</a>
        </div>
        <span>Crafted slowly, with love.</span>
      </div>
    </div>
  </footer>`;
}

function injectChrome(activePage) {
  const nh = document.getElementById("nav-host");
  const fh = document.getElementById("footer-host");
  if (nh) nh.innerHTML = navHTML(activePage);
  if (fh) fh.innerHTML = footerHTML();
}

function injectWA() {
  if (document.getElementById("global-wa")) return;
  const wa = document.createElement("a");
  wa.id = "global-wa";
  wa.className = "wa-float";
  wa.href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Hi Komaura! I have a question about your nail sets.")}`;
  wa.target = "_blank";
  wa.rel = "noopener";
  wa.setAttribute("aria-label", "Chat on WhatsApp");
  wa.innerHTML = `<svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.148-.67-1.611-.918-2.21-.242-.585-.487-.506-.67-.515-.174-.008-.372-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>`;
  document.body.appendChild(wa);
}

// ============================================
// BOOTSTRAP
// ============================================
async function boot(activePage) {
  injectChrome(activePage);
  await loadProducts();
  initUI();
  Cart.render();
  Cart.updateBadge();
  Wish.updateUI();
  initReveal();
  initAccordion();
  injectWA();
}

window.Komaura = { State, Cart, Wish, Recent, loadProducts, cardHTML, INR, toast, boot, initReveal, initAccordion, WA_NUMBER };
