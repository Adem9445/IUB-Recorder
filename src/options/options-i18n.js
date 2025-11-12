// options-i18n.js
// Minimal options page i18n for EN/NO

(async function(){
  const I18N = {
    en: {
      btn_open_sidebar: '📂 Open Sidebar',
      btn_open_workspace: '🏢 Open Workspace',
      btn_open_editor: '✏️ Open Editor',
      title_options: 'Options',
      btn_save: 'Apply Changes',
      btn_reset: 'Reset',
      saved: 'Saved',
      sec_sidepanel: 'Side panel basics',
      sec_export: 'AI chat PDF export (advanced)',
      sec_cloud: 'Cloud sync (optional)',
      api_key_label: 'OpenAI API key:',
      api_key_hint: 'Required for AI-powered side panel captions. Get your key from',
      api_key_saved: 'Saved locally – AI descriptions enabled.',
      api_key_missing: 'Missing – enter your key to enable AI features.',
      capture_mode: 'Capture mode:',
      capture_full: 'Full screen',
      capture_click: 'Area around click',
      theme: 'Color theme:',
      theme_auto: 'Auto',
      theme_light: 'Light',
      theme_dark: 'Dark',
      exclude_user: 'Exclude user inputs:',
      exclude_icons: 'Exclude icons:',
      font_size: 'Font size (30-300%):',
      margins: 'Page margins:',
      margin_default: 'Default',
      margin_minimal: 'Minimal',
      margin_custom: 'Custom',
      m_top: 'Top margin:',
      m_bottom: 'Bottom margin:',
      m_left: 'Left margin:',
      m_right: 'Right margin:',
      pdf_title: 'PDF Title:',
      title_capture: 'Capture title',
      title_ask: 'Ask',
      title_none: 'None',
      user_bg: 'User input background color:',
      choose_color: 'Choose color:',
      user_fg: 'User input text color:',
      page_break: 'Page breaks:',
      page_break_after: 'After each capture',
      toc_label: 'Table of contents:',
      toc_none: 'None',
      toc_basic: 'Standard',
      toc_numbering: 'Numbered',
      toc_note: '(The table of contents will be generated from capture titles)',
      model_info: 'Include AI model info:'
      ,
      // Info cards
      card_storage_title: '💾 Storage Usage',
      card_storage_used: 'Used:',
      card_storage_free: 'Free:',
      card_storage_delete: '🗑️ Delete All Sessions',
      card_ai_title: '🤖 AI Features',
      card_ai_status: 'Status:',
      card_ai_checking: 'Checking...',
      card_ai_hint: 'Add your OpenAI API key below to unlock automatic screenshot descriptions',
      card_click_title: '🎯 Click indicator',
      card_click_desc: 'Show a red ripple where you clicked on each capture',
      card_click_toggle: 'Enable click indicator'
    },
    no: {
      btn_open_sidebar: '📂 Åpne Sidebar',
      btn_open_workspace: '🏢 Åpne Workspace',
      btn_open_editor: '✏️ Åpne Editor',
      title_options: 'Innstillinger',
      btn_save: 'Lagre endringer',
      btn_reset: 'Tilbakestill',
      saved: 'Lagret',
      sec_sidepanel: 'Grunnleggende innstillinger',
      sec_export: 'AI Chat PDF-eksport (avansert)',
      sec_cloud: 'Sky-synk (valgfritt)',
      api_key_label: 'OpenAI API-nøkkel:',
      api_key_hint: 'Påkrevd for AI-beskrivelser i sidepanelet. Hent nøkkel fra',
      api_key_saved: 'Lagret lokalt – AI-beskrivelser er aktivert.',
      api_key_missing: 'Mangler – legg inn nøkkelen for å aktivere AI-funksjoner.',
      capture_mode: 'Opptaksmodus:',
      capture_full: 'Fullskjerm',
      capture_click: 'Område rundt klikk',
      theme: 'Fargetema:',
      theme_auto: 'Auto',
      theme_light: 'Lys',
      theme_dark: 'Mørk',
      exclude_user: 'Utelat bruker-innspill:',
      exclude_icons: 'Utelat ikoner:',
      font_size: 'Skriftstørrelse (30-300%):',
      margins: 'Sidekanter:',
      margin_default: 'Standard',
      margin_minimal: 'Minimal',
      margin_custom: 'Egendefinert',
      m_top: 'Toppmargin:',
      m_bottom: 'Bunnmargin:',
      m_left: 'Venstremargin:',
      m_right: 'Høyremargin:',
      pdf_title: 'PDF-tittel:',
      title_capture: 'Skjermbildetittel',
      title_ask: 'Spør',
      title_none: 'Ingen',
      user_bg: 'Bakgrunnsfarge (bruker):',
      choose_color: 'Velg farge:',
      user_fg: 'Tekstfarge (bruker):',
      page_break: 'Sideskift:',
      page_break_after: 'Etter hvert skjermbilde',
      toc_label: 'Innholdsfortegnelse:',
      toc_none: 'Ingen',
      toc_basic: 'Standard',
      toc_numbering: 'Nummerert',
      toc_note: '(Innholdsfortegnelsen genereres fra skjermbildetitler)',
      model_info: 'Inkluder AI-modellinfo:'
      ,
      // Info cards
      card_storage_title: '💾 Storage Bruk',
      card_storage_used: 'Brukt:',
      card_storage_free: 'Ledig:',
      card_storage_delete: '🗑️ Slett Alle Sessions',
      card_ai_title: '🤖 AI-Funksjoner',
      card_ai_status: 'Status:',
      card_ai_checking: 'Sjekker...',
      card_ai_hint: 'Legg inn API-nøkkelen under for automatiske beskrivelser',
      card_click_title: '🎯 Klikk-indikator',
      card_click_desc: 'Vis rød puls der du klikker i hvert skjermbilde',
      card_click_toggle: 'Aktiver klikk-indikator'
    }
  };

  async function getLang() {
    try {
      const res = await chrome.storage.local.get(['lang']);
      if (res && res.lang) return res.lang;
    } catch {}
    return (navigator.language?.toLowerCase().startsWith('no') ? 'no' : 'en');
  }

  function setText(id, txt) { const el = document.getElementById(id); if (el) el.textContent = txt; }

  function apply(dict) {
    document.documentElement.lang = (dict === I18N.no) ? 'no' : 'en';
    setText('open-sidebar', dict.btn_open_sidebar);
    setText('open-workspace', dict.btn_open_workspace);
    setText('open-editor', dict.btn_open_editor);
    setText('options-title', dict.title_options);
    setText('save', dict.btn_save);
    setText('reset', dict.btn_reset);
    const status = document.getElementById('status');
    if (status && status.textContent.trim()) status.textContent = dict.saved;

    // Section titles
    setText('sidepanel-group-title', dict.sec_sidepanel);
    setText('export-group-title', dict.sec_export);
    setText('cloud-group-title', dict.sec_cloud);
    const keyStatus = document.getElementById('api-key-status');
    if (keyStatus) {
      const state = keyStatus.dataset.state || 'missing';
      keyStatus.textContent = state === 'saved'
        ? dict.api_key_saved
        : dict.api_key_missing;
    }

    // Labels by for= attribute
    const setLabel = (forId, text) => { const el = document.querySelector(`label[for="${forId}"]`); if (el && text) el.textContent = text; };
    setLabel('api_key', dict.api_key_label);
    setLabel('capture_mode', dict.capture_mode);
    setLabel('theme', dict.theme);
    setLabel('no_questions', dict.exclude_user);
    setLabel('no_icons', dict.exclude_icons);
    setLabel('zoom', dict.font_size);
    setLabel('margins', dict.margins);
    setLabel('margin_top', dict.m_top);
    setLabel('margin_bottom', dict.m_bottom);
    setLabel('margin_left', dict.m_left);
    setLabel('margin_right', dict.m_right);
    setLabel('title_mode', dict.pdf_title);
    setLabel('q_color', dict.user_bg);
    setLabel('q_color_picker', dict.choose_color);
    setLabel('q_fg_color', dict.user_fg);
    setLabel('q_fg_color_picker', dict.choose_color);
    setLabel('page_break', dict.page_break);
    setLabel('toc', dict.toc_label);
    setLabel('model_name', dict.model_info);

    // API hint
    const hint = document.querySelector('#api_key')?.parentElement?.querySelector('small');
    if (hint) {
      const link = hint.querySelector('a');
      hint.firstChild && (hint.firstChild.textContent = `${dict.api_key_hint} `);
      if (link) link.textContent = 'OpenAI';
    }

    // Select and option texts by value
    const setOption = (selectId, value, text) => {
      const opt = document.querySelector(`#${selectId} option[value="${value}"]`);
      if (opt && text) opt.textContent = text;
    };
    setOption('capture_mode', 'full', dict.capture_full);
    setOption('capture_mode', 'click', dict.capture_click);
    setOption('theme', '', dict.theme_auto);
    setOption('theme', 'light', dict.theme_light);
    setOption('theme', 'dark', dict.theme_dark);
    setOption('margins', '', dict.margin_default);
    setOption('margins', 'minimal', dict.margin_minimal);
    setOption('margins', 'custom', dict.margin_custom);
    setOption('title_mode', '', dict.title_capture);
    setOption('title_mode', 'ask', dict.title_ask);
    setOption('title_mode', 'none', dict.title_none);
    setOption('toc', '', dict.toc_none);
    setOption('toc', 'basic', dict.toc_basic);
    setOption('toc', 'numbered', dict.toc_numbering);
    setOption('page_break', 'after_each', dict.page_break_after);

    // TOC note
    const tocNote = document.querySelector('.toc-note');
    if (tocNote) tocNote.textContent = dict.toc_note;

    // --- Top Info Cards ---
    // Storage card
    const storageInfo = document.getElementById('storage-info');
    if (storageInfo) {
      const titleEl = storageInfo.previousElementSibling;
      if (titleEl && titleEl.tagName === 'H3') titleEl.textContent = dict.card_storage_title;
      const strongs = storageInfo.querySelectorAll('strong');
      if (strongs[0]) strongs[0].textContent = dict.card_storage_used;
      if (strongs[1]) strongs[1].textContent = dict.card_storage_free;
      const delBtn = document.getElementById('delete-all-sessions-btn');
      if (delBtn) delBtn.textContent = dict.card_storage_delete;
    }

    // AI features card
    const aiCard = document.getElementById('ai-status-card');
    if (aiCard) {
      const aiTitle = aiCard.querySelector('h3');
      if (aiTitle) aiTitle.textContent = dict.card_ai_title;
      const aiStatus = aiCard.querySelector('#ai-status');
      if (aiStatus) {
        const label = aiStatus.querySelector('strong');
        if (label) label.textContent = dict.card_ai_status;
        const checking = aiStatus.querySelector('#ai-status-text');
        if (checking && (checking.textContent.trim().length === 0 || checking.textContent.includes('Sjekker') || checking.textContent.includes('Checking'))) {
          checking.textContent = dict.card_ai_checking;
        }
        const hint = aiStatus.querySelector('.card-hint');
        if (hint) hint.textContent = dict.card_ai_hint;
      }
    }

    // Click indicator card
    const clickLabel = document.querySelector('#show-click-indicator-option')?.closest('label');
    if (clickLabel) {
      const span = clickLabel.querySelector('span');
      if (span) span.textContent = dict.card_click_toggle;
      const card = clickLabel.closest('.status-card');
      if (card) {
        const title = card.querySelector('h3');
        if (title) title.textContent = dict.card_click_title;
        const desc = card.querySelector('.card-hint');
        if (desc) desc.textContent = dict.card_click_desc;
      }
    }
  }

  async function run() {
    const lang = await getLang();
    const dict = I18N[lang] || I18N.en;
    apply(dict);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();

  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.lang) run();
    });
  } catch {}
})();
