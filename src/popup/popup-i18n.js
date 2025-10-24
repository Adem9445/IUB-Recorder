// popup-i18n.js
// Localizes popup labels based on stored language (EN/NO)

(async function(){
  const I18N = {
    en: {
      title: 'IUB',
      open_workspace: 'Open Workspace',
      open_editor: 'Open Editor',
      options: 'Options'
    },
    no: {
      title: 'IUB',
      open_workspace: 'Åpne Workspace',
      open_editor: 'Åpne Editor',
      options: 'Innstillinger'
    }
  };

  async function getLang() {
    try {
      const res = await chrome.storage.local.get(['lang']);
      if (res && res.lang) return res.lang;
    } catch {}
    return (navigator.language?.toLowerCase().startsWith('no') ? 'no' : 'en');
  }

  function apply(dict) {
    const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    setText('popup-title', dict.title);
    setText('btn-open-workspace', dict.open_workspace);
    setText('btn-open-editor', dict.open_editor);
    setText('btn-options', dict.options);
    document.documentElement.lang = (dict === I18N.no) ? 'no' : 'en';
  }

  async function run() {
    const lang = await getLang();
    const dict = I18N[lang] || I18N.en;
    apply(dict);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }

  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.lang) run();
    });
  } catch {}
})();
