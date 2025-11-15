// i18n.js
// Lightweight i18n for the sidepanel (EN / NO)

const I18N = {
  en: {
    menu: "Menu",
    settings: "Settings",
    options: "Options",
    language: "Language",
    english: "English",
    norwegian: "Norwegian",
    clickIndicator: "Show click indicator",
    openWorkspace: "Open Workspace",
    privacy: "Privacy policy",
    terms: "Terms of service",
    donate: "Donate to development",
    startRecording: "Start Recording",
    stopRecording: "Stop Recording",
    videoRecording: "Screen recording"
  },
  no: {
    menu: "Meny",
    settings: "Innstillinger",
    options: "Alternativer",
    language: "Språk",
    english: "Engelsk",
    norwegian: "Norsk",
    clickIndicator: "Vis klikk-indikator",
    openWorkspace: "Åpne Workspace",
    privacy: "Personvernerklæring",
    terms: "Vilkår for bruk",
    donate: "Doner til utvikling",
    startRecording: "Start opptak",
    stopRecording: "Stopp opptak",
    videoRecording: "Skjermopptak"
  }
};

let currentLang = "en";

async function loadLang() {
  try {
    const res = await chrome.storage.local.get(["lang"]);
    currentLang =
      res.lang ||
      (navigator.language?.toLowerCase().startsWith("no") ? "no" : "en");
  } catch (_) {
    currentLang = "en";
  }
}

function t(key) {
  return (I18N[currentLang] && I18N[currentLang][key]) || I18N.en[key] || key;
}

async function applyI18n() {
  await loadLang();
  // Button titles (tooltips)
  const map = [
    { sel: "#menu-btn", key: "menu" },
    { sel: "#toggle-click-indicator-btn", key: "clickIndicator" },
    { sel: "#open-workspace", key: "openWorkspace" },
    { sel: "#open-privacy", key: "privacy" },
    { sel: "#open-terms", key: "terms" },
    { sel: "#donate-btn", key: "donate" }
  ];
  map.forEach(({ sel, key }) => {
    const el = document.querySelector(sel);
    if (el) el.title = t(key);
  });
  // Buttons with visible labels
  const sr = document.getElementById("start-recording");
  if (sr) sr.innerHTML = `<span>🎬</span> ${t("startRecording")}`;
  const st = document.getElementById("stop-recording");
  if (st) st.innerHTML = `<span>⏹️</span> ${t("stopRecording")}`;
  // Expose helper
  window.__i18n__ = { setLang, getLang: () => currentLang, t };
}

async function setLang(lang) {
  currentLang = ["en", "no"].includes(lang) ? lang : "en";
  await chrome.storage.local.set({ lang: currentLang });
  applyI18n();
}

// Initial apply
applyI18n();
