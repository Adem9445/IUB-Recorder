// chat-ui.js
// Manages the chat UI: rendering image bubbles and AI text, and controlling screen toggles

/**
 * Show the chat screen and hide the start screen.
 */
export function showChatScreen() {
  const btn = document.getElementById("start-recording");
  const container = document.getElementById("chat-container");
  if (btn) btn.hidden = true;
  if (container) container.hidden = false;
}

/**
 * Show the start screen and hide the chat screen.
 */
export function showStartScreen() {
  const btn = document.getElementById("start-recording");
  const container = document.getElementById("chat-container");
  if (btn) btn.hidden = false;
  if (container) container.hidden = true;
}

function extractPlainText(htmlString) {
  if (!htmlString) return "";
  const div = document.createElement("div");
  div.innerHTML = htmlString;
  return (div.textContent || div.innerText || "").trim();
}

/**
 * Clear all chat bubbles.
 */
export function clearChat() {
  const container = document.getElementById("chat-container");
  if (container) container.innerHTML = "";
}

/**
 * Add a chat bubble with an image and optional AI-generated text.
 * @param {string} imageSrc - Data URL or URL of the image.
 * @param {string} aiText - Text commentary from AI.
 */
export function addImageBubble(imageSrc, aiText = "") {
  const container = document.getElementById("chat-container");
  if (!container) return;
  container.hidden = false;

  // Determine step number based on existing bubbles
  const stepNumber = container.querySelectorAll(".chat-bubble").length + 1;
  const plainText = extractPlainText(aiText);
  const altText = plainText
    ? `Step ${stepNumber} screenshot. ${plainText}`
    : `Step ${stepNumber} screenshot.`;
  const safeAlt = altText.replace(/"/g, "&quot;");

  const bubble = document.createElement("div");
  bubble.className = "chat-bubble";
  bubble.style.animation = "fadeInUp 0.5s ease-in-out";
  bubble.innerHTML = `
    <div class="bubble-header">
      <div class="bubble-step"><strong>Step ${stepNumber}:</strong></div>
      <div class="bubble-controls">
        <button class="move-up" title="Move up">↑</button>
        <button class="move-down" title="Move down">↓</button>
        <button class="edit-text" title="Edit">✎</button>
        <button class="add-comment" title="Add comment">💬</button>
      </div>
    </div>
    <div class="bubble-content">
      <div class="bubble-image"><img src="${imageSrc}" alt="${safeAlt}" style="width:100px; height:auto;" /></div>
      <div class="bubble-text">${aiText}</div>
    </div>
    <div class="comment-container" style="display:none; margin-top:8px;">
      <textarea class="comment-input" rows="2" placeholder="Add comment..."></textarea>
      <button class="save-comment">Save</button>
    </div>
  `;
  container.appendChild(bubble);

  // Attach control handlers
  const moveUpBtn = bubble.querySelector(".move-up");
  moveUpBtn.addEventListener("click", () => moveBubbleUp(bubble));
  const moveDownBtn = bubble.querySelector(".move-down");
  moveDownBtn.addEventListener("click", () => moveBubbleDown(bubble));
  const editBtn = bubble.querySelector(".edit-text");
  editBtn.addEventListener("click", () => {
    const textDiv = bubble.querySelector(".bubble-text");
    const isEditing = textDiv.isContentEditable;
    if (isEditing) {
      // Save edit
      textDiv.contentEditable = false;
      editBtn.textContent = "✎";
    } else {
      // Enter edit mode
      textDiv.contentEditable = true;
      textDiv.focus();
      editBtn.textContent = "💾";
    }
  });
  const commentBtn = bubble.querySelector(".add-comment");
  commentBtn.addEventListener("click", () => {
    const cc = bubble.querySelector(".comment-container");
    cc.style.display = cc.style.display === "none" ? "block" : "none";
  });
  const saveCommentBtn = bubble.querySelector(".save-comment");
  saveCommentBtn.addEventListener("click", () => {
    const textarea = bubble.querySelector(".comment-input");
    const cc = bubble.querySelector(".comment-container");
    if (saveCommentBtn.textContent === "Save") {
      const text = textarea.value.trim();
      const display = document.createElement("div");
      display.className = "comment-display";
      display.textContent = text;
      textarea.replaceWith(display);
      saveCommentBtn.textContent = "Edit";
    } else {
      const display = bubble.querySelector(".comment-display");
      const prevText = display.textContent;
      const ta = document.createElement("textarea");
      ta.className = "comment-input";
      ta.rows = 2;
      ta.value = prevText;
      display.replaceWith(ta);
      saveCommentBtn.textContent = "Save";
    }
  });

  container.scrollTop = container.scrollHeight;
  return bubble;
}

// Helper functions for reordering
function moveBubbleUp(bubble) {
  const container = document.getElementById("chat-container");
  const prev = bubble.previousElementSibling;
  if (prev) {
    container.insertBefore(bubble, prev);
    updateStepNumbers();
  }
}

function moveBubbleDown(bubble) {
  const container = document.getElementById("chat-container");
  const next = bubble.nextElementSibling;
  if (next) {
    container.insertBefore(next, bubble);
    updateStepNumbers();
  }
}

function updateStepNumbers() {
  const container = document.getElementById("chat-container");
  container.querySelectorAll(".chat-bubble").forEach((b, idx) => {
    const strong = b.querySelector(".bubble-step strong");
    if (strong) strong.textContent = `Step ${idx + 1}:`;
  });
}
