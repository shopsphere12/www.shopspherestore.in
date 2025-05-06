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
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const countElem = document.getElementById("cartCount");
  if (countElem) countElem.textContent = cart.length;
}

function addToCart(product) {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  cart.push(product);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  showToast(`${product} added to cart`);
}

function removeFromCart(index) {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  cart.splice(index, 1);
  localStorage.setItem('cart', JSON.stringify(cart));
  renderCart();
  updateCartCount();
}

function renderCart() {
  const cartItems = document.getElementById("cartItems");
  if (!cartItems) return;
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  cartItems.innerHTML = '';
  cart.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `<span>${item}</span>
      <button class="remove-btn" onclick="removeFromCart(${index})">Remove</button>`;
    cartItems.appendChild(div);
  });
}
if (window.location.pathname.includes('cart.html')) {
  renderCart();
}
function getCartTotal() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const prices = {
    "Eco Bag": 1499,
    "Green Bottle": 999,
    "Reusable Cup": 1199
  };

  let total = 0;
  cart.forEach(item => {
    total += prices[item] || 0;
  });

  return total;
}

function checkout() {
  const amount = getCartTotal();
  if (amount === 0) {
    alert("Your cart is empty.");
    return;
  }

  const options = {
    key: "YOUR_RAZORPAY_KEY_ID", // replace with your Razorpay key
    amount: amount * 100, // Amount in paise (₹1 = 100 paise)
    currency: "INR",
    name: "ShopSphere",
    description: "Thank you for shopping!",
    handler: function (response) {
      alert("Payment Successful. Payment ID: " + response.razorpay_payment_id);
      localStorage.removeItem('cart');
      renderCart();
      updateCartCount();
    },
    theme: {
      color: "#28a745"
    }
  };

  const rzp = new Razorpay(options);
  rzp.open();
}
// Calculate price breakdown
function getCartTotal() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const prices = {
    "Eco Bag": 1499,
    "Green Bottle": 999,
    "Reusable Cup": 1199
  };

  let subtotal = 0;
  cart.forEach(item => {
    subtotal += prices[item] || 0;
  });

  const tax = 0.18 * subtotal;  // 18% Tax
  const deliveryCharge = 51;    // Delivery charge

  const total = subtotal + tax + deliveryCharge;
  
  return { subtotal, tax, deliveryCharge, total };
}

// Update the price breakdown in cart.html
function updatePriceBreakdown() {
  const { subtotal, tax, deliveryCharge, total } = getCartTotal();

  // Update the DOM with the breakdown
  document.getElementById("subtotal").innerHTML = `Subtotal: ₹${subtotal.toFixed(2)}`;
  document.getElementById("tax").innerHTML = `Tax (18%): ₹${tax.toFixed(2)}`;
  document.getElementById("deliveryCharge").innerHTML = `Delivery Charge: ₹${deliveryCharge}`;
  document.getElementById("totalAmount").innerHTML = `<strong>Total: ₹${total.toFixed(2)}</strong>`;
}

// Checkout function
function checkout() {
  const { subtotal, tax, deliveryCharge, total } = getCartTotal();
  
  if (total === 0) {
    alert("Your cart is empty.");
    return;
  }

  const options = {
    key: "YOUR_RAZORPAY_KEY_ID", // replace with your Razorpay key
    amount: total * 100, // Amount in paise (₹1 = 100 paise)
    currency: "INR",
    name: "ShopSphere",
    description: "Thank you for shopping!",
    handler: function (response) {
      alert("Payment Successful. Payment ID: " + response.razorpay_payment_id);
      localStorage.removeItem('cart');
      renderCart();
      updateCartCount();
      updatePriceBreakdown();
    },
    theme: {
      color: "#28a745"
    }
  };

  const rzp = new Razorpay(options);
  rzp.open();
}

// Run on page load
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  renderCart();
  updatePriceBreakdown();
});

