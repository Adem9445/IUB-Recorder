// click-indicator-toggle.js
// Handles the click indicator toggle functionality

const toggleCheckbox = document.getElementById("show-click-indicator");
const iconBtn = document.getElementById("toggle-click-indicator-btn");

// Load saved setting
chrome.storage.local.get(["showClickIndicator"], (result) => {
  const enabled = result.showClickIndicator !== false; // Default to true
  toggleCheckbox.checked = enabled;
  updateClickIndicator(enabled);
  syncIcon(enabled);
});

// Listen for toggle changes
toggleCheckbox.addEventListener("change", (e) => {
  const enabled = e.target.checked;
  chrome.storage.local.set({ showClickIndicator: enabled });
  updateClickIndicator(enabled);
  syncIcon(enabled);
  
  // Show feedback
  showToast(enabled ? "Click indicator enabled ✅" : "Click indicator disabled ⭕");
});

// Icon button toggles the hidden checkbox
if (iconBtn) {
  iconBtn.addEventListener("click", () => {
    toggleCheckbox.checked = !toggleCheckbox.checked;
    // Trigger the change handler
    const evt = new Event('change', { bubbles: true });
    toggleCheckbox.dispatchEvent(evt);
  });
}

function syncIcon(enabled) {
  if (!iconBtn) return;
  iconBtn.setAttribute('aria-pressed', String(enabled));
  if (enabled) {
    iconBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    iconBtn.style.color = 'white';
  } else {
    iconBtn.style.background = '#f1f5f9';
    iconBtn.style.color = '#0f172a';
  }
}

async function updateClickIndicator(enabled) {
  try {
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || tab.url.startsWith("chrome://")) {
      return;
    }
    
    // Send message to content script to enable/disable click indicator
    chrome.tabs.sendMessage(tab.id, {
      action: "toggleClickIndicator",
      enabled: enabled
    }).catch(() => {
      // Content script might not be loaded yet, that's okay
    });
  } catch (err) {
    console.error("Failed to update click indicator:", err);
  }
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 24px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    animation: slideUp 0.3s ease-in-out;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = "slideDown 0.3s ease-in-out";
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}
