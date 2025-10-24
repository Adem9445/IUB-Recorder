// Shared utilities for IUB Rec extension

function getManifestVersion() {
  const manifest = chrome.runtime.getManifest();
  return manifest.version || "1.0";
}

function setVersionDisplay() {
  const versionEl = document.getElementById("version");
  if (versionEl) {
    versionEl.textContent = `Version ${getManifestVersion()}`;
  }
}

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
  setVersionDisplay();
});
