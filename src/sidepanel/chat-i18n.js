// chat-i18n.js
// Localize sidebar chat input placeholder and send button (EN/NO)

(async function(){
  const I18N = {
    en: {
      placeholder: 'Type a message...',
      send: 'Send'
    },
    no: {
      placeholder: 'Skriv en melding...',
      send: 'Send'
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
    const input = document.getElementById('chat-input');
    const send = document.getElementById('send-btn');
    if (input) input.placeholder = dict.placeholder;
    if (send) send.textContent = dict.send;
    document.documentElement.lang = (dict === I18N.no) ? 'no' : 'en';
  }

  async function run() {
    const lang = await getLang();
    apply(I18N[lang] || I18N.en);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();

  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.lang) run();
    });
  } catch {}
})();
