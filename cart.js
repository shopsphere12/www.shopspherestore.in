document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  renderCart();
  updatePriceBreakdown();
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
  updatePriceBreakdown();
}

function renderCart() {
  const cartItems = document.getElementById("cartItems");
  if (!cartItems) return;

  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const prices = {
    "Fresh Spinach": 50,
    "Brown Rice": 80,
    "Organic Strawberry": 120
  };

  cartItems.innerHTML = '';
  cart.forEach((item, index) => {
    const price = prices[item] || 0;
    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <span>${item} - ₹${price}</span>
      <button class="remove-btn" onclick="removeFromCart(${index})">Remove</button>`;
    cartItems.appendChild(div);
  });
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
}

function filterProducts() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const cards = document.querySelectorAll('.product-card');
  cards.forEach(card => {
    const name = card.getAttribute('data-name').toLowerCase();
    card.classList.toggle('hidden', !name.includes(search));
  });
}

function getCartTotal() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const prices = {
     "Fresh Spinach": 50,
    "Brown Rice": 80,
    "Organic Strawberry": 120
  };


  let subtotal = 0;
  cart.forEach(item => {
    subtotal += prices[item] || 0;
  });

  const tax = subtotal * 0.18;
  const deliveryCharge = 51;
  const total = subtotal + tax + deliveryCharge;

  return { subtotal, tax, deliveryCharge, total };
}

function updatePriceBreakdown() {
  const { subtotal, tax, deliveryCharge, total } = getCartTotal();
  if (document.getElementById("subtotal")) {
    document.getElementById("subtotal").innerHTML = `Subtotal: ₹${subtotal.toFixed(2)}`;
    document.getElementById("tax").innerHTML = `Tax (18%): ₹${tax.toFixed(2)}`;
    document.getElementById("deliveryCharge").innerHTML = `Delivery Charge: ₹${deliveryCharge}`;
    document.getElementById("totalAmount").innerHTML = `<strong>Total: ₹${total.toFixed(2)}</strong>`;
  }
}

function checkout() {
  const { total } = getCartTotal();
  if (total === 0) {
    alert("Your cart is empty.");
    return;
  }

  const options = {
    key: "rzp_test_1DP5mmOlF5G5ag", // Razorpay test key
    amount: total * 100,
    currency: "INR",
    name: "earthorganics.com",
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
