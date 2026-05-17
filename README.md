# Komaura Beauty — Static site

A production-ready, mobile-first luxury ecommerce site for Komaura Beauty,
a handmade soft gel press-on nail brand based in Jodhpur, India.

## Stack
- HTML5, CSS3 (custom design system), Vanilla ES6 modules
- Razorpay Checkout SDK (test mode) for payments
- Google Fonts (Cormorant Garamond, DM Sans, Sacramento)

## Run locally
Because pages use ES modules and `fetch('data/products.json')`, you must
serve over HTTP (not `file://`). Any static server works:

```bash
cd komaura
python3 -m http.server 8000
# then open http://localhost:8000
```

or:

```bash
npx serve .
```

## Project structure
```
/index.html         — homepage
/shop.html          — listing with filter + sort
/product.html       — PDP (read ?id=...)
/about.html         — story
/faq.html           — accordions
/contact.html       — form
/checkout.html      — Razorpay checkout
/css/style.css      — full design system
/js/
  app.js            — core (cart, wishlist, ui, search, components)
  home.js
  shop.js
  product.js
  checkout.js
/data/products.json — product catalog
```

## Razorpay
The included key is the Razorpay public test key. Replace `RAZORPAY_KEY`
in `js/checkout.js` with your own. For production, generate orders on a
backend and pass `order_id` to the checkout options.

## Features
- Cart drawer + LocalStorage persistence
- Wishlist with persistence
- Product filtering (collection, shape) + sort
- Search overlay (live results)
- Quantity stepper, accordions, sticky mobile CTA
- Toast notifications
- Mobile fullscreen menu with body scroll lock & safe-area support
- Reveal-on-scroll animations (opacity/transform only)
- Responsive from 320px upward
