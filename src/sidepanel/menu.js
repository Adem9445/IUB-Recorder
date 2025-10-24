// menu.js
// Unified menu for Info/Settings + language switch

import './i18n.js';

const btn = document.getElementById('menu-btn');
if (btn) btn.addEventListener('click', toggleMenu);

let pop;
function toggleMenu() {
  if (pop) { pop.remove(); pop = null; return; }
  pop = document.createElement('div');
  pop.className = 'iub-menu-popover';
  pop.style.cssText = `
    position: absolute; top: 58px; right: 24px; z-index: 1000;
    background: #ffffff; border: 1px solid rgba(0,0,0,0.08);
    box-shadow: 0 8px 24px rgba(0,0,0,0.15); border-radius: 12px; padding: 10px;
    min-width: 220px; font-family: inherit;
  `;
  pop.innerHTML = `
    <div style="padding: 6px 8px; font-weight: 700; color: #334155;">⚙️ ${window.__i18n__.t('settings')}</div>
    <div style="padding: 6px 8px;">
      <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
        <input id="menu-click-toggle" type="checkbox" style="width:18px;height:18px;">
        <span>${window.__i18n__.t('clickIndicator')}</span>
      </label>
    </div>
    <hr style="border:none;height:1px;background:#e5e7eb;margin:6px 0;"/>
    <div style="padding: 6px 8px; font-weight: 700; color: #334155;">🌐 ${window.__i18n__.t('language')}</div>
    <div style="display:flex; gap:8px; padding: 6px 8px;">
      <button id="lang-no" style="flex:1; padding:6px 8px; border-radius:8px; border:1px solid #e5e7eb; cursor:pointer;">NO</button>
      <button id="lang-en" style="flex:1; padding:6px 8px; border-radius:8px; border:1px solid #e5e7eb; cursor:pointer;">EN</button>
    </div>
    <div style="display:flex; gap:8px; padding: 6px 8px;">
      <button id="open-options-menu" style="flex:1; padding:6px 8px; border-radius:8px; border:1px solid #e5e7eb; cursor:pointer;">Options</button>
      <button id="open-privacy-menu" style="flex:1; padding:6px 8px; border-radius:8px; border:1px solid #e5e7eb; cursor:pointer;">Privacy</button>
    </div>
  `;

  document.body.appendChild(pop);

  // Initialize checkbox from storage and wire to existing toggle
  const clickBox = pop.querySelector('#menu-click-toggle');
  chrome.storage.local.get(['showClickIndicator'], (res) => {
    clickBox.checked = res.showClickIndicator !== false;
  });
  clickBox.addEventListener('change', (e) => {
    try {
      const hidden = document.getElementById('show-click-indicator');
      if (hidden) {
        hidden.checked = e.target.checked;
        hidden.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        chrome.storage.local.set({ showClickIndicator: e.target.checked });
      }
    } catch (_) {
      chrome.storage.local.set({ showClickIndicator: e.target.checked });
    }
  });

  // Language buttons
  pop.querySelector('#lang-no').addEventListener('click', () => window.__i18n__.setLang('no'));
  pop.querySelector('#lang-en').addEventListener('click', () => window.__i18n__.setLang('en'));

  // Options and privacy
  pop.querySelector('#open-options-menu').addEventListener('click', () => chrome.runtime.openOptionsPage());
  pop.querySelector('#open-privacy-menu').addEventListener('click', () => {
    const url = chrome.runtime.getURL('src/privacy/privacy.html');
    chrome.tabs.create({ url });
  });

  // Dismiss when clicking outside
  setTimeout(() => {
    const onDocClick = (e) => {
      if (!pop || pop.contains(e.target) || e.target === btn) return;
      pop.remove(); pop = null; document.removeEventListener('click', onDocClick);
    };
    document.addEventListener('click', onDocClick);
  }, 0);
}
