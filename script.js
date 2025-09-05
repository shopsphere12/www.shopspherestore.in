let userName = "";

function joinChat() {
  userName = document.getElementById("nameInput").value.trim();
  if (!userName) return alert("Enter your name");

  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("chat-screen").classList.remove("hidden");
  document.getElementById("userName").innerText = "You are: " + userName;

  loadMessages();
}

function leaveChat() {
  location.reload();
}

function sendMessage() {
  const input = document.getElementById("messageInput");
  const text = input.value.trim();
  if (!text) return;

  const messages = JSON.parse(localStorage.getItem("messages") || "[]");
  messages.push({ name: userName, text: text, time: new Date().toLocaleTimeString() });
  localStorage.setItem("messages", JSON.stringify(messages));

  input.value = "";
  loadMessages();
}

function loadMessages() {
  const messagesDiv = document.getElementById("messages");
  const messages = JSON.parse(localStorage.getItem("messages") || "[]");

  messagesDiv.innerHTML = "";
  messages.forEach(msg => {
    const div = document.createElement("div");
    div.className = "message";
    div.innerHTML = `<strong>${msg.name}:</strong> ${msg.text} <span style="font-size:10px;color:gray">(${msg.time})</span>`;
    messagesDiv.appendChild(div);
  });

  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Keep chat synced across multiple tabs
window.addEventListener("storage", loadMessages);
