document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".options");
  const saveBtn = document.getElementById("save");
  const resetBtn = document.getElementById("reset");
  const statusEl = document.getElementById("status");
  const marginsSelect = document.getElementById("margins");
  const qColorSelect = document.getElementById("q_color");
  const qFgColorSelect = document.getElementById("q_fg_color");

  // Navigation buttons
  const openSidebarBtn = document.getElementById("open-sidebar");
  const openWorkspaceBtn = document.getElementById("open-workspace");
  const openEditorBtn = document.getElementById("open-editor");

  // Handle navigation buttons
  if (openSidebarBtn) {
    openSidebarBtn.addEventListener("click", async () => {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
      });
      if (tab) {
        chrome.sidePanel.open({ windowId: tab.windowId });
      }
    });
  }

  if (openWorkspaceBtn) {
    openWorkspaceBtn.addEventListener("click", () => {
      chrome.tabs.create({
        url: chrome.runtime.getURL("src/editor/editor-standalone.html")
      });
    });
  }

  if (openEditorBtn) {
    openEditorBtn.addEventListener("click", () => {
      chrome.tabs.create({
        url: chrome.runtime.getURL("src/editor/editor-standalone.html")
      });
    });
  }

  // Initialize feature cards
  initializeStorageDisplay();
  initializeAIStatus();
  initializeClickIndicatorToggle();
  
  // Load saved options
  loadOptions();

  // Handle margins sub-options visibility
  marginsSelect.addEventListener("change", () => {
    const subMargins = document.querySelectorAll(".sub-margin");
    subMargins.forEach((el) => {
      el.style.display = marginsSelect.value === "custom" ? "" : "none";
    });
  });

  // Handle color picker visibility
  qColorSelect.addEventListener("change", () => {
    document.getElementById("q_color_picker_row").style.display =
      qColorSelect.value === "custom" ? "" : "none";
  });

  qFgColorSelect.addEventListener("change", () => {
    document.getElementById("q_fg_color_picker_row").style.display =
      qFgColorSelect.value === "custom" ? "" : "none";
  });

  // Save options
  saveBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const options = {};
    const apiKey = form.elements["api_key"].value;

    for (const [key, value] of formData.entries()) {
      if (key !== "api_key") {
        options[key] = value;
      }
    }
    // Ensure capture_mode is stored
    options.capture_mode = form.elements["capture_mode"].value;
    // Handle checkboxes
    form.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      options[checkbox.name] = checkbox.checked;
    });
    // Handle numbers
    form.querySelectorAll('input[type="number"]').forEach((input) => {
      options[input.name] = Number(input.value) || 100;
    });

    // Save API key separately in local storage for security
    if (apiKey) {
      await chrome.storage.local.set({ apiKey });
    }

    await chrome.storage.sync.set({ exportOptions: options });
    showStatus("Saved");
  });

  // Reset to defaults
  resetBtn.addEventListener("click", async () => {
    await chrome.storage.sync.remove("exportOptions");
    loadOptions();
    showStatus("Reset to defaults");
  });

  function loadOptions() {
    // Load export options from sync storage
    chrome.storage.sync.get(["exportOptions"], (result) => {
      const options = result.exportOptions || getDefaults();
      for (const [key, value] of Object.entries(options)) {
        const el = form.elements[key];
        if (el) {
          if (el.type === "checkbox") {
            el.checked = value;
          } else {
            el.value = value;
          }
        }
      }
      // Trigger change events to show/hide sub-options
      marginsSelect.dispatchEvent(new Event("change"));
      qColorSelect.dispatchEvent(new Event("change"));
      qFgColorSelect.dispatchEvent(new Event("change"));
    });

    // Load API key from local storage
    chrome.storage.local.get(["apiKey"], (result) => {
      if (result.apiKey) {
        form.elements["api_key"].value = result.apiKey;
      }
    });
  }

  function getDefaults() {
    return {
      capture_mode: "full",
      theme: "",
      no_questions: false,
      no_icons: false,
      zoom: 100,
      margins: "",
      margin_top: "",
      margin_bottom: "",
      margin_left: "",
      margin_right: "",
      title_mode: "",
      q_color: "default",
      q_color_picker: "#ffffff",
      q_fg_color: "default",
      q_fg_color_picker: "#000000",
      page_break: "",
      toc: "",
      model_name: false
    };
  }

  function showStatus(message) {
    statusEl.textContent = message;
    statusEl.style.display = "inline";
    setTimeout(() => {
      statusEl.style.display = "none";
    }, 2000);
  }

  // Initialize storage display
  function initializeStorageDisplay() {
    function updateDisplay() {
      chrome.storage.local.getBytesInUse(null, (bytes) => {
        const mb = (bytes / (1024 * 1024)).toFixed(2);
        const quota = 10; // Chrome extensions have 10MB quota
        const percentUsed = ((bytes / (quota * 1024 * 1024)) * 100).toFixed(1);
        const freeMB = (quota - mb).toFixed(2);
        
        document.getElementById('storage-used').textContent = `${mb} MB (${percentUsed}%)`;
        document.getElementById('storage-free').textContent = `${freeMB} MB`;
        document.getElementById('storage-bar').style.width = `${percentUsed}%`;
        
        // Change color based on usage
        const bar = document.getElementById('storage-bar');
        if (percentUsed > 90) {
          bar.style.background = '#ef4444'; // Red
        } else if (percentUsed > 70) {
          bar.style.background = '#f59e0b'; // Orange
        } else {
          bar.style.background = 'white'; // White
        }
      });
    }
    
    updateDisplay();
    
    // Delete all sessions button
    const deleteBtn = document.getElementById('delete-all-sessions-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        const confirm = window.confirm(
          'Vil du slette ALLE lagrede sessions?\n\n' +
          'Dette vil frigjøre plass men kan ikke angres!'
        );
        
        if (!confirm) return;
        
        try {
          await chrome.storage.local.remove(['sessions', 'captures']);
          showStatus('✅ Alle sessions slettet!');
          updateDisplay(); // Refresh storage display
        } catch (error) {
          console.error('Failed to delete sessions:', error);
          showStatus('❌ Feil ved sletting');
        }
      });
      
      // Hover effect
      deleteBtn.addEventListener('mouseenter', () => {
        deleteBtn.style.background = 'rgba(239, 68, 68, 0.9)';
        deleteBtn.style.transform = 'scale(1.02)';
      });
      deleteBtn.addEventListener('mouseleave', () => {
        deleteBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        deleteBtn.style.transform = 'scale(1)';
      });
    }
  }

  // Initialize AI status
  function initializeAIStatus() {
    chrome.storage.local.get(['apiKey'], (result) => {
      const statusText = document.getElementById('ai-status-text');
      const card = document.getElementById('ai-status-card');
      
      if (result.apiKey && result.apiKey.trim() !== '') {
        statusText.innerHTML = '✅ Aktivert';
        card.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      } else {
        statusText.innerHTML = '❌ Ikke konfigurert';
        card.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
      }
    });
    
    // Listen for changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes.apiKey) {
        initializeAIStatus(); // Re-check
      }
    });
  }

  // Initialize click indicator toggle
  function initializeClickIndicatorToggle() {
    const toggle = document.getElementById('show-click-indicator-option');
    
    // Load current setting
    chrome.storage.local.get(['showClickIndicator'], (result) => {
      toggle.checked = result.showClickIndicator !== false; // Default to true
    });
    
    // Save on change
    toggle.addEventListener('change', (e) => {
      chrome.storage.local.set({ showClickIndicator: e.target.checked });
      showStatus(e.target.checked ? 'Klikk-indikator aktivert' : 'Klikk-indikator deaktivert');
    });
  }
});
