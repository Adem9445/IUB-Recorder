// api-key-check.js (compact icon UI)
// Reflect API key status on the info icon and provide a quick path to options

import {
  getProviderLabel,
  resolveActiveKey,
  sanitizeProvider
} from "../utils/ai-client.js";

const infoBtn = document.getElementById("ai-info-btn");

function computeState(result = {}) {
  const provider = sanitizeProvider(result.aiProvider);
  const { key } = resolveActiveKey({
    aiApiKeys: result.aiApiKeys,
    aiProvider: provider,
    legacyKey: result.apiKey
  });
  return {
    enabled: Boolean(key),
    provider,
    label: getProviderLabel(provider)
  };
}

function setInfoIconState({ enabled, label }) {
  if (!infoBtn) return;
  if (enabled) {
    infoBtn.title = `${label} is connected for AI features`;
    infoBtn.style.background = "#eafaf1";
    infoBtn.style.color = "#065f46";
    infoBtn.textContent = "✅";
  } else {
    infoBtn.title = `AI features are disabled. Click to add a ${label} API key`;
    infoBtn.style.background = "#fef2f2";
    infoBtn.style.color = "#991b1b";
    infoBtn.textContent = "ℹ️";
  }
}

function refreshState() {
  chrome.storage.local.get(["aiProvider", "aiApiKeys", "apiKey"], (result) => {
    setInfoIconState(computeState(result));
  });
}

refreshState();

// Info icon opens options and shows a small toast message
if (infoBtn) {
  infoBtn.addEventListener("click", () => {
    chrome.storage.local.get(["aiProvider", "aiApiKeys", "apiKey"], (result) => {
      const state = computeState(result);
      if (!state.enabled) showInfoToast(state.label);
      chrome.runtime.openOptionsPage();
    });
  });
}

function showInfoToast(label) {
  const providerLabel = label || "AI provider";
  const toast = document.createElement("div");
  toast.innerHTML = `
    <strong>AI features are not enabled</strong><br/>
    Add your ${providerLabel} API key to generate AI screenshot descriptions
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
  if (namespace === "local" && (changes.apiKey || changes.aiApiKeys || changes.aiProvider)) {
    refreshState();
  }
});
