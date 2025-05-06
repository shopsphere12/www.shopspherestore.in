// cart.js

const cart = JSON.parse(localStorage.getItem('cart')) || [];

function updateCartCount() {
  document.getElementById("cartCount").textContent = cart.length;
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
}

function addToCart(product) {
  cart.push(product);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  renderCart();
  showToast(`${product} added to cart`);
}

function removeFromCart(index) {
  cart.splice(index, 1);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  renderCart();
}

function renderCart() {
  const cartItems = document.getElementById("cartItems");
  if (!cartItems) return;
  cartItems.innerHTML = '';
  cart.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `<span>${item}</span>
      <button class="remove-btn" onclick="removeFromCart(${index})">Remove</button>`;
    cartItems.appendChild(div);
  });
}

function toggleCart() {
  const popup = document.getElementById("cartPopup");
  popup.style.display = popup.style.display === "block" ? "none" : "block";
}

function filterProducts() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const cards = document.querySelectorAll('.product-card');
  cards.forEach(card => {
    const name = card.getAttribute('data-name').toLowerCase();
    card.classList.toggle('hidden', !name.includes(search));
  });
}

// Run on page load
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  renderCart();
});
