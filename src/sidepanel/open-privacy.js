// open-privacy.js
// Opens the local privacy policy page in a new tab (NO or EN)

const privacyBtn = document.getElementById('open-privacy');

function normalizeLang(raw) {
  const v = String(raw || '').toLowerCase();
  // Treat Norwegian Bokmål/Nynorsk as 'no'
  if (v.startsWith('no') || v.startsWith('nb') || v.startsWith('nn')) return 'no';
  // Only two supported: default everything else to English
  return 'en';
}

async function getLang() {
  try {
    const res = await chrome.storage.local.get(['lang']);
    if (res && res.lang) return normalizeLang(res.lang);
  } catch {}
  // Fallback to chrome.i18n or navigator
  try {
    if (chrome?.i18n?.getUILanguage) {
      return normalizeLang(chrome.i18n.getUILanguage());
    }
  } catch {}
  return normalizeLang(navigator.language);
}

async function openPrivacy() {
  const lang = await getLang();
  const file = lang === 'no' ? 'src/privacy/privacy.html' : 'src/privacy/privacy-en.html';
  const url = chrome.runtime.getURL(file);
  try {
    chrome.tabs.create({ url });
  } catch (e) {
    window.open(url, '_blank');
  }
}

if (privacyBtn) {
  privacyBtn.addEventListener('click', openPrivacy);
}
