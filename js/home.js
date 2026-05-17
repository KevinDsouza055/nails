// home.js — featured + collections
import "./app.js";

(async function () {
  await Komaura.boot("index.html");
  const featured = Komaura.State.products.slice(0, 4);
  const grid = document.getElementById("featured-grid");
  if (grid) {
    grid.innerHTML = featured.map(Komaura.cardHTML).join("");
    Komaura.initReveal();
    Komaura.Wish.updateUI();
  }

  // newsletter
  document.getElementById("news-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = e.target.querySelector("input").value.trim();
    if (!email || !email.includes("@")) { Komaura.toast("Please enter a valid email"); return; }
    Komaura.toast("Welcome to the studio ✿");
    e.target.reset();
  });
  Komaura.injectWA(); // Inject WhatsApp button only on homepage
})();
