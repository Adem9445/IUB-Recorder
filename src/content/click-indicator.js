// click-indicator.js
// Shows a visual circle indicator where the user clicks

(() => {
  // Prevent multiple instances
  if (window.__IUB_CLICK_INDICATOR_ACTIVE__) {
    return;
  }
  window.__IUB_CLICK_INDICATOR_ACTIVE__ = true;

  let isEnabled = true;

  // Create indicator element
  function createClickIndicator(x, y) {
    if (!isEnabled) return;

    const indicator = document.createElement("div");
    indicator.className = "iub-click-indicator";
    indicator.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      width: 20px;
      height: 20px;
      border: 3px solid #667eea;
      border-radius: 50%;
      pointer-events: none;
      z-index: 2147483647;
      transform: translate(-50%, -50%) scale(0);
      animation: iubClickPulse 0.6s ease-out;
      box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.7);
    `;

    document.body.appendChild(indicator);

    // Remove after animation
    setTimeout(() => {
      indicator.remove();
    }, 600);
  }

  // Add CSS animation
  if (!document.getElementById("iub-click-indicator-styles")) {
    const style = document.createElement("style");
    style.id = "iub-click-indicator-styles";
    style.textContent = `
      @keyframes iubClickPulse {
        0% {
          transform: translate(-50%, -50%) scale(0);
          opacity: 1;
        }
        50% {
          transform: translate(-50%, -50%) scale(1.2);
          opacity: 0.8;
        }
        100% {
          transform: translate(-50%, -50%) scale(1.8);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Click event listener
  function handleClick(e) {
    if (!isEnabled) return;
    
    // Get click coordinates
    const x = e.clientX;
    const y = e.clientY;
    
    createClickIndicator(x, y);
  }

  // Add click listener
  document.addEventListener("click", handleClick, true);

  // Listen for toggle messages
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "toggleClickIndicator") {
      isEnabled = msg.enabled;
      console.log("Click indicator:", isEnabled ? "enabled" : "disabled");
    }
  });

  // Load initial state
  chrome.storage.local.get(["showClickIndicator"], (result) => {
    isEnabled = result.showClickIndicator !== false; // Default to true
  });

  console.log("Click indicator initialized");
})();
