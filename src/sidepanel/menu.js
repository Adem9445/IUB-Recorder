// menu.js
// Unified menu for Info/Settings + language switch

import "./i18n.js";

const btn = document.getElementById("menu-btn");
const videoControlsSlot = document.getElementById("video-controls-slot");
const videoControls = document.getElementById("video-controls");

if (btn) btn.addEventListener("click", toggleMenu);

let pop;
let docClickHandler = null;

function toggleMenu() {
  if (pop) {
    closeMenu();
    return;
  }
  const t = (key) => (window.__i18n__?.t ? window.__i18n__.t(key) : key);
  pop = document.createElement("div");
  pop.className = "iub-menu-popover";
  pop.style.cssText = `
    position: absolute; top: 58px; right: 24px; z-index: 1000;
    background: #ffffff; border: 1px solid rgba(0,0,0,0.08);
    box-shadow: 0 8px 24px rgba(0,0,0,0.15); border-radius: 12px; padding: 10px;
    min-width: 220px; font-family: inherit;
  `;
  pop.innerHTML = `
    <div style="padding: 6px 8px; font-weight: 700; color: #334155;">⚙️ ${t("settings")}</div>
    <div style="padding: 6px 8px;">
      <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
        <input id=\"menu-click-toggle\" type=\"checkbox\" style=\"width:18px;height:18px;\">
        <span>${t("clickIndicator")}</span>
      </label>
    </div>
    <hr style="border:none;height:1px;background:#e5e7eb;margin:6px 0;"/>
    <div style="padding: 6px 8px; font-weight: 700; color: #334155;">🌐 ${t("language")}</div>
    <div style="display:flex; gap:8px; padding: 6px 8px;">
      <button id=\"lang-no\" style=\"flex:1; padding:6px 8px; border-radius:8px; border:1px solid #e5e7eb; cursor:pointer;\">NO</button>
      <button id=\"lang-en\" style=\"flex:1; padding:6px 8px; border-radius:8px; border:1px solid #e5e7eb; cursor:pointer;\">EN</button>
    </div>
    <div style="display:flex; gap:8px; padding: 6px 8px; flex-wrap:wrap;">
      <button id=\"open-options-menu\" style=\"flex:1; padding:6px 8px; border-radius:8px; border:1px solid #e5e7eb; cursor:pointer; min-width:0;\">${t("options")}</button>
      <button id=\"open-privacy-menu\" style=\"flex:1; padding:6px 8px; border-radius:8px; border:1px solid #e5e7eb; cursor:pointer; min-width:0;\">${t("privacy")}</button>
      <button id=\"open-terms-menu\" style=\"flex:1; padding:6px 8px; border-radius:8px; border:1px solid #e5e7eb; cursor:pointer;min-width:0;\">${t("terms")}</button>
    </div>
    <hr style="border:none;height:1px;background:#e5e7eb;margin:6px 0;"/>
    <div style="padding: 6px 8px; font-weight: 700; color: #334155;">🎥 ${t("videoRecording")}</div>
    <div id=\"menu-video-placeholder\" style=\"padding: 4px 0 0 0;\"></div>
  `;

  document.body.appendChild(pop);
  mountVideoControls();

  // Initialize checkbox from storage and wire to existing toggle
  const clickBox = pop.querySelector("#menu-click-toggle");
  if (clickBox) {
    chrome.storage.local.get(["showClickIndicator"], (res) => {
      clickBox.checked = res.showClickIndicator !== false;
    });
    clickBox.addEventListener("change", (e) => {
      try {
        const hidden = document.getElementById("show-click-indicator");
        if (hidden) {
          hidden.checked = e.target.checked;
          hidden.dispatchEvent(new Event("change", { bubbles: true }));
        } else {
          chrome.storage.local.set({ showClickIndicator: e.target.checked });
        }
      } catch (_) {
        chrome.storage.local.set({ showClickIndicator: e.target.checked });
      }
    });
  }

  // Language buttons
  pop
    .querySelector("#lang-no")
    ?.addEventListener("click", () => window.__i18n__.setLang("no"));
  pop
    .querySelector("#lang-en")
    ?.addEventListener("click", () => window.__i18n__.setLang("en"));

  // Options and privacy
  pop.querySelector("#open-options-menu")?.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
    closeMenu();
  });
  pop.querySelector("#open-privacy-menu")?.addEventListener("click", () => {
    window.__iubOpenLegal?.("privacy");
    closeMenu();
  });
  pop.querySelector("#open-terms-menu")?.addEventListener("click", () => {
    window.__iubOpenLegal?.("terms");
    closeMenu();
  });

  // Dismiss when clicking outside
  setTimeout(() => {
    docClickHandler = (e) => {
      if (!pop || pop.contains(e.target) || e.target === btn) return;
      closeMenu();
    };
    document.addEventListener("click", docClickHandler);
  }, 0);
}

function closeMenu() {
  if (!pop) return;
  restoreVideoControls();
  pop.remove();
  pop = null;
  if (docClickHandler) {
    document.removeEventListener("click", docClickHandler);
    docClickHandler = null;
  }
}

function mountVideoControls() {
  if (!videoControls || !pop) return;
  const placeholder = pop.querySelector("#menu-video-placeholder");
  if (!placeholder) return;
  placeholder.appendChild(videoControls);
  videoControls.hidden = false;
}

function restoreVideoControls() {
  if (!videoControls || !videoControlsSlot) return;
  if (videoControlsSlot.contains(videoControls)) return;
  videoControlsSlot.appendChild(videoControls);
  videoControls.hidden = true;
}
