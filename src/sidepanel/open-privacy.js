// open-privacy.js
// Opens the local privacy policy or terms page in a new tab (NO or EN)

const privacyBtn = document.getElementById("open-privacy");
const termsBtn = document.getElementById("open-terms");

const LEGAL_DOCS = {
  privacy: {
    en: "src/privacy/privacy-en.html",
    no: "src/privacy/privacy.html"
  },
  terms: { en: "src/privacy/terms-en.html", no: "src/privacy/terms.html" }
};

function normalizeLang(raw) {
  const v = String(raw || "").toLowerCase();
  // Treat Norwegian Bokmål/Nynorsk as 'no'
  if (v.startsWith("no") || v.startsWith("nb") || v.startsWith("nn"))
    return "no";
  // Only two supported: default everything else to English
  return "en";
}

async function getLang() {
  try {
    const res = await chrome.storage.local.get(["lang"]);
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

function resolveDoc(type, lang) {
  const doc = LEGAL_DOCS[type];
  if (!doc) return null;
  const normalized = lang === "no" ? "no" : "en";
  return doc[normalized] || doc.en;
}

async function openLegal(type) {
  const lang = await getLang();
  const file = resolveDoc(type, lang) || resolveDoc(type, "en");
  if (!file) return;
  const url = chrome.runtime.getURL(file);
  try {
    chrome.tabs.create({ url });
  } catch (e) {
    window.open(url, "_blank");
  }
}

if (privacyBtn) {
  privacyBtn.addEventListener("click", () => openLegal("privacy"));
}

if (termsBtn) {
  termsBtn.addEventListener("click", () => openLegal("terms"));
}

window.__iubOpenLegal = openLegal;
