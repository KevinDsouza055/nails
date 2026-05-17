// shop.js — listing + filter + sort
import "./app.js";

const params = new URLSearchParams(location.search);
let activeCollection = params.get("c") || "All";
let activeShape = "All";
let sort = "featured";

function applyFilters() {
  let list = [...Komaura.State.products];
  if (activeCollection !== "All") list = list.filter(p => p.collection === activeCollection);
  if (activeShape !== "All") list = list.filter(p => p.shape === activeShape);
  switch (sort) {
    case "price-asc": list.sort((a,b) => a.price - b.price); break;
    case "price-desc": list.sort((a,b) => b.price - a.price); break;
    case "rating": list.sort((a,b) => b.rating - a.rating); break;
  }
  return list;
}

function render() {
  const list = applyFilters();
  const grid = document.getElementById("shop-grid");
  const count = document.getElementById("shop-count");
  if (count) count.textContent = `${list.length} ${list.length === 1 ? "set" : "sets"}`;
  if (grid) {
    grid.innerHTML = list.length ? list.map(Komaura.cardHTML).join("") : `<p style="grid-column:1/-1;text-align:center;color:var(--mauve);padding:48px 0">No sets match your filters yet.</p>`;
    Komaura.initReveal();
    Komaura.Wish.updateUI();
  }
}

(async function () {
  await Komaura.boot("shop.html");
  // collection chips
  document.querySelectorAll("[data-coll]").forEach(c => {
    if (c.dataset.coll === activeCollection) c.classList.add("active");
    c.addEventListener("click", () => {
      activeCollection = c.dataset.coll;
      document.querySelectorAll("[data-coll]").forEach(x => x.classList.toggle("active", x.dataset.coll === activeCollection));
      render();
    });
  });
  document.querySelectorAll("[data-shape]").forEach(c => {
    if (c.dataset.shape === activeShape) c.classList.add("active");
    c.addEventListener("click", () => {
      activeShape = c.dataset.shape;
      document.querySelectorAll("[data-shape]").forEach(x => x.classList.toggle("active", x.dataset.shape === activeShape));
      render();
    });
  });
  document.getElementById("sort")?.addEventListener("change", (e) => { sort = e.target.value; render(); });
  render();
})();
