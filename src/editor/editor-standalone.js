import { sessionSync, getCloudSyncMeta } from "../utils/session-sync.js";
import { PROVIDERS } from "../utils/cloud-storage.js";

// IUB Standalone Editor (No external dependencies)
// Pure JavaScript implementation

let sessions = [];
let currentSessionIndex = null;
let draggedElement = null;
// Crop state for modal-based cropper
let currentCrop = null; // { index, img, sel: {x,y,w,h}, listeners: [], ui: {layer, rect, toolbar} }
// Track last active step to apply keyboard actions
let lastActiveStepIndex = null;

const domCache = new Map();
const scheduleIdle =
  typeof window !== "undefined" && typeof window.requestIdleCallback === "function"
    ? (cb) => window.requestIdleCallback(cb, { timeout: 400 })
    : (cb) => requestAnimationFrame(cb);
const INITIAL_HYDRATE_COUNT = 6;
const virtualizationOptions = { root: null, rootMargin: "200px", threshold: 0.01 };
let activeGridObserver = null;

const providerLabels = {
  [PROVIDERS.LOCAL]: "Lokal lagring",
  [PROVIDERS.DROPBOX]: "Dropbox",
  [PROVIDERS.ONEDRIVE]: "OneDrive",
  [PROVIDERS.GDRIVE]: "Google Drive"
};

const providerIcons = {
  [PROVIDERS.LOCAL]: "💾",
  [PROVIDERS.DROPBOX]: "🗂️",
  [PROVIDERS.ONEDRIVE]: "☁️",
  [PROVIDERS.GDRIVE]: "📁"
};

function getElement(id) {
  if (!domCache.has(id)) {
    domCache.set(id, document.getElementById(id));
  }
  return domCache.get(id);
}

function clearCachedElement(id) {
  domCache.delete(id);
}

function debounce(fn, wait = 200) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}

function renderCloudStatus(meta = {}) {
  const badge = getElement("cloud-status-badge");
  if (!badge) return;

  const provider = meta.provider || PROVIDERS.LOCAL;
  const icon = providerIcons[provider] || "☁️";
  const providerText = providerLabels[provider] || provider;
  const status = meta.status || "local";

  let statusLabel = "";
  switch (status) {
    case "synced":
      statusLabel = "Synkronisert";
      break;
    case "cached":
      statusLabel = "Uendret";
      break;
    case "error":
      statusLabel = "Feil";
      break;
    case "pending":
      statusLabel = "Klar";
      break;
    case "local":
      statusLabel = provider === PROVIDERS.LOCAL ? "Lokal" : "Klar";
      break;
    default:
      statusLabel = status;
  }

  const text = statusLabel ? `${providerText} · ${statusLabel}` : providerText;
  badge.innerHTML = `${icon} <span>${text}</span>`;
  badge.dataset.state = status;
  badge.title = meta.error ? `${providerText} · ${meta.error}` : `${text}`;
}

async function refreshCloudBadge(metaOverride = null) {
  try {
    if (metaOverride) {
      renderCloudStatus(metaOverride);
      return;
    }
    const meta = await getCloudSyncMeta();
    if (meta) {
      renderCloudStatus(meta);
    } else {
      const provider = await sessionSync.getActiveProvider();
      renderCloudStatus({ provider, status: provider === PROVIDERS.LOCAL ? "local" : "pending" });
    }
  } catch (error) {
    console.warn("[editor] Failed to update cloud badge", error);
    renderCloudStatus({ provider: PROVIDERS.LOCAL, status: "error", error: error.message });
  }
}

// Lightweight i18n helpers (delegates to editor-i18n.js if present)
function i18n(key, fallback) {
  try { return (window.__editorI18n && window.__editorI18n.t && window.__editorI18n.t(key)) || fallback || key; } catch { return fallback || key; }
}
function currentLocale() {
  try { return (document.documentElement.lang || 'en') === 'no' ? 'no-NO' : 'en-GB'; } catch { return 'en-GB'; }
}

// Session helpers
function hasValidSession() {
  return typeof currentSessionIndex === 'number' && currentSessionIndex >= 0 && currentSessionIndex < sessions.length;
}
function getCurrentSession() {
  if (!hasValidSession()) return null;
  return sessions[currentSessionIndex];
}

// Global API key
let API_KEY = "";

// Load sessions on startup
document.addEventListener("DOMContentLoaded", () => {
  loadAPIKey();
  loadSessions();
  refreshCloudBadge();
  setupEventListeners();
});

// Load API key from storage
async function loadAPIKey() {
  try {
    const result = await chrome.storage.local.get(["apiKey"]);
    if (result.apiKey) {
      API_KEY = result.apiKey;
      console.log("AI API key loaded");
    }
  } catch (error) {
    console.error("Failed to load API key:", error);
  }
}

function setupEventListeners() {
  document
    .getElementById("new-session")
    .addEventListener("click", createNewSession);
  document.getElementById("export-pdf").addEventListener("click", exportToPDF);
  document.getElementById("delete-all-sessions").addEventListener("click", deleteAllSessions);
  // Shortcuts help modal
  const shortcutsBtn = document.getElementById('shortcuts-help');
  if (shortcutsBtn) shortcutsBtn.addEventListener('click', openShortcutsModal);
  
  // Close modal button
  const closeBtn = document.getElementById("close-modal-btn");
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  
  // Close modal when clicking outside
  const imgModal = document.getElementById("image-modal");
  if (imgModal) {
    imgModal.addEventListener("click", (e) => {
      if (e.target.id === "image-modal") {
        closeModal();
      }
    });
  }

  // Close shortcuts modal on background click
  const scModal = document.getElementById('shortcuts-modal');
  if (scModal) {
    const closeSc = document.getElementById('close-shortcuts-modal-btn');
    if (closeSc) closeSc.addEventListener('click', closeShortcutsModal);
    scModal.addEventListener('click', (e) => {
      if (e.target.id === 'shortcuts-modal') closeShortcutsModal();
    });
  }

  // Global keyboard shortcuts
  document.addEventListener('keydown', handleGlobalShortcuts);
}

async function loadSessions() {
  try {
    const loaded = await sessionSync.loadSessions({ forceRemote: true });
    sessions = Array.isArray(loaded) ? [...loaded] : [];
    renderSessionList();

    if (sessions.length > 0) {
      showSession(0);
    }
    refreshCloudBadge();
  } catch (error) {
    console.error("Failed to load sessions:", error);
    sessions = [];
    renderSessionList();
  }
}

function renderSessionList() {
  const list = getElement("session-list");
  if (!list) return;

  if (!Array.isArray(sessions) || sessions.length === 0) {
    list.innerHTML =
      `<li style="padding: 16px; text-align: center; color: #64748b; font-size: 13px;">📋 ${i18n('no_screenshots', 'No screenshots in this session')}<br><span style="font-size: 12px; margin-top: 4px; display: block;">&nbsp;</span></li>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  const locale = currentLocale();

  sessions.forEach((session, index) => {
    const li = document.createElement("li");
    li.className = "session-item";
    li.dataset.index = String(index);
    if (index === currentSessionIndex) {
      li.classList.add("active");
    }

    const date = session?.timestamp ? new Date(session.timestamp) : new Date();
    li.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="flex: 1;">
          <div class="session-title">${session.title || i18n('untitled_session','Untitled Session')}</div>
          <div class="session-meta">
            ${session.captures?.length || 0} ${i18n('screenshots_word','screenshots')} • ${date.toLocaleDateString(locale)}
          </div>
        </div>
        <button
          class="delete-session-btn"
          data-index="${index}"
          style="
            background: #ef4444;
            border: none;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
          "
          title="${i18n('delete_session_title','Delete session')}"
        >
          🗑️
        </button>
      </div>
    `;

    li.addEventListener("click", (e) => {
      if (e.target.classList.contains("delete-session-btn")) return;
      showSession(index);
    });

    const deleteBtn = li.querySelector(".delete-session-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteSession(index);
      });

      deleteBtn.addEventListener("mouseenter", () => {
        deleteBtn.style.transform = "scale(1.08)";
        deleteBtn.style.background = "#dc2626";
      });
      deleteBtn.addEventListener("mouseleave", () => {
        deleteBtn.style.transform = "scale(1)";
        deleteBtn.style.background = "#ef4444";
      });
    }

    fragment.appendChild(li);
  });

  list.replaceChildren(fragment);
}

function showSession(index) {
  currentSessionIndex = index;
  const session = sessions[index];
  const mainContent = document.getElementById("main-content");

  // Update active state
  document.querySelectorAll(".session-item").forEach((item, i) => {
    item.classList.toggle("active", i === index);
  });

  // Render screenshots
  mainContent.innerHTML = `
    <h2 id="session-title" style="margin-bottom: 24px; color: #1e293b; cursor: pointer;" title="${i18n('click_rename_tooltip','Click to rename title')}">${session.title || i18n('untitled_session','Untitled Session')}</h2>
    <div class="screenshot-grid" id="screenshot-grid"></div>
    <div class="export-section">
      <h3 id="export-title" style="margin-bottom: 16px; color: #334155;">📤 Eksporter</h3>
      <div class="export-buttons">
        <button id="export-btn-pdf" class="btn btn-primary" data-action="export-pdf">📄 PDF</button>
        <button id="export-btn-md" class="btn btn-secondary" data-action="export-markdown">📝 Markdown</button>
        <button id="export-btn-json" class="btn btn-secondary" data-action="export-json">📊 JSON</button>
      </div>
    </div>
  `;
  
  // Add event listeners to export buttons
  mainContent.querySelector('[data-action="export-pdf"]').addEventListener('click', exportToPDF);
  mainContent.querySelector('[data-action="export-markdown"]').addEventListener('click', exportToMarkdown);
  mainContent.querySelector('[data-action="export-json"]').addEventListener('click', exportToJSON);

  // Title edit handler
  clearCachedElement('session-title');
  const titleEl = getElement('session-title');
  if (titleEl) {
    titleEl.addEventListener('click', () => {
      const current = session.title || '';
      const next = prompt(`✏️ ${i18n('new_session_prompt_title','New Session')}` + "\n\n" + i18n('new_session_prompt_body','Name your new session:'), current);
      if (next !== null) {
        const val = next.trim();
        if (val.length > 0) {
          const cur = getCurrentSession();
          if (cur) cur.title = val;
          saveSessions();
          renderSessionList();
          showSession(currentSessionIndex);
        }
      }
    });
  }

  clearCachedElement("screenshot-grid");
  renderScreenshotGrid(session);
  // Re-apply i18n for newly rendered content
  try { window.applyEditorI18n && window.applyEditorI18n(); } catch {}
}

function renderScreenshotGrid(session) {
  const grid = getElement("screenshot-grid");
  if (!grid) return;

  if (activeGridObserver) {
    activeGridObserver.disconnect();
    activeGridObserver = null;
  }

  const captures = Array.isArray(session.captures) ? session.captures : [];
  if (captures.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #64748b;">${i18n('no_screenshots','No screenshots in this session')}</div>`;
    return;
  }

  grid.innerHTML = "";
  const fragment = document.createDocumentFragment();
  const placeholders = captures.map((_, index) => {
    const placeholder = document.createElement("div");
    placeholder.className = "screenshot-card placeholder";
    placeholder.dataset.index = String(index);
    fragment.appendChild(placeholder);
    return placeholder;
  });

  grid.appendChild(fragment);

  const hydrate = (placeholder) => {
    if (!placeholder || placeholder.dataset.hydrated === "true") return;
    const index = Number(placeholder.dataset.index);
    const capture = captures[index];
    if (!capture) return;
    const card = createScreenshotCard(capture, index);
    placeholder.dataset.hydrated = "true";
    placeholder.replaceWith(card);
  };

  const scheduleHydrate = (placeholder) => {
    if (!placeholder || placeholder.dataset.hydrated === "true") return;
    scheduleIdle(() => hydrate(placeholder));
  };

  placeholders.slice(0, Math.min(INITIAL_HYDRATE_COUNT, placeholders.length)).forEach(scheduleHydrate);

  if ("IntersectionObserver" in window && placeholders.length > INITIAL_HYDRATE_COUNT) {
    activeGridObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          scheduleHydrate(entry.target);
          activeGridObserver.unobserve(entry.target);
        }
      });
    }, virtualizationOptions);

    placeholders.slice(INITIAL_HYDRATE_COUNT).forEach((placeholder) => {
      activeGridObserver.observe(placeholder);
    });
  } else {
    placeholders.forEach(scheduleHydrate);
  }
}

function createScreenshotCard(capture, index) {
  const card = document.createElement("div");
  card.className = "screenshot-card";
  card.draggable = true;
  card.dataset.index = index;

  card.innerHTML = `
    <div class="bubble-header">
      <div class="bubble-step"><strong><span class="i18n-step-word">Step</span> ${index + 1}:</strong></div>
      <div class="bubble-controls">
        <button class="move-up" title="Flytt opp" data-index="${index}">↑</button>
        <button class="move-down" title="Flytt ned" data-index="${index}">↓</button>
        <button class="generate-ai" title="Generer AI-beskrivelse" data-index="${index}">🤖</button>
        <button class="edit-text" title="Rediger" data-index="${index}">✎</button>
        <button class="add-comment" title="Legg til kommentar" data-index="${index}">💬</button>
      </div>
    </div>
    <div class="bubble-content">
      <div class="bubble-image">
        <img src="${capture.dataUrl}" alt="${i18n('step_word','Step')} ${index + 1}" data-action="open-modal">
      </div>
      <div class="screenshot-info">
        <textarea class="description-box" placeholder="${i18n('comment_placeholder','Type your comment here...')}" data-index="${index}">${capture.description || ""}</textarea>
        <div class="screenshot-actions">
          <button class="icon-btn" data-action="crop" data-index="${index}" title="Kutt">✂️</button>
          <button class="icon-btn" data-action="undo" data-index="${index}" title="Angre">↩️</button>
          <button class="icon-btn" data-action="download" data-index="${index}" title="Last ned">💾</button>
          <button class="icon-btn" data-action="copy" data-index="${index}" title="Kopier">📋</button>
          <button class="icon-btn" data-action="delete" data-index="${index}" title="Slett">🗑️</button>
        </div>
      </div>
    </div>
  `;
  
  // Add event listeners
  const img = card.querySelector('img');
  img.addEventListener('click', () => { lastActiveStepIndex = index; openImageModal(capture.dataUrl, index, false); });
  
  const textarea = card.querySelector('.description-box');
  const debouncedUpdate = debounce((value) => updateDescription(index, value));
  textarea.addEventListener('input', (e) => debouncedUpdate(e.target.value));
  textarea.addEventListener('change', (e) => updateDescription(index, e.target.value));
  textarea.addEventListener('focus', () => { lastActiveStepIndex = index; });
  card.addEventListener('click', () => { lastActiveStepIndex = index; });
  
  // Control buttons
  const moveUpBtn = card.querySelector('.move-up');
  const moveDownBtn = card.querySelector('.move-down');
  const generateAIBtn = card.querySelector('.generate-ai');
  const editBtn = card.querySelector('.edit-text');
  const commentBtn = card.querySelector('.add-comment');
  // Localize tooltips
  moveUpBtn.title = i18n('btn_title_move_up','Flytt opp');
  moveDownBtn.title = i18n('btn_title_move_down','Flytt ned');
  generateAIBtn.title = i18n('btn_title_ai_generate','Generer AI-beskrivelse');
  editBtn.title = i18n('btn_title_edit','Rediger');
  commentBtn.title = i18n('btn_title_add_comment','Legg til kommentar');

  moveUpBtn.addEventListener('click', () => moveScreenshot(index, 'up'));
  moveDownBtn.addEventListener('click', () => moveScreenshot(index, 'down'));
  generateAIBtn.addEventListener('click', () => generateAIDescription(index));
  editBtn.addEventListener('click', () => textarea.focus());
  commentBtn.addEventListener('click', () => {
    textarea.focus();
    if (!textarea.value) {
      textarea.placeholder = i18n('comment_placeholder','Type your comment here...');
    }
  });
  
  // Action buttons
  card.querySelectorAll('.icon-btn').forEach(btn => {
    const action = btn.dataset.action;
    const btnIndex = parseInt(btn.dataset.index);
    // Localize action button titles
    if (action === 'crop') btn.title = i18n('btn_title_crop','Crop');
    if (action === 'undo') btn.title = i18n('btn_title_undo','Undo');
    if (action === 'download') btn.title = i18n('btn_title_download','Download');
    if (action === 'copy') btn.title = i18n('btn_title_copy','Copy');
    if (action === 'delete') btn.title = i18n('btn_title_delete','Delete');
    
    btn.addEventListener('click', () => {
      const session = getCurrentSession();
      if (!session || !Array.isArray(session.captures) || !session.captures[btnIndex]) return;
      if (action === 'download') downloadImage(session.captures[btnIndex].dataUrl, btnIndex);
      else if (action === 'copy') copyToClipboard(session.captures[btnIndex].dataUrl);
      else if (action === 'delete') deleteScreenshot(btnIndex);
      else if (action === 'crop') startCrop(btnIndex);
      else if (action === 'undo') undoCrop(btnIndex);
    });
  });

  registerCardDragHandlers(card);
  return card;
}

function registerCardDragHandlers(card) {
  if (!card) return;
  card.addEventListener("dragstart", handleDragStart);
  card.addEventListener("dragover", handleDragOver);
  card.addEventListener("drop", handleDrop);
  card.addEventListener("dragend", handleDragEnd);
}

function handleDragStart(e) {
  draggedElement = this;
  this.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = "move";
  return false;
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }

  if (draggedElement !== this) {
    const fromIndex = parseInt(draggedElement.dataset.index);
    const toIndex = parseInt(this.dataset.index);

    // Reorder captures
    const session = getCurrentSession();
    if (!session || !Array.isArray(session.captures)) return false;
    const [removed] = session.captures.splice(fromIndex, 1);
    session.captures.splice(toIndex, 0, removed);

    // Save and refresh
    saveSessions();
    showSession(currentSessionIndex);
  }

  return false;
}

function handleDragEnd() {
  this.classList.remove("dragging");
}

// Generate AI description for a screenshot
async function generateAIDescription(index) {
  if (!API_KEY) {
    alert("⚠️ " + i18n('api_key_missing','AI API key is missing\n\nOpen options to add your OpenAI API key.'));
    return;
  }

  const session = getCurrentSession();
  if (!session || !Array.isArray(session.captures) || !session.captures[index]) return;
  const capture = session.captures[index];

  // Show loading indicator
  const textarea = document.querySelector(`.description-box[data-index="${index}"]`);
  if (!textarea) return;

  const originalPlaceholder = textarea.placeholder;
  textarea.placeholder = "🤖 " + i18n('ai_generating','Generating AI description...');
  textarea.disabled = true;

  try {
    if (!navigator.onLine) {
      throw new Error(i18n('no_network','No network connection. Try again when you are online.'));
    }

    const url = "https://api.openai.com/v1/chat/completions";
    const payload = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this screenshot and write a concise description (2-3 sentences in Norwegian) about what the user should do in this step."
            },
            {
              type: "image_url",
              image_url: { url: capture.dataUrl }
            }
          ]
        }
      ],
      max_tokens: 200
    };

    const onAttempt = (attempt, max) => {
      const tmpl = i18n('ai_attempt','Trying ({attempt}/{max})...');
      textarea.placeholder = `🤖 ${tmpl.replace('{attempt}', String(attempt)).replace('{max}', String(max))}`;
    };

    const response = await fetchWithRetry(() => timeoutFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify(payload)
    }, 20000), { retries: 2, backoffMs: 800, onAttempt });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || `API error: ${response.status}`);
    }

    const aiDescription = data.choices[0].message.content.trim();
    textarea.value = aiDescription;
    capture.description = aiDescription;
    await saveSessions();
    console.log("AI description generated for step", index + 1);
  } catch (error) {
    console.error("AI description failed:", error);
    alert(`❌ ${i18n('ai_failed','AI description failed')}\n\n${error.message}\n\n${i18n('ai_failed_tip','Tip: Check your network and try again.')}`);
  } finally {
    textarea.disabled = false;
    textarea.placeholder = originalPlaceholder;
  }
}

// --- Networking helpers: timeout + retry with backoff ---
function sleep(ms) { return new Promise((res) => setTimeout(res, ms)); }
function timeoutFetch(resource, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(resource, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
}
async function fetchWithRetry(makeRequest, { retries = 2, backoffMs = 500, onAttempt } = {}) {
  const maxAttempts = retries + 1;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (onAttempt) onAttempt(attempt, maxAttempts);
      const resp = await makeRequest();
      // Retry on 429 or 5xx
      if (!resp.ok && (resp.status === 429 || resp.status >= 500)) {
        if (attempt < maxAttempts) {
          await sleep(backoffMs * attempt);
          continue;
        }
      }
      return resp;
    } catch (err) {
      // Network errors (TypeError), AbortError, or broken pipe messages
      const msg = String(err?.message || err || 'error');
      const transient = msg.includes('network') || msg.includes('abort') || msg.includes('Failed to fetch') || msg.includes('broken pipe') || msg.includes('unavailable');
      if (attempt < maxAttempts && transient) {
        await sleep(backoffMs * attempt);
        continue;
      }
      throw err;
    }
  }
}

function updateDescription(index, description) {
  const session = getCurrentSession();
  if (!session || !Array.isArray(session.captures) || !session.captures[index]) return;
  session.captures[index].description = description;
  saveSessions();
}

function moveScreenshot(index, direction) {
  const session = getCurrentSession();
  if (!session || !Array.isArray(session.captures)) return;
  const newIndex = direction === 'up' ? index - 1 : index + 1;
  
  // Check boundaries
  if (newIndex < 0 || newIndex >= session.captures.length) return;
  
  // Swap captures
  [session.captures[index], session.captures[newIndex]] = 
    [session.captures[newIndex], session.captures[index]];
  
  saveSessions();
  showSession(currentSessionIndex);
}

function openImageModal(dataUrl, index = null, cropMode = false) {
  const modal = document.getElementById("image-modal");
  const img = document.getElementById("modal-image");
  if (!modal || !img) {
    console.warn('[editor] Image modal elements missing');
    return;
  }
  img.src = dataUrl;
  modal.classList.add("active");

  if (cropMode && index !== null) {
    // Initialize crop UI
    setupCropUI(index);
  }
}

function closeModal() {
  const modal = document.getElementById("image-modal");
  modal.classList.remove("active");
  cleanupCropUI();
}

// Close modal on background click (guard if element exists)
(() => {
  const el = document.getElementById("image-modal");
  if (!el) return;
  el.addEventListener("click", (e) => {
    if (e.target && e.target.id === "image-modal") {
      closeModal();
    }
  });
})();

// --------------------------
// Cropper implementation
// --------------------------

function startCrop(index) {
  const session = getCurrentSession();
  if (!session || !Array.isArray(session.captures) || !session.captures[index]) return;
  const cap = session.captures[index];
  openImageModal(cap.dataUrl, index, true);
}

function setupCropUI(index) {
  cleanupCropUI();
  const modal = document.getElementById('image-modal');
  const content = modal.querySelector('.modal-content');
  const imgEl = document.getElementById('modal-image');

  // Ensure image element has loaded to get correct sizes
  const ensureLoaded = () => new Promise((resolve) => {
    if (imgEl.complete) resolve();
    else imgEl.onload = () => resolve();
  });

  ensureLoaded().then(() => {
    // Create overlay layer and selection rectangle
    const layer = document.createElement('div');
    layer.style.cssText = 'position:absolute; inset:0; cursor:crosshair;';
    const rect = document.createElement('div');
    rect.style.cssText = 'position:absolute; border:2px solid #22c55e; background:rgba(34,197,94,0.15); display:none;';

    // Toolbar
    const toolbar = document.createElement('div');
    toolbar.style.cssText = 'position:absolute; top:12px; left:50%; transform:translateX(-50%); display:flex; gap:8px; z-index:5; align-items:center;';
    const saveBtn = document.createElement('button');
    saveBtn.textContent = '✅ ' + i18n('crop_save','Save crop');
    saveBtn.className = 'btn btn-primary';
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '✖️ ' + i18n('crop_cancel','Cancel');
    cancelBtn.className = 'btn btn-secondary';
    const panBtn = document.createElement('button');
    panBtn.textContent = '🖐️ ' + i18n('crop_pan','Pan');
    panBtn.className = 'btn btn-secondary';
    const zoomOutBtn = document.createElement('button');
    zoomOutBtn.textContent = '−';
    zoomOutBtn.className = 'btn btn-secondary';
    const zoomRange = document.createElement('input');
    zoomRange.type = 'range'; zoomRange.min = '25'; zoomRange.max = '400'; zoomRange.value = '100'; zoomRange.style.width = '140px';
    const zoomInBtn = document.createElement('button');
    zoomInBtn.textContent = '+';
    zoomInBtn.className = 'btn btn-secondary';
    const info = document.createElement('span');
    info.style.cssText = 'background:rgba(0,0,0,0.6); color:#fff; padding:6px 10px; border-radius:8px; font-weight:600;';
    info.textContent = i18n('crop_drag_info','Drag to select area');
    toolbar.appendChild(saveBtn);
    toolbar.appendChild(cancelBtn);
    toolbar.appendChild(panBtn);
    toolbar.appendChild(zoomOutBtn);
    toolbar.appendChild(zoomRange);
    toolbar.appendChild(zoomInBtn);
    toolbar.appendChild(info);

    content.style.position = 'relative';
    content.appendChild(layer);
    content.appendChild(rect);
    content.appendChild(toolbar);

    // Calculate coordinate mapping relative to image
    let imgBox = imgEl.getBoundingClientRect();
    const contentBox = content.getBoundingClientRect();

    function toImgCoords(clientX, clientY) {
      const x = clientX - imgBox.left;
      const y = clientY - imgBox.top;
      return { x: Math.max(0, Math.min(x, imgBox.width)), y: Math.max(0, Math.min(y, imgBox.height)) };
    }

    let mode = 'idle'; // 'new' | 'move' | 'resize' | 'pan'
    let start = { x: 0, y: 0 };
    let sel = { x: 0, y: 0, w: 0, h: 0 };
    let handleDir = null;
    let zoom = 1; let tx = 0; let ty = 0; let lastW = imgBox.width; // for scaling sel on zoom
    function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

    // Prepare image for transform-based zoom/pan
    imgEl.style.transformOrigin = 'top left';
    function applyTransform() {
      imgEl.style.transform = `translate(${tx}px, ${ty}px) scale(${zoom})`;
      imgBox = imgEl.getBoundingClientRect();
      // Scale selection to keep region visually consistent when zoom changes
      const scaleFactor = imgBox.width / lastW;
      if (scaleFactor && isFinite(scaleFactor) && scaleFactor > 0) {
        sel.x *= scaleFactor; sel.y *= scaleFactor; sel.w *= scaleFactor; sel.h *= scaleFactor;
        lastW = imgBox.width;
      }
      updateRect();
    }

    function onMouseDown(e) {
      // Determine intent based on target
      if (e.target.classList.contains('crop-handle')) {
        mode = 'resize';
        handleDir = e.target.dataset.dir;
        start = toImgCoords(e.clientX, e.clientY);
        e.preventDefault();
        return;
      }

      if (e.target === rect) {
        mode = 'move';
        start = toImgCoords(e.clientX, e.clientY);
        e.preventDefault();
        return;
      }

      if (panBtn.dataset.active === 'true') {
        mode = 'pan';
        start = { cx: e.clientX, cy: e.clientY };
        layer.style.cursor = 'grabbing';
        e.preventDefault();
        return;
      }

      // Start a new selection
      const { x, y } = toImgCoords(e.clientX, e.clientY);
      mode = 'new';
      start = { x, y };
      sel = { x, y, w: 0, h: 0 };
      rect.style.display = 'block';
      updateRect();
    }

    function onMouseMove(e) {
      if (mode === 'idle') return;
      if (mode === 'pan') {
        const dx = e.clientX - start.cx; const dy = e.clientY - start.cy;
        start = { cx: e.clientX, cy: e.clientY };
        tx += dx; ty += dy; applyTransform();
        return;
      }

      const { x, y } = toImgCoords(e.clientX, e.clientY);
      if (mode === 'new') {
        sel.w = Math.abs(x - start.x);
        sel.h = Math.abs(y - start.y);
        sel.x = Math.min(x, start.x);
        sel.y = Math.min(y, start.y);
      } else if (mode === 'move') {
        const dx = x - start.x; const dy = y - start.y;
        start = { x, y };
        sel.x = clamp(sel.x + dx, 0, Math.max(0, imgBox.width - sel.w));
        sel.y = clamp(sel.y + dy, 0, Math.max(0, imgBox.height - sel.h));
      } else if (mode === 'resize') {
        // Adjust based on handle
        const minSize = 4;
        let nx = sel.x, ny = sel.y, nw = sel.w, nh = sel.h;
        const endX = sel.x + sel.w; const endY = sel.y + sel.h;
        if (handleDir.includes('w')) {
          nx = clamp(x, 0, endX - minSize); nw = endX - nx;
        }
        if (handleDir.includes('e')) {
          nw = clamp(x - sel.x, minSize, imgBox.width - sel.x);
        }
        if (handleDir.includes('n')) {
          ny = clamp(y, 0, endY - minSize); nh = endY - ny;
        }
        if (handleDir.includes('s')) {
          nh = clamp(y - sel.y, minSize, imgBox.height - sel.y);
        }
        sel = { x: nx, y: ny, w: nw, h: nh };
      }
      updateRect();
      info.textContent = `${Math.round(sel.w)} × ${Math.round(sel.h)} px · Zoom ${Math.round(zoom*100)}%`;
    }

    function onMouseUp() {
      if (mode === 'pan') {
        layer.style.cursor = 'grab';
      }
      mode = 'idle';
    }

    function updateRect() {
      // Position rect in content coordinates
      rect.style.left = `${imgBox.left - contentBox.left + sel.x}px`;
      rect.style.top = `${imgBox.top - contentBox.top + sel.y}px`;
      rect.style.width = `${sel.w}px`;
      rect.style.height = `${sel.h}px`;
      positionHandles();
    }

    function doSave() {
      if (sel.w < 4 || sel.h < 4) {
        alert(i18n('crop_select_warning','Select an area to crop.'));
        return;
      }
      // Map selection to natural image pixels
      const scaleX = imgEl.naturalWidth / imgBox.width;
      const scaleY = imgEl.naturalHeight / imgBox.height;
      const sx = Math.round(sel.x * scaleX);
      const sy = Math.round(sel.y * scaleY);
      const sw = Math.round(sel.w * scaleX);
      const sh = Math.round(sel.h * scaleY);

      const canvas = document.createElement('canvas');
      canvas.width = sw; canvas.height = sh;
      const ctx = canvas.getContext('2d');
      const tmpImg = new Image();
      tmpImg.onload = () => {
        ctx.drawImage(tmpImg, sx, sy, sw, sh, 0, 0, sw, sh);
        const newUrl = canvas.toDataURL('image/png');
        applyCrop(index, newUrl);
        closeModal();
      };
      tmpImg.src = sessions[currentSessionIndex].captures[index].dataUrl;
    }

    function doCancel() {
      closeModal();
    }

    layer.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    saveBtn.addEventListener('click', doSave);
    cancelBtn.addEventListener('click', doCancel);

    // Pan toggle and zoom controls
    panBtn.addEventListener('click', () => {
      const active = panBtn.dataset.active === 'true';
      panBtn.dataset.active = String(!active);
      panBtn.style.background = !active ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '';
      panBtn.style.color = !active ? 'white' : '';
      layer.style.cursor = !active ? 'grab' : 'crosshair';
    });
    zoomOutBtn.addEventListener('click', () => { setZoom(zoom - 0.1); });
    zoomInBtn.addEventListener('click', () => { setZoom(zoom + 0.1); });
    zoomRange.addEventListener('input', () => { setZoom(parseInt(zoomRange.value, 10) / 100); });
    function setZoom(z) {
      const nz = clamp(z, 0.25, 4);
      if (nz === zoom) return;
      zoom = nz;
      zoomRange.value = String(Math.round(zoom * 100));
      applyTransform();
    }

    // Handles on selection rectangle
    const handles = [];
    const handleDirs = ['nw','n','ne','e','se','s','sw','w'];
    handleDirs.forEach(dir => {
      const h = document.createElement('div');
      h.className = 'crop-handle';
      h.dataset.dir = dir;
      h.style.cssText = 'position:absolute; width:12px; height:12px; background:#22c55e; border:2px solid #fff; border-radius:50%; box-shadow:0 2px 6px rgba(0,0,0,0.2);';
      h.addEventListener('mousedown', (e) => { e.stopPropagation(); /* handled in onMouseDown via target check */ });
      rect.appendChild(h);
      handles.push(h);
    });

    function positionHandles() {
      if (rect.style.display === 'none') return;
      const r = rect.getBoundingClientRect();
      const cx = r.left; const cy = r.top; const cw = r.width; const ch = r.height;
      const pos = {
        nw: [cx-6, cy-6], n: [cx+cw/2-6, cy-6], ne: [cx+cw-6, cy-6],
        e: [cx+cw-6, cy+ch/2-6], se: [cx+cw-6, cy+ch-6], s: [cx+cw/2-6, cy+ch-6],
        sw: [cx-6, cy+ch-6], w: [cx-6, cy+ch/2-6]
      };
      handles.forEach(h => {
        const [hx, hy] = pos[h.dataset.dir];
        h.style.left = `${hx - (contentBox.left)}px`;
        h.style.top = `${hy - (contentBox.top)}px`;
        // Cursor style
        const cursorMap = { nw:'nwse-resize', se:'nwse-resize', ne:'nesw-resize', sw:'nesw-resize', n:'ns-resize', s:'ns-resize', e:'ew-resize', w:'ew-resize' };
        h.style.cursor = cursorMap[h.dataset.dir] || 'pointer';
      });
    }

    currentCrop = {
      index,
      sel,
      ui: { layer, rect, toolbar, handles },
      listeners: [
        { target: layer, type: 'mousedown', handler: onMouseDown },
        { target: window, type: 'mousemove', handler: onMouseMove },
        { target: window, type: 'mouseup', handler: onMouseUp },
        { target: saveBtn, type: 'click', handler: doSave },
        { target: cancelBtn, type: 'click', handler: doCancel },
        { target: panBtn, type: 'click', handler: () => {} },
        { target: zoomOutBtn, type: 'click', handler: () => {} },
        { target: zoomInBtn, type: 'click', handler: () => {} },
        { target: zoomRange, type: 'input', handler: () => {} }
      ],
      save: doSave,
      update: updateRect
    };
  });
}

function cleanupCropUI() {
  if (!currentCrop) return;
  const { ui, listeners } = currentCrop;
  if (listeners) listeners.forEach(({ target, type, handler }) => {
    try { target.removeEventListener(type, handler); } catch {}
  });
  if (ui?.layer && ui.layer.parentNode) ui.layer.parentNode.removeChild(ui.layer);
  if (ui?.rect && ui.rect.parentNode) ui.rect.parentNode.removeChild(ui.rect);
  if (ui?.toolbar && ui.toolbar.parentNode) ui.toolbar.parentNode.removeChild(ui.toolbar);
  currentCrop = null;
}

function applyCrop(index, newDataUrl) {
  const session = getCurrentSession();
  if (!session || !Array.isArray(session.captures) || !session.captures[index]) return;
  const cap = session.captures[index];
  // Initialize history and cap it
  if (!cap.history) cap.history = [];
  cap.history.push(cap.dataUrl);
  if (cap.history.length > 5) cap.history.shift();
  // Apply new image
  cap.dataUrl = newDataUrl;
  saveSessions();
  showSession(currentSessionIndex);
}

function undoCrop(index) {
  const session = getCurrentSession();
  if (!session || !Array.isArray(session.captures) || !session.captures[index]) return;
  const cap = session.captures[index];
  if (!cap.history || cap.history.length === 0) {
    alert('Ingen endringer å angre på dette steget.');
    return;
  }
  const prev = cap.history.pop();
  cap.dataUrl = prev;
  saveSessions();
  showSession(currentSessionIndex);
}

function downloadImage(dataUrl, index) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `screenshot_${index + 1}_${Date.now()}.png`;
  a.click();
}

async function copyToClipboard(dataUrl) {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    alert("✅ " + i18n('copy_ok','Copied to clipboard!'));
  } catch (error) {
    console.error("Copy failed:", error);
    alert("❌ " + i18n('copy_fail','Failed to copy to clipboard'));
  }
}

function deleteScreenshot(index) {
  if (!confirm(i18n('delete_screenshot_confirm','Are you sure you want to delete this screenshot?'))) {
    return;
  }

  const session = getCurrentSession();
  if (!session || !Array.isArray(session.captures)) return;
  if (index < 0 || index >= session.captures.length) return;
  session.captures.splice(index, 1);
  saveSessions();
  showSession(currentSessionIndex);
}

function createNewSession() {
  const title = prompt(`🎯 ${i18n('new_session_prompt_title','New Session')}\n\n${i18n('new_session_prompt_body','Name your new session:')}`, i18n('untitled_session','Untitled Session'));
  if (!title) return;

  const newSession = {
    title,
    timestamp: Date.now(),
    captures: []
  };

  sessions.push(newSession);
  saveSessions();
  renderSessionList();
  showSession(sessions.length - 1);
}

async function saveSessions() {
  try {
    const result = await sessionSync.saveSessions(sessions);
    if (result && result.success === false && result.error) {
      scheduleIdle(() => refreshCloudBadge({ provider: result.provider, status: "error", error: result.error }));
    } else {
      scheduleIdle(() => refreshCloudBadge());
    }
    return result;
  } catch (error) {
    console.error("Failed to save sessions:", error);
    scheduleIdle(() => refreshCloudBadge({ provider: PROVIDERS.LOCAL, status: "error", error: error.message }));
    return null;
  }
}

function deleteSession(index) {
  const session = sessions[index];
  const confirm = window.confirm(
    `🗑️ ${i18n('delete_session_title','Delete session')}?\n\n` +
    `${i18n('title_label','Title')}: "${session.title || i18n('untitled_session','Untitled Session')}"\n` +
    `${i18n('screenshots_label','Screenshots')}: ${session.captures?.length || 0}\n\n` +
    `❌ ${i18n('cannot_undo','This cannot be undone!')}`
  );
  
  if (!confirm) return;
  
  // Remove session from array
  sessions.splice(index, 1);
  
  // Save to storage
  saveSessions();
  
  // Update UI
  renderSessionList();
  
  // Show first session or empty state
  if (sessions.length > 0) {
    const newIndex = Math.min(index, sessions.length - 1);
    showSession(newIndex);
  } else {
    // Show empty state
    const mainContent = document.getElementById("main-content");
    mainContent.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke-width="2" />
        </svg>
        <h2>${i18n('empty_title','Choose a Session')}</h2>
        <p>${i18n('sidebar_instruction','Click a session to view screenshots')}</p>
        <p style="margin-top: 20px; font-size: 14px; color: #94a3b8;">${i18n('empty_hint','Or start a new recording from the side panel »')}</p>
      </div>
    `;
    currentSessionIndex = null;
  }
  
  console.log(`Deleted session at index ${index}`);
}

function deleteAllSessions() {
  if (sessions.length === 0) {
    alert(`ℹ️ ${i18n('no_sessions_to_delete','No sessions to delete')}`);
    return;
  }
  
  const confirm = window.confirm(
    `⚠️ ${i18n('delete_all_sessions_question','Delete ALL sessions?')}\n\n` +
    `❌ ${i18n('cannot_undo','This cannot be undone!')}`
  );
  
  if (!confirm) return;
  
  // Clear all sessions
  sessions.length = 0;
  currentSessionIndex = null;
  
  // Save empty array
  saveSessions();
  
  // Also clear captures from storage
  chrome.storage.local.remove(['captures']);
  
  // Update UI
  renderSessionList();
  
  // Show empty state
  const mainContent = document.getElementById("main-content");
  mainContent.innerHTML = `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke-width="2" />
      </svg>
      <h2>✅ ${i18n('no_sessions_to_delete','No sessions to delete')}</h2>
      <p>${i18n('empty_hint','Or start a new recording from the side panel »')}</p>
    </div>
  `;
  
  console.log('Deleted all sessions');
}

// Export functions
function exportToPDF() {
  const session = getCurrentSession();
  if (!session) {
    alert(`⚠️ ${i18n('no_session_selected','No session selected')}\n\n${i18n('select_session_first','Select a session from the list on the left before exporting.')}`);
    return;
  }

  // Simple PDF export using native print
  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
    <html>
    <head>
      <title>${session.title}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        h1 { color: #667eea; }
        .screenshot { page-break-inside: avoid; margin: 20px 0; }
        img { max-width: 100%; border: 1px solid #ddd; border-radius: 8px; }
        .description { margin: 10px 0; padding: 10px; background: #f8fafc; border-radius: 4px; }
      </style>
    </head>
    <body>
      <h1>${session.title}</h1>
      <p>${i18n('exported_label','Exported')}: ${new Date().toLocaleString(currentLocale())}</p>
      <p>${i18n('screenshots_label','Screenshots')}: ${session.captures.length}</p>
      <hr>
      ${session.captures
        .map(
          (capture, i) => `
        <div class="screenshot">
          <h2>${i18n('step_word','Step')} ${i + 1}</h2>
          <img src="${capture.dataUrl}" alt="${i18n('step_word','Step')} ${i + 1}">
          ${capture.description ? `<div class="description">${capture.description}</div>` : ""}
        </div>
      `
        )
        .join("")}
    </body>
    </html>
  `);

  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 500);
}

function exportToMarkdown() {
  const session = getCurrentSession();
  if (!session) {
    alert(`⚠️ ${i18n('no_session_selected','No session selected')}\n\n${i18n('select_session_first','Select a session from the list on the left before exporting.')}`);
    return;
  }
  let markdown = `# ${session.title}\n\n`;
  markdown += `**${i18n('exported_label','Exported')}:** ${new Date().toLocaleString(currentLocale())}\n`;
  markdown += `**${i18n('screenshots_label','Screenshots')}:** ${session.captures.length}\n\n`;
  markdown += `---\n\n`;

  session.captures.forEach((capture, i) => {
    markdown += `## ${i18n('step_word','Step')} ${i + 1}\n\n`;
    if (capture?.description) {
      markdown += `${capture.description}\n\n`;
    }
    markdown += `![${i18n('step_word','Step')} ${i + 1}](${capture.dataUrl})\n\n`;
    markdown += `---\n\n`;
  });

  const blob = new Blob([markdown], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${session.title.replace(/[^a-z0-9]/gi, "_")}_${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportToJSON() {
  const session = getCurrentSession();
  if (!session) {
    alert(`⚠️ ${i18n('no_session_selected','No session selected')}\n\n${i18n('select_session_first','Select a session from the list on the left before exporting.')}`);
    return;
  }
  const json = JSON.stringify(session, null, 2);

  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${session.title.replace(/[^a-z0-9]/gi, "_")}_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Make functions global for onclick handlers
window.openImageModal = openImageModal;
window.closeModal = closeModal;
window.downloadImage = downloadImage;
window.copyToClipboard = copyToClipboard;
window.deleteScreenshot = deleteScreenshot;
window.updateDescription = updateDescription;
window.generateAIDescription = generateAIDescription;
window.exportToPDF = exportToPDF;
window.exportToMarkdown = exportToMarkdown;
window.exportToJSON = exportToJSON;
// Expose helpers for external scripts (e.g., marketing mode)
window.reloadEditorSessions = loadSessions;
window.showSessionByIndex = showSession;

// --------------------------
// Shortcuts & helpers
// --------------------------

function isTypingTarget(el) {
  return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
}

function handleGlobalShortcuts(e) {
  const target = e.target;
  const meta = navigator.platform.toLowerCase().includes('mac') ? e.metaKey : e.ctrlKey;

  // '?' opens shortcuts
  if ((e.key === '?' || (e.shiftKey && e.key === '/')) && !isTypingTarget(target)) {
    e.preventDefault();
    openShortcutsModal();
    return;
  }

  // If crop modal active, handle crop-specific keys
  if (document.getElementById('image-modal').classList.contains('active')) {
    // Allow Esc/Enter/zoom/navigation
    if (e.key === 'Escape') { e.preventDefault(); closeModal(); return; }
    if (e.key === 'Enter') { e.preventDefault(); if (currentCrop?.save) currentCrop.save(); return; }
    if (e.key === '+' || (e.shiftKey && e.key === '=')) { e.preventDefault(); // zoom in via toolbar
      const range = document.querySelector('#image-modal .modal-content input[type="range"]');
      if (range) { range.value = String(Math.min(400, (parseInt(range.value,10)||100)+10)); range.dispatchEvent(new Event('input')); }
      return;
    }
    if (e.key === '-' ) { e.preventDefault();
      const range = document.querySelector('#image-modal .modal-content input[type="range"]');
      if (range) { range.value = String(Math.max(25, (parseInt(range.value,10)||100)-10)); range.dispatchEvent(new Event('input')); }
      return;
    }
    if (!currentCrop) return;
    // Arrow keys: move selection; Shift+Arrow resize
    const step = e.shiftKey ? 10 : 1;
    if (["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)) {
      e.preventDefault();
      const modal = document.getElementById('image-modal');
      const content = modal.querySelector('.modal-content');
      const imgEl = document.getElementById('modal-image');
      const imgBox = imgEl.getBoundingClientRect();
      let { x, y, w, h } = currentCrop.sel;
      const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
      if (e.shiftKey) {
        if (e.key === 'ArrowRight') w = clamp(w + step, 4, imgBox.width - x);
        if (e.key === 'ArrowLeft') w = clamp(w - step, 4, imgBox.width - x);
        if (e.key === 'ArrowDown') h = clamp(h + step, 4, imgBox.height - y);
        if (e.key === 'ArrowUp') h = clamp(h - step, 4, imgBox.height - y);
      } else {
        if (e.key === 'ArrowRight') x = clamp(x + step, 0, Math.max(0, imgBox.width - w));
        if (e.key === 'ArrowLeft') x = clamp(x - step, 0, Math.max(0, imgBox.width - w));
        if (e.key === 'ArrowDown') y = clamp(y + step, 0, Math.max(0, imgBox.height - h));
        if (e.key === 'ArrowUp') y = clamp(y - step, 0, Math.max(0, imgBox.height - h));
      }
      currentCrop.sel = { x, y, w, h };
      // Trigger rect update by simulating a lightweight event: re-run setup position function
      const evt = new Event('mousemove');
      window.dispatchEvent(evt);
      return;
    }
    // Space toggles pan
    if (e.key === ' ') {
      e.preventDefault();
      const panBtn = document.querySelector('#image-modal .modal-content button:nth-child(3)');
      if (panBtn) panBtn.click();
      return;
    }
    return; // don't fall-through to global shortcuts when modal is open
  }

  // Ignore when typing in inputs
  if (isTypingTarget(target)) return;

  // Global actions
  if (meta && e.key.toLowerCase() === 'e') { e.preventDefault(); exportToPDF(); return; }
  if (meta && e.key.toLowerCase() === 'm') { e.preventDefault(); exportToMarkdown(); return; }
  if (meta && e.key.toLowerCase() === 'j') { e.preventDefault(); exportToJSON(); return; }
  if (meta && e.key.toLowerCase() === 'n') { e.preventDefault(); createNewSession(); return; }

  // Per-step actions using lastActiveStepIndex
  if (lastActiveStepIndex != null) {
    if (e.key.toLowerCase() === 'c') { e.preventDefault(); startCrop(lastActiveStepIndex); return; }
    if (e.key.toLowerCase() === 'u') { e.preventDefault(); undoCrop(lastActiveStepIndex); return; }
    if (e.altKey && e.key === 'ArrowUp') { e.preventDefault(); moveScreenshot(lastActiveStepIndex, 'up'); return; }
    if (e.altKey && e.key === 'ArrowDown') { e.preventDefault(); moveScreenshot(lastActiveStepIndex, 'down'); return; }
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteScreenshot(lastActiveStepIndex); return; }
  }
}

function openShortcutsModal() {
  const m = document.getElementById('shortcuts-modal');
  if (m) m.classList.add('active');
}
function closeShortcutsModal() {
  const m = document.getElementById('shortcuts-modal');
  if (m) m.classList.remove('active');
}
