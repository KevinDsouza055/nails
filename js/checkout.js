// checkout.js — Razorpay test integration
import "./app.js";

const RAZORPAY_KEY = "rzp_test_SqMLV95BbHrYtR"; // Replace with your actual Key ID from Razorpay Dashboard

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}

function renderSummary() {
  const wrap = document.getElementById("summary-items");
  const subEl = document.getElementById("sum-sub");
  const shipEl = document.getElementById("sum-ship");
  const totalEl = document.getElementById("sum-total");
  if (!wrap) return;

  if (!Komaura.State.cart.length) {
    wrap.innerHTML = `<p style="color:var(--mauve);font-size:14px">Your bag is empty. <a href="shop.html" style="color:var(--rose)">Shop now</a></p>`;
    subEl.textContent = shipEl.textContent = totalEl.textContent = "₹0";
    document.getElementById("pay-btn")?.setAttribute("disabled", "true");
    return;
  }
  wrap.innerHTML = Komaura.State.cart.map(item => {
    const p = Komaura.State.products.find(x => x.id === item.id);
    if (!p) return "";
    return `<div class="item">
      <img src="${p.images[0]}" alt=""/>
      <div><div class="nm">${p.name}</div><div class="meta">${p.shape} · qty ${item.qty}</div></div>
      <div>${Komaura.INR(p.price * item.qty)}</div>
    </div>`;
  }).join("");
  const sub = Komaura.Cart.total();
  const ship = sub >= 1499 ? 0 : 99;
  subEl.textContent = Komaura.INR(sub);
  shipEl.textContent = ship === 0 ? "Free" : Komaura.INR(ship);
  totalEl.textContent = Komaura.INR(sub + ship);
}

async function handlePay(formData) {
  const btn = document.getElementById("pay-btn");
  const sub = Komaura.Cart.total();
  const ship = sub >= 1499 ? 0 : 99;
  const total = sub + ship;
  if (total <= 0) { Komaura.toast("Your bag is empty"); return; }

  btn.disabled = true;
  btn.textContent = "Loading payment…";

  let order_id = null;
  try {
    // Using a relative path works automatically on Vercel
    const response = await fetch('/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: Komaura.State.cart })
    });
    const data = await response.json();
    order_id = data.id;
  } catch (err) {
    console.error("Order creation failed", err);
    Komaura.toast("Secure connection failed. Please try again.");
    btn.disabled = false;
    btn.textContent = "Pay now";
    return;
  }

  const options = {
    key: RAZORPAY_KEY,
    amount: total * 100, // This is now just a backup; Razorpay uses the order_id amount
    order_id: order_id, 
    currency: "INR",
    name: "Komaura Beauty",
    description: "Handcrafted soft gel press-ons",
    image: "assets/pics/komauralogo.jpg",
    prefill: {
      name: formData.name,
      email: formData.email,
      contact: formData.phone
    },
    notes: {
      address: `${formData.address}, ${formData.city}, ${formData.state} ${formData.pin}`
    },
    theme: { color: "#C9847A" },
    handler: function (response) {
      // success — clear cart and show confirmation
      console.log("payment success", response);
      Komaura.State.cart.length = 0;
      localStorage.setItem("k_cart", "[]");
      Komaura.Cart.updateBadge();
      document.querySelector(".checkout-grid").innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:60px 20px">
          <span class="script" style="font-size:42px;color:var(--rose)">thank you</span>
          <h2 style="margin:8px 0 12px">Your order is confirmed</h2>
          <p style="color:var(--mauve);max-width:480px;margin:0 auto">Payment ID: <code>${response.razorpay_payment_id}</code><br/>We'll email tracking details to ${formData.email} within 24 hours.</p>
          <a href="shop.html" class="btn btn-primary" style="margin-top:24px">Continue shopping</a>
        </div>`;
    },
    modal: {
      ondismiss: function () {
        btn.disabled = false;
        btn.textContent = "Pay now";
      }
    }
  };

  try {
    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", function (response) {
      console.error("payment failed", response);
      Komaura.toast("Payment failed. Please try again.");
      btn.disabled = false;
      btn.textContent = "Pay now";
    });
    rzp.open();
  } catch (e) {
    console.error(e);
    btn.disabled = false;
    btn.textContent = "Pay now";
    Komaura.toast("Couldn't open payment. Try again.");
  }
}

(async function () {
  await Komaura.boot("");
  renderSummary();
  document.getElementById("checkout-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    // basic validation
    for (const k of ["name","email","phone","address","city","state","pin"]) {
      if (!data[k]) { Komaura.toast("Please complete every field"); return; }
    }
    if (!/^\S+@\S+\.\S+$/.test(data.email)) { Komaura.toast("Please enter a valid email"); return; }
    if (!/^[6-9]\d{9}$/.test(data.phone)) { Komaura.toast("Please enter a valid 10-digit Indian mobile number"); return; }
    if (!/^\d{6}$/.test(data.pin)) { Komaura.toast("Please enter a valid 6-digit PIN code"); return; }
    handlePay(data);
  });
})();
