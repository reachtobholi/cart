(function () {
  'use strict';

  const KEY = 'bholiSpicesCartV4';
  const CHANNEL = 'bholi-spices-cart';
  const WA = '917068013290';

  let channel = null;
  try {
    if ('BroadcastChannel' in window) channel = new BroadcastChannel(CHANNEL);
  } catch (e) {}

  function get() {
    try {
      const data = localStorage.getItem(KEY);
      const cart = data ? JSON.parse(data) : [];
      return Array.isArray(cart) ? cart : [];
    } catch (e) {
      return [];
    }
  }

  function save(cart, broadcast = true) {
    try {
      localStorage.setItem(KEY, JSON.stringify(cart));
    } catch (e) {
      alert('Your browser is blocking site storage. Please open the GitHub Pages URL directly or allow storage for this site.');
      return;
    }

    if (broadcast && channel) {
      try { channel.postMessage({ type: 'cart-updated' }); } catch (e) {}
    }

    badge();
    render();
  }

  function money(n) {
    return '₹' + Number(n || 0).toLocaleString('en-IN');
  }

  function add(id, name, weight, price) {
    const cart = get();
    const key = id + '|' + weight;
    const existing = cart.find(item => item.key === key);

    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        key,
        id: String(id),
        name: String(name),
        weight: String(weight),
        price: Number(price),
        qty: 1
      });
    }

    save(cart);
    toast(name + ' (' + weight + ') added to cart');
  }

  function qty(key, delta) {
    const cart = get();
    const item = cart.find(i => i.key === key);
    if (!item) return;

    item.qty += Number(delta);
    const updated = cart.filter(i => i.qty > 0);
    save(updated);
  }

  function remove(key) {
    save(get().filter(i => i.key !== key));
  }

  function clearCart() {
    save([]);
  }

  function totals() {
    const cart = get();
    const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty)), 0);
    const delivery = subtotal === 0 || subtotal >= 499 ? 0 : 60;
    return { subtotal, delivery, total: subtotal + delivery };
  }

  function badge() {
    const count = get().reduce((sum, item) => sum + Number(item.qty || 0), 0);
    document.querySelectorAll('[data-count]').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'inline-flex' : 'none';
    });
  }

  function esc(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[char]));
  }

  function render() {
    const box = document.getElementById('items');
    const empty = document.getElementById('empty');
    const summary = document.getElementById('summary');
    if (!box) return;

    const cart = get();

    if (!cart.length) {
      box.innerHTML = '';
      if (empty) empty.style.display = 'block';
      if (summary) summary.style.display = 'none';
      return;
    }

    if (empty) empty.style.display = 'none';
    if (summary) summary.style.display = 'block';

    box.innerHTML = cart.map(item => `
      <div class="item">
        <div>
          <div class="name">${esc(item.name)}</div>
          <div class="meta">${esc(item.weight)} · ${money(item.price)}</div>
        </div>
        <div class="controls">
          <button type="button" aria-label="Decrease quantity" onclick="BholiCart.qty('${esc(item.key)}', -1)">−</button>
          <span>${Number(item.qty)}</span>
          <button type="button" aria-label="Increase quantity" onclick="BholiCart.qty('${esc(item.key)}', 1)">+</button>
        </div>
        <div class="item-total">${money(item.price * item.qty)}</div>
        <button type="button" class="remove" onclick="BholiCart.remove('${esc(item.key)}')">Remove</button>
      </div>
    `).join('');

    const t = totals();
    const subtotal = document.getElementById('subtotal');
    const delivery = document.getElementById('delivery');
    const total = document.getElementById('total');
    const note = document.getElementById('note');

    if (subtotal) subtotal.textContent = money(t.subtotal);
    if (delivery) delivery.textContent = t.delivery ? money(t.delivery) : (t.subtotal ? 'FREE' : '₹0');
    if (total) total.textContent = money(t.total);
    if (note) {
      note.textContent = t.subtotal >= 499
        ? '🎉 You qualify for FREE delivery!'
        : 'Add ' + money(499 - t.subtotal) + ' more for FREE delivery.';
    }
  }

  function toast(message) {
    let el = document.getElementById('bholiToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'bholiToast';
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('show'), 1800);
  }

  function checkout(event) {
    event.preventDefault();

    const cart = get();
    if (!cart.length) {
      alert('Your cart is empty.');
      return;
    }

    const form = new FormData(event.target);
    const customer = {
      name: String(form.get('name') || '').trim(),
      mobile: String(form.get('mobile') || '').trim(),
      address: String(form.get('address') || '').trim(),
      pincode: String(form.get('pincode') || '').trim()
    };

    if (!customer.name || !customer.mobile || !customer.address || !customer.pincode) {
      alert('Please fill all customer details.');
      return;
    }

    const t = totals();
    let message = '*Bholi Spices - New Order*\n\n';
    message += '*Customer Details*\n';
    message += 'Name: ' + customer.name + '\n';
    message += 'Mobile: ' + customer.mobile + '\n';
    message += 'Address: ' + customer.address + '\n';
    message += 'Pincode: ' + customer.pincode + '\n\n';
    message += '*Order Details*\n';

    cart.forEach((item, index) => {
      message += (index + 1) + '. ' + item.name + ' - ' + item.weight + ' x ' + item.qty + ' = ' + money(item.price * item.qty) + '\n';
    });

    message += '\nSubtotal: ' + money(t.subtotal) + '\n';
    message += 'Delivery: ' + (t.delivery ? money(t.delivery) : 'FREE') + '\n';
    message += '*Total: ' + money(t.total) + '*\n';
    message += 'Payment: To be confirmed on WhatsApp.';

    const url = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(message);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  // IMPORTANT: expose the API globally so product-page onclick handlers work.
  window.BholiCart = {
    get,
    add,
    qty,
    remove,
    clearCart,
    totals,
    render,
    badge,
    checkout
  };

  if (channel) {
    channel.addEventListener('message', event => {
      if (event.data && event.data.type === 'cart-updated') {
        badge();
        render();
      }
    });
  }

  window.addEventListener('storage', event => {
    if (event.key === KEY) {
      badge();
      render();
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    badge();
    render();
    const form = document.getElementById('checkoutForm');
    if (form) form.addEventListener('submit', checkout);
  });
})();
