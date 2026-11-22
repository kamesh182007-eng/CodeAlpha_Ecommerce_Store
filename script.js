const BASE_URL = 'http://127.0.0.1:8000/api';
const API_URL = BASE_URL + '/products/';

let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let token = localStorage.getItem('token');
let currentUser = localStorage.getItem('username');

/* ---------- PRODUCTS ---------- */

async function loadProducts() {
  const list = document.getElementById('product-list');
  try {
    const response = await fetch(API_URL);
    products = await response.json();

    list.innerHTML = '';
    products.forEach(function (p) {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML =
        (p.image_url ? '<img src="' + p.image_url + '" alt="' + p.name + '" width="200">' : '') +
        '<h3>' + p.name + '</h3>' +
        '<p>' + p.description + '</p>' +
        '<p><strong>₹' + p.price + '</strong></p>' +
        '<p><a href="product.html?id=' + p.id + '">View Details</a></p>' +
        '<button onclick="addToCart(' + p.id + ')">Add to Cart</button>';
      list.appendChild(card);
    });
  } catch (error) {
    list.innerHTML = '<p>Could not load products. Is the server running?</p>';
  }
}

/* ---------- CART ---------- */

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function addToCart(id) {
  const product = products.find(function (p) { return p.id === id; });
  const item = cart.find(function (i) { return i.id === id; });

  if (item) {
    item.qty += 1;
  } else {
    cart.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
  }
  saveCart();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter(function (i) { return i.id !== id; });
  saveCart();
  renderCart();
}

function renderCart() {
  const box = document.getElementById('cart-items');
  const totalBox = document.getElementById('cart-total');

  if (cart.length === 0) {
    box.innerHTML = '<p>Your cart is empty.</p>';
    totalBox.innerHTML = '';
    return;
  }

  let html = '';
  let total = 0;
  cart.forEach(function (i) {
    total += i.price * i.qty;
    html += '<p>' + i.name + ' × ' + i.qty + ' = ₹' + (i.price * i.qty) +
            ' <button onclick="removeFromCart(' + i.id + ')">Remove</button></p>';
  });

  box.innerHTML = html;
  totalBox.innerHTML = '<strong>Total: ₹' + total + '</strong>';
}

/* ---------- USER REGISTER / LOGIN ---------- */

function setMessage(text) {
  document.getElementById('auth-message').textContent = text;
}

async function registerUser() {
  const body = {
    username: document.getElementById('reg-username').value,
    email: document.getElementById('reg-email').value,
    password: document.getElementById('reg-password').value
  };

  try {
    const response = await fetch(BASE_URL + '/register/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    setMessage(response.ok ? 'Registered! Now log in below.' : data.error);
  } catch (error) {
    setMessage('Could not reach the server. Is it running?');
  }
}

async function loginUser() {
  const body = {
    username: document.getElementById('login-username').value,
    password: document.getElementById('login-password').value
  };

  try {
    const response = await fetch(BASE_URL + '/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await response.json();

    if (response.ok) {
      token = data.token;
      currentUser = data.username;
      localStorage.setItem('token', token);
      localStorage.setItem('username', currentUser);
      setMessage('');
      updateAuthUI();
    } else {
      setMessage(data.error);
    }
  } catch (error) {
    setMessage('Could not reach the server. Is it running?');
  }
}

function logoutUser() {
  token = null;
  currentUser = null;
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  updateAuthUI();
}

function updateAuthUI() {
  const forms = document.getElementById('auth-forms');
  const info = document.getElementById('user-info');

  if (token && currentUser) {
    forms.style.display = 'none';
    info.style.display = 'block';
    document.getElementById('user-name').textContent = currentUser;
  } else {
    forms.style.display = 'block';
    info.style.display = 'none';
  }
}

/* ---------- CHECKOUT ---------- */

async function checkout() {
  const msg = document.getElementById('order-message');

  if (!token) {
    msg.textContent = 'Please log in first (see the Account section).';
    return;
  }
  if (cart.length === 0) {
    msg.textContent = 'Your cart is empty.';
    return;
  }

  try {
    const response = await fetch(BASE_URL + '/checkout/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ items: cart })
    });
    const data = await response.json();

    if (response.ok) {
      cart = [];
      saveCart();
      renderCart();
      msg.textContent = 'Order #' + data.order_id + ' placed! Total: ₹' + data.total;
    } else {
      msg.textContent = data.error;
      if (response.status === 401) {
        logoutUser();
      }
    }
  } catch (error) {
    msg.textContent = 'Could not reach the server. Is it running?';
  }
}

/* ---------- START ---------- */

loadProducts();
renderCart();
updateAuthUI();