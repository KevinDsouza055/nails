import "./app.js";

async function renderWishlist() {
  await Komaura.boot("wishlist.html");
  
  const grid = document.getElementById("wishlist-grid");
  const empty = document.getElementById("wishlist-empty");
  const items = Komaura.State.products.filter(p => Komaura.Wish.has(p.id));

  if (items.length === 0) {
    grid.style.display = "none";
    empty.style.display = "block";
    document.getElementById("wishlist-count").textContent = "Your collection is waiting to be started.";
  } else {
    grid.style.display = "grid";
    empty.style.display = "none";
    grid.innerHTML = items.map(Komaura.cardHTML).join("");
    Komaura.initReveal();
  }
}

renderWishlist();