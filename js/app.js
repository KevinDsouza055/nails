// ============================================
// KOMAURA — Core App (cart, wishlist, ui, search)
// ============================================

const INR = (n) => "₹" + Number(n).toLocaleString("en-IN");

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
  if (wish) { e.preventDefault(); Wish.toggle(wish.dataset.wish); return; }
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
  const menuBtn = document.querySelector("[data-menu-open]");

  menuBtn?.addEventListener("click", () => {
    mm?.classList.add("open");
    mm?.setAttribute("aria-hidden", "false");
    document.body.classList.add("lock");
  });

  document.querySelector("[data-menu-close]")?.addEventListener("click", () => {
    mm?.classList.remove("open"); 
    mm?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lock");
    menuBtn?.focus(); // Return focus to trigger to prevent ARIA errors
  });

  mm?.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
    mm.classList.remove("open");
    mm?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lock");
    menuBtn?.focus();
  }));

  // search
  const so = document.querySelector(".search-overlay");
  document.querySelector("[data-search-open]")?.addEventListener("click", () => {
    so?.classList.add("open"); setTimeout(() => so?.querySelector("input")?.focus(), 200);
  });
  so?.addEventListener("click", (e) => { if (e.target === so) { so.classList.remove("open"); } });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      so?.classList.remove("open"); Cart.close();
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
  return `
  <nav class="nav">
    <div class="nav-inner">
      <button class="icon-btn menu-btn" data-menu-open aria-label="Open menu">
        <svg viewBox="0 0 24 24"><path d="M3 7h18M3 12h18M3 17h18"/></svg>
      </button>
      <a href="index.html" class="logo">Komaura<span>b</span></a>
      <div class="nav-links">
        ${a("shop.html", "Shop")}
        ${a("about.html", "Story")}
        ${a("faq.html", "FAQ")}
        ${a("contact.html", "Contact")}
      </div>
      <div class="nav-actions">
        <button class="icon-btn" data-search-open aria-label="Search">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        </button>
        <a href="#" class="icon-btn" aria-label="Wishlist" onclick="event.preventDefault();window.location='shop.html'">
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

  <div class="mobile-menu" aria-hidden="true">
    <div class="mm-head">
      <a href="index.html" class="logo">Komaura<span>b</span></a>
      <button class="icon-btn" data-menu-close aria-label="Close menu">
        <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
      </button>
    </div>
    <div class="mm-links">
      <a href="index.html">Home</a>
      <a href="shop.html">Shop</a>
      <a href="about.html">Our story</a>
      <div class="secondary-links">
        <a href="faq.html">FAQ</a>
        <a href="contact.html">Contact</a>
        <a href="checkout.html">Checkout</a>
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
          <div class="logo">Komaura<span>b</span></div>
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
          <a href="mailto:hello@komaura.com">hello@komaura.com</a>
          <a href="#">Jodhpur, India</a>
        </div>
      </div>
      <div class="f-bottom">
        <span>© ${new Date().getFullYear()} Komaura Beauty. All rights reserved.</span>
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
}

window.Komaura = { State, Cart, Wish, Recent, loadProducts, cardHTML, INR, toast, boot, initReveal, initAccordion };
