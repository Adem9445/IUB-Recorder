// editor-i18n.js
// Lightweight i18n for the standalone editor page (EN / NO)

(function(){
  const I18N = {
    en: {
      editor_title: '📝 IUB Workspace',
      shortcuts_help: 'Keyboard Shortcuts (?)',
      btn_new_session: '➕ New Session',
      btn_delete_all: '🗑️ Delete All',
      btn_export_pdf: '📥 Export PDF',
      export_section: '📤 Export',
      export_btn_pdf: '📄 PDF',
      export_btn_md: '📝 Markdown',
      export_btn_json: '📊 JSON',
      step_word: 'Step',
      exported_label: 'Exported',
      saved_sessions_title: '📊 Saved Sessions',
      sidebar_instruction: 'Click a session to view screenshots',
      empty_title: 'Choose a Session',
      empty_desc: 'Click a session in the list on the left to view screenshots',
      empty_hint: 'Or start a new recording from the side panel »',
      shortcuts_title: '⌨️ Shortcuts',
      section_global: 'Global',
      section_per_step: 'Per step (last focused)',
      section_crop: 'In crop mode',
      shortcuts_list: {
        global: [
          ['?', 'Open this overview'],
          ['Cmd/Ctrl + E', 'Export PDF'],
          ['Cmd/Ctrl + M', 'Export Markdown'],
          ['Cmd/Ctrl + J', 'Export JSON'],
          ['Cmd/Ctrl + N', 'New session']
        ],
        step: [
          ['C', 'Crop image'],
          ['U', 'Undo last image change'],
          ['Alt + ↑/↓', 'Move step up/down'],
          ['Delete/Backspace', 'Delete step']
        ],
        crop: [
          ['Enter', 'Save selection'],
          ['Esc', 'Cancel/close'],
          ['Space', 'Toggle pan'],
          ['+', 'Zoom in'],
          ['−', 'Zoom out'],
          ['Arrow keys', 'Move selection'],
          ['Shift + Arrow keys', 'Resize selection']
        ]
      }
      ,
      // Additional editor UI
      untitled_session: 'Untitled Session',
      screenshots_word: 'screenshots',
      delete_session_title: 'Delete session',
      click_rename_tooltip: 'Click to rename title',
      no_screenshots: 'No screenshots in this session',
      btn_title_move_up: 'Move up',
      btn_title_move_down: 'Move down',
      btn_title_ai_generate: 'Generate AI description',
      btn_title_edit: 'Edit',
      btn_title_add_comment: 'Add comment',
      btn_title_crop: 'Crop',
      btn_title_undo: 'Undo',
      btn_title_download: 'Download',
      btn_title_copy: 'Copy',
      btn_title_delete: 'Delete',
      crop_save: 'Save crop',
      crop_cancel: 'Cancel',
      crop_pan: 'Pan',
      crop_drag_info: 'Drag to select area',
      crop_select_warning: 'Select an area to crop.',
      undo_none: 'No changes to undo for this step.',
      copy_ok: 'Copied to clipboard!',
      copy_fail: 'Failed to copy to clipboard',
      delete_screenshot_confirm: 'Are you sure you want to delete this screenshot?',
      new_session_prompt_title: 'New Session',
      new_session_prompt_body: 'Name your new session:'
      ,
      title_label: 'Title',
      screenshots_label: 'Screenshots',
      cannot_undo: 'This cannot be undone!',
      no_sessions_to_delete: 'No sessions to delete',
      delete_all_sessions_question: 'Delete ALL sessions?',
      no_session_selected: 'No session selected',
      select_session_first: 'Select a session from the list on the left before exporting.',
      ai_generating: 'Generating AI description...',
      ai_attempt: 'Trying ({attempt}/{max})...',
      comment_placeholder: 'Type your comment here...',
      api_key_missing: 'AI API key is missing\n\nOpen options to add your OpenAI API key.',
      no_network: 'No network connection. Try again when you are online.',
      ai_failed: 'AI description failed',
      ai_failed_tip: 'Tip: Check your network and try again.'
    },
    no: {
      editor_title: '📝 IUB Workspace',
      shortcuts_help: 'Hurtigtaster (?)',
      btn_new_session: '➕ Ny Session',
      btn_delete_all: '🗑️ Slett Alle',
      btn_export_pdf: '📥 Eksporter PDF',
      export_section: '📤 Eksporter',
      export_btn_pdf: '📄 PDF',
      export_btn_md: '📝 Markdown',
      export_btn_json: '📊 JSON',
      step_word: 'Steg',
      exported_label: 'Eksportert',
      saved_sessions_title: '📊 Lagrede Sessions',
      sidebar_instruction: 'Klikk på en session for å se screenshots',
      empty_title: 'Velg en Session',
      empty_desc: 'Klikk på en session i listen til venstre for å se screenshots',
      empty_hint: 'Eller start en ny recording fra sidepanelet »',
      shortcuts_title: '⌨️ Hurtigtaster',
      section_global: 'Globale',
      section_per_step: 'Per steg (sist markert)',
      section_crop: 'I kutt-modus',
      shortcuts_list: {
        global: [
          ['?', 'Åpne denne oversikten'],
          ['Cmd/Ctrl + E', 'Eksporter PDF'],
          ['Cmd/Ctrl + M', 'Eksporter Markdown'],
          ['Cmd/Ctrl + J', 'Eksporter JSON'],
          ['Cmd/Ctrl + N', 'Ny session']
        ],
        step: [
          ['C', 'Kutt bilde'],
          ['U', 'Angre bilde-endring'],
          ['Alt + ↑/↓', 'Flytt steg opp/ned'],
          ['Delete/Backspace', 'Slett steg']
        ],
        crop: [
          ['Enter', 'Lagre utsnitt'],
          ['Esc', 'Avbryt/lukk'],
          ['Space', 'Slå av/på pan'],
          ['+', 'Zoom inn'],
          ['−', 'Zoom ut'],
          ['Piltaster', 'Flytt utsnitt'],
          ['Shift + Piltaster', 'Endre størrelse']
        ]
      }
      ,
      // Additional editor UI
      untitled_session: 'Uten navn',
      screenshots_word: 'skjermbilder',
      delete_session_title: 'Slett session',
      click_rename_tooltip: 'Klikk for å endre tittel',
      no_screenshots: 'Ingen skjermbilder i denne session',
      btn_title_move_up: 'Flytt opp',
      btn_title_move_down: 'Flytt ned',
      btn_title_ai_generate: 'Generer AI-beskrivelse',
      btn_title_edit: 'Rediger',
      btn_title_add_comment: 'Legg til kommentar',
      btn_title_crop: 'Kutt',
      btn_title_undo: 'Angre',
      btn_title_download: 'Last ned',
      btn_title_copy: 'Kopier',
      btn_title_delete: 'Slett',
      crop_save: 'Lagre utsnitt',
      crop_cancel: 'Avbryt',
      crop_pan: 'Pan',
      crop_drag_info: 'Dra for å velge område',
      crop_select_warning: 'Velg et område for å kutte.',
      undo_none: 'Ingen endringer å angre på dette steget.',
      copy_ok: 'Kopiert til utklippstavle!',
      copy_fail: 'Kunne ikke kopiere til utklippstavle',
      delete_screenshot_confirm: 'Er du sikker på at du vil slette dette skjermbildet?',
      new_session_prompt_title: 'Ny Session',
      new_session_prompt_body: 'Gi din nye session et navn:'
      ,
      title_label: 'Tittel',
      screenshots_label: 'Skjermbilder',
      cannot_undo: 'Dette kan ikke angres!',
      no_sessions_to_delete: 'Ingen sessions å slette',
      delete_all_sessions_question: 'Slett ALLE sessions?',
      no_session_selected: 'Ingen session valgt',
      select_session_first: 'Velg en session fra listen til venstre før du eksporterer.',
      ai_generating: 'Genererer AI-beskrivelse...',
      ai_attempt: 'Forsøker ({attempt}/{max})...',
      comment_placeholder: 'Skriv din kommentar her...',
      api_key_missing: 'AI API-nøkkel mangler\n\nGå til innstillinger for å legge til OpenAI API-nøkkel.',
      no_network: 'Ingen nettverkstilkobling. Prøv igjen når du er online.',
      ai_failed: 'AI-beskrivelse feilet',
      ai_failed_tip: 'Tips: Sjekk nettverk og prøv igjen.'
    }
  };

  async function getLang() {
    try {
      const res = await (chrome?.storage?.local?.get?.(['lang']) || {});
      if (res && res.lang) return res.lang;
    } catch {}
    return (navigator.language?.toLowerCase().startsWith('no') ? 'no' : 'en');
  }

  function t(dict, key) { return dict[key] || I18N.en[key] || key; }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el && value != null) el.textContent = value;
  }

  function setTitle(sel, value) {
    const el = document.querySelector(sel);
    if (el && value != null) el.title = value;
  }

  function renderShortcuts(dict) {
    const container = document.getElementById('shortcuts-sections');
    const title = document.getElementById('shortcuts-title');
    if (!container || !title) return;
    title.textContent = t(dict, 'shortcuts_title');

    const section = (heading, items) => `
      <div>
        <h3 style="margin-bottom:8px; color:#334155;">${heading}</h3>
        <ul style="line-height:1.9;${heading===t(dict,'section_crop')?' columns: 2; -webkit-columns:2; -moz-columns:2;':''}">
          ${items.map(([k,v])=>`<li><strong>${k}</strong> ${v}</li>`).join('')}
        </ul>
      </div>`;

    container.innerHTML = [
      section(t(dict,'section_global'), dict.shortcuts_list.global),
      section(t(dict,'section_per_step'), dict.shortcuts_list.step),
      `<div style="grid-column: 1 / -1;">${section(t(dict,'section_crop'), dict.shortcuts_list.crop)}</div>`
    ].join('');
  }

  async function applyI18n() {
    const lang = await getLang();
    const dict = I18N[lang] || I18N.en;
    document.documentElement.lang = lang;

    setText('editor-title', t(dict,'editor_title'));
    setTitle('#shortcuts-help', t(dict,'shortcuts_help'));
    setText('saved-sessions-title', t(dict,'saved_sessions_title'));

    const sidebarInstr = document.getElementById('sidebar-instruction');
    if (sidebarInstr) sidebarInstr.textContent = t(dict,'sidebar_instruction');

    setText('empty-title', t(dict,'empty_title'));
    setText('empty-desc', t(dict,'empty_desc'));
    setText('empty-hint', t(dict,'empty_hint'));

    // Buttons with icons inside static text: update only text nodes
    const btnNew = document.getElementById('new-session');
    if (btnNew) btnNew.innerHTML = t(dict,'btn_new_session');
    const btnDel = document.getElementById('delete-all-sessions');
    if (btnDel) btnDel.innerHTML = t(dict,'btn_delete_all');
    const btnPdf = document.getElementById('export-pdf');
    if (btnPdf) btnPdf.innerHTML = t(dict,'btn_export_pdf');

    // Export section in-session
    const expTitle = document.getElementById('export-title');
    if (expTitle) expTitle.textContent = t(dict,'export_section');
    const expBtnPdf = document.getElementById('export-btn-pdf');
    if (expBtnPdf) expBtnPdf.innerHTML = t(dict,'export_btn_pdf');
    const expBtnMd = document.getElementById('export-btn-md');
    if (expBtnMd) expBtnMd.innerHTML = t(dict,'export_btn_md');
    const expBtnJson = document.getElementById('export-btn-json');
    if (expBtnJson) expBtnJson.innerHTML = t(dict,'export_btn_json');

    // Step word in cards
    document.querySelectorAll('.i18n-step-word').forEach(el => { el.textContent = t(dict,'step_word'); });

    renderShortcuts(dict);
  }

  // Apply once after load and re-apply if lang changes while editor is open
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyI18n, { once: true });
  } else {
    applyI18n();
  }

  // Listen for lang updates (from sidepanel, etc.)
  try {
    chrome?.storage?.onChanged?.addListener((changes, area) => {
      if (area === 'local' && changes.lang) applyI18n();
    });
  } catch {}

  // Expose re-apply method for dynamic UI (e.g., newly inserted cards)
  try { window.applyEditorI18n = applyI18n; window.__editorI18n = { t: (k)=> t(I18N[(document.documentElement.lang||'en')==='no'?'no':'en'], k), getLang }; } catch {}
})();
