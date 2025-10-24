// sidebar_chat.js
// Handles chat window UI and message sending for sidebar_chat.html

document.addEventListener("DOMContentLoaded", () => {
  const chatWindow = document.getElementById("chat-window");
  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");

  // Append a message bubble to the chat window
  function appendMessage(text, sender = "user") {
    const msg = document.createElement("div");
    msg.classList.add("message", sender);
    msg.textContent = text;
    chatWindow.appendChild(msg);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  // Clear input and append user message
  function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    appendMessage(text, "user");
    input.value = "";

    // TODO: Replace with actual AI or background call
    setTimeout(() => {
      appendMessage("Echo: " + text, "bot");
    }, 500);
  }

  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });
});
