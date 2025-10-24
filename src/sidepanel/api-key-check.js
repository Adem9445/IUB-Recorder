// api-key-check.js (compact icon UI)
// Reflect API key status on the info icon and provide a quick path to options

const infoBtn = document.getElementById("ai-info-btn");

function setInfoIconState(enabled) {
  if (!infoBtn) return;
  if (enabled) {
    infoBtn.title = "AI-funksjoner er aktivert";
    infoBtn.style.background = "#eafaf1";
    infoBtn.style.color = "#065f46";
    infoBtn.textContent = "✅";
  } else {
    infoBtn.title = "AI-funksjoner er ikke aktivert. Klikk for å legge til API-nøkkel";
    infoBtn.style.background = "#fef2f2";
    infoBtn.style.color = "#991b1b";
    infoBtn.textContent = "ℹ️";
  }
}

// Check if API key is set
chrome.storage.local.get(["apiKey"], (result) => {
  const hasKey = !!(result.apiKey && result.apiKey.trim() !== "");
  setInfoIconState(hasKey);
});

// Info icon opens options and shows a small toast message
if (infoBtn) {
  infoBtn.addEventListener("click", () => {
    chrome.storage.local.get(["apiKey"], (result) => {
      const hasKey = !!(result.apiKey && result.apiKey.trim() !== "");
      if (!hasKey) showInfoToast();
      chrome.runtime.openOptionsPage();
    });
  });
}

function showInfoToast() {
  const toast = document.createElement("div");
  toast.innerHTML = `
    <strong>AI-funksjoner er ikke aktivert</strong><br/>
    Legg til OpenAI API-nøkkel for AI-beskrivelser av screenshots
  `;
  toast.style.cssText = `
    position: fixed; top: 14px; left: 50%; transform: translateX(-50%);
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white; padding: 10px 14px; border-radius: 10px;
    font-size: 12px; font-weight: 600; z-index: 10000;
    box-shadow: 0 6px 20px rgba(0,0,0,0.2); animation: fadeInUp 0.3s ease-in-out;
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = "fadeOut 0.3s ease-in-out";
    setTimeout(() => toast.remove(), 280);
  }, 2000);
}

// Listen for storage changes (if user adds API key in options page)
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local" && changes.apiKey) {
    const hasKey = changes.apiKey.newValue && changes.apiKey.newValue.trim() !== "";
    setInfoIconState(!!hasKey);
  }
});
