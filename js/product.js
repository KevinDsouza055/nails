// product.js — PDP
import "./app.js";

(async function () {
  await Komaura.boot("");
  const id = new URLSearchParams(location.search).get("id");
  const p = Komaura.State.products.find(x => x.id === id) || Komaura.State.products[0];
  if (!p) return;
  Komaura.Recent.add(p.id);

  const root = document.getElementById("pdp-root");
  root.innerHTML = `
    <div class="pdp-grid">
      <div>
        <div class="gallery-main"><img id="g-main" src="${p.images[0]}" alt="${p.name}"/></div>
        <div class="gallery-thumbs">
          ${p.images.map((src, i) => `<button class="${i===0?"active":""}" data-thumb="${i}"><img src="${src}" alt=""/></button>`).join("")}
        </div>
      </div>
      <div class="pdp-info">
        <div class="eyebrow">${p.collection} Collection</div>
        <h1>${p.name}</h1>
        <p class="tagline">${p.tagline}</p>
        <div class="pdp-price">${p.compareAt ? `<span class="compare">${Komaura.INR(p.compareAt)}</span>` : ""}${Komaura.INR(p.price)}</div>
        <div class="pdp-meta">
          <span>${p.shape}</span><span>${p.length} length</span><span>★ ${p.rating} (${p.reviews})</span>
        </div>
        <p class="pdp-desc">${p.description}</p>
        <div class="pdp-actions">
          <div class="qty">
            <button id="q-dec" aria-label="Decrease">−</button>
            <span id="q-val">1</span>
            <button id="q-inc" aria-label="Increase">+</button>
          </div>
          <button class="btn btn-primary" id="add-btn" style="flex:1">Add to bag — ${Komaura.INR(p.price)}</button>
          <button class="icon-btn ${Komaura.Wish.has(p.id)?'active':''}" data-wish="${p.id}" aria-label="Wishlist" style="border:1px solid rgba(42,31,31,.16)">
            <svg viewBox="0 0 24 24"><path d="M12 21s-7-4.5-9.5-9C.5 8 3 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 4 0 6.5 4 4.5 8C19 16.5 12 21 12 21z"/></svg>
          </button>
        </div>
        <div class="acc">
          <div class="acc-item">
            <button class="acc-trigger">What's inside <span class="ic">+</span></button>
            <div class="acc-content"><div><ul>${p.details.map(d => `<li>${d}</li>`).join("")}</ul></div></div>
          </div>
          <div class="acc-item">
            <button class="acc-trigger">Application <span class="ic">+</span></button>
            <div class="acc-content"><div>Cleanse and buff your natural nails. Match each soft gel tip to your nail bed. Apply a small drop of glue, press firmly for 15 seconds. Wear for up to 3 weeks.</div></div>
          </div>
          <div class="acc-item">
            <button class="acc-trigger">Shipping & care <span class="ic">+</span></button>
            <div class="acc-content"><div>Ships from Jodhpur within 2 business days. Free shipping on orders over ₹1,499. Store in the velvet pouch between wears.</div></div>
          </div>
        </div>
      </div>
    </div>
  `;

  // gallery
  let main = root.querySelector("#g-main");
  root.querySelectorAll("[data-thumb]").forEach(b => {
    b.addEventListener("click", () => {
      const i = +b.dataset.thumb;
      main.src = p.images[i];
      root.querySelectorAll("[data-thumb]").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
    });
  });

  // qty + add
  let qty = 1;
  const qv = root.querySelector("#q-val");
  root.querySelector("#q-dec").addEventListener("click", () => { if (qty > 1) { qty--; qv.textContent = qty; } });
  root.querySelector("#q-inc").addEventListener("click", () => { if (qty < p.stock) { qty++; qv.textContent = qty; } });
  root.querySelector("#add-btn").addEventListener("click", () => Komaura.Cart.add(p.id, qty));

  Komaura.initAccordion(root);

  // related
  const related = Komaura.State.products.filter(x => x.id !== p.id && x.collection === p.collection).slice(0, 4);
  const fallback = Komaura.State.products.filter(x => x.id !== p.id).slice(0, 4);
  const rel = related.length >= 3 ? related : fallback;
  document.getElementById("related-grid").innerHTML = rel.map(Komaura.cardHTML).join("");
  Komaura.initReveal();
  Komaura.Wish.updateUI();

  // sticky CTA
  const sticky = document.getElementById("sticky-cta");
  if (sticky) {
    sticky.querySelector(".pr").textContent = `${p.name} · ${Komaura.INR(p.price)}`;
    sticky.querySelector("button").addEventListener("click", () => Komaura.Cart.add(p.id, qty));
    const io = new IntersectionObserver(([e]) => sticky.classList.toggle("show", !e.isIntersecting), { threshold: 0 });
    io.observe(root.querySelector("#add-btn"));
  }

  // PRIORITY 7: SEO Structured Data
  document.title = `${p.name} — Komaura Beauty`;
  document.querySelector('meta[name="description"]')?.setAttribute("content", p.description);

  const schema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": p.name,
    "image": p.images,
    "description": p.description,
    "offers": {
      "@type": "Offer",
      "priceCurrency": "INR",
      "price": p.price,
      "availability": p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    }
  };
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.text = JSON.stringify(schema);
  document.head.appendChild(script);

  // Update WhatsApp message with product context
  const waBtn = document.getElementById("global-wa");
  if (waBtn) {
    const text = encodeURIComponent(`Hi Komaura! I'm interested in the "${p.name}" set (${p.shape}, ${p.length}). Could you help me with some details?\n\nLink: ${window.location.href}`);
    waBtn.href = `https://wa.me/${Komaura.WA_NUMBER}?text=${text}`;
  }
})();
