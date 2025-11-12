document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".options");
  const saveBtn = document.getElementById("save");
  const resetBtn = document.getElementById("reset");
  const statusEl = document.getElementById("status");
  const marginsSelect = document.getElementById("margins");
  const qColorSelect = document.getElementById("q_color");
  const qFgColorSelect = document.getElementById("q_fg_color");
  const storageProviderSelect = document.getElementById("storage_provider");
  const cloudFileNameInput = document.getElementById("cloud_file_name");
  const dropboxTokenInput = document.getElementById("dropbox_token");
  const dropboxPathInput = document.getElementById("dropbox_path");
  const oneDriveTokenInput = document.getElementById("onedrive_token");
  const oneDrivePathInput = document.getElementById("onedrive_path");
  const gdriveTokenInput = document.getElementById("gdrive_token");
  const gdriveFolderInput = document.getElementById("gdrive_folder_id");
  const gdriveFileInput = document.getElementById("gdrive_file_id");
  const cloudStatusText = document.getElementById("cloud-status-text");
  const cloudStatusHint = document.getElementById("cloud-status-hint");
  const cloudFieldRows = document.querySelectorAll(".cloud-field");
  const apiKeyStatus = document.getElementById("api-key-status");

  const defaultCloudSettings = {
    provider: "local",
    fileName: "iub-recorder-sessions.json",
    dropboxPath: "/Apps/IUB-Recorder",
    oneDrivePath: "/Documents/IUB-Recorder",
    googleDriveFolderId: "",
    googleDriveFileId: ""
  };

  const providerLabels = {
    local: "Local storage",
    dropbox: "Dropbox",
    onedrive: "OneDrive",
    gdrive: "Google Drive"
  };

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

  /**
   * Updates the contextual helper text for the selected cloud provider.
   * @param {string} provider
   */
  function updateCloudHint(provider) {
    if (!cloudStatusHint) return;
    if (provider === "local") {
      cloudStatusHint.textContent =
        "Configure cloud sync below to avoid hitting the Chrome storage quota.";
    } else {
      cloudStatusHint.textContent = `Sessions sync to ${
        providerLabels[provider] || provider
      } once credentials are saved.`;
    }
  }

  /**
   * Toggles visibility of provider-specific configuration fields.
   */
  function updateCloudFields() {
    if (!storageProviderSelect) return;
    const provider = storageProviderSelect.value || "local";
    cloudFieldRows.forEach((row) => {
      const providers = (row.dataset.provider || "")
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      if (provider === "local") {
        row.style.display = "none";
      } else {
        row.style.display = providers.includes(provider) ? "" : "none";
      }
    });
    if (cloudStatusText) {
      if (provider === "local") {
        cloudStatusText.textContent = "Local storage";
        cloudStatusText.dataset.state = "local";
      } else {
        cloudStatusText.textContent = `${
          providerLabels[provider] || provider
        } · Not saved`;
        cloudStatusText.dataset.state = "pending";
      }
    }
    updateCloudHint(provider);
  }

  /**
   * Retrieves sync metadata to inform the user about cloud status.
   */
  function refreshCloudStatus() {
    chrome.storage.sync.get(["cloudStorageSettings"], (syncResult) => {
      chrome.storage.local.get(["cloudStorageMeta"], (localResult) => {
        const settings =
          syncResult.cloudStorageSettings || defaultCloudSettings;
        const meta = localResult.cloudStorageMeta || {};
        const provider = settings.provider || "local";
        if (cloudStatusText) {
          let text = providerLabels[provider] || provider;
          const status =
            meta.status || (provider === "local" ? "local" : "pending");
          if (status === "synced") {
            text += " · Synced";
          } else if (status === "cached") {
            text += " · Up to date";
          } else if (status === "error") {
            text += ` · Error${meta.error ? ` (${meta.error})` : ""}`;
          } else if (provider !== "local") {
            text += " · Ready";
          }
          cloudStatusText.textContent = text;
          cloudStatusText.dataset.state = status;
        }
        updateCloudHint(provider);
      });
    });
  }

  function setApiKeyStatus(hasKey) {
    if (!apiKeyStatus) return;
    apiKeyStatus.dataset.state = hasKey ? "saved" : "missing";
    apiKeyStatus.textContent = hasKey
      ? "Saved locally – AI descriptions enabled."
      : "Missing – enter your key to enable AI features.";
  }

  if (storageProviderSelect) {
    storageProviderSelect.addEventListener("change", () => {
      updateCloudFields();
    });
  }

  updateCloudFields();

  // Initialize feature cards
  initializeStorageDisplay(refreshCloudStatus);
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
      if (
        key === "api_key" ||
        key === "storage_provider" ||
        key.startsWith("cloud_")
      ) {
        continue;
      }
      if (form.elements[key]?.type === "checkbox") {
        options[key] = form.elements[key].checked;
      } else {
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

    const provider = storageProviderSelect
      ? storageProviderSelect.value
      : "local";
    let fileName =
      cloudFileNameInput?.value?.trim() || defaultCloudSettings.fileName;
    if (fileName && !fileName.toLowerCase().endsWith(".json")) {
      fileName = `${fileName}.json`;
    }

    const cloudSettings = {
      provider,
      fileName,
      dropboxPath:
        dropboxPathInput?.value?.trim() || defaultCloudSettings.dropboxPath,
      oneDrivePath:
        oneDrivePathInput?.value?.trim() || defaultCloudSettings.oneDrivePath,
      googleDriveFolderId: gdriveFolderInput?.value?.trim() || "",
      googleDriveFileId: gdriveFileInput?.value?.trim() || ""
    };

    const cloudTokens = {
      dropboxToken: dropboxTokenInput?.value?.trim() || "",
      oneDriveToken: oneDriveTokenInput?.value?.trim() || "",
      googleDriveToken: gdriveTokenInput?.value?.trim() || ""
    };

    // Save API key separately in local storage for security
    await chrome.storage.local.set({ apiKey: apiKey || "" });
    setApiKeyStatus(Boolean(apiKey && apiKey.trim() !== ""));

    await chrome.storage.local.set({ cloudStorageTokens: cloudTokens });
    await chrome.storage.sync.set({
      exportOptions: options,
      cloudStorageSettings: cloudSettings
    });
    showStatus("Saved");
    refreshCloudStatus();
  });

  // Reset to defaults
  resetBtn.addEventListener("click", async () => {
    await chrome.storage.sync.remove("exportOptions");
    loadOptions();
    showStatus("Reset to defaults");
  });

  function loadOptions() {
    // Load export options from sync storage
    chrome.storage.sync.get(
      ["exportOptions", "cloudStorageSettings"],
      (result) => {
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

        const cloudSettings = {
          ...defaultCloudSettings,
          ...(result.cloudStorageSettings || {})
        };
        if (storageProviderSelect) {
          storageProviderSelect.value = cloudSettings.provider || "local";
        }
        if (cloudFileNameInput) {
          cloudFileNameInput.value =
            cloudSettings.fileName || defaultCloudSettings.fileName;
        }
        if (dropboxPathInput) {
          dropboxPathInput.value =
            cloudSettings.dropboxPath || defaultCloudSettings.dropboxPath;
        }
        if (oneDrivePathInput) {
          oneDrivePathInput.value =
            cloudSettings.oneDrivePath || defaultCloudSettings.oneDrivePath;
        }
        if (gdriveFolderInput) {
          gdriveFolderInput.value = cloudSettings.googleDriveFolderId || "";
        }
        if (gdriveFileInput) {
          gdriveFileInput.value = cloudSettings.googleDriveFileId || "";
        }
        updateCloudFields();
        refreshCloudStatus();
      }
    );

    // Load API key from local storage
    chrome.storage.local.get(["apiKey", "cloudStorageTokens"], (result) => {
      if (typeof result.apiKey === "string") {
        form.elements["api_key"].value = result.apiKey;
      }
      setApiKeyStatus(Boolean(result.apiKey && result.apiKey.trim() !== ""));
      const tokens = result.cloudStorageTokens || {};
      if (dropboxTokenInput)
        dropboxTokenInput.value = tokens.dropboxToken || "";
      if (oneDriveTokenInput)
        oneDriveTokenInput.value = tokens.oneDriveToken || "";
      if (gdriveTokenInput)
        gdriveTokenInput.value = tokens.googleDriveToken || "";
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
  function initializeStorageDisplay(onMetaUpdate) {
    function updateDisplay() {
      chrome.storage.local.getBytesInUse(null, (bytes) => {
        const mb = (bytes / (1024 * 1024)).toFixed(2);
        const quota = 10; // Chrome extensions have 10MB quota
        const percentUsed = ((bytes / (quota * 1024 * 1024)) * 100).toFixed(1);
        const freeMB = (quota - mb).toFixed(2);

        document.getElementById("storage-used").textContent =
          `${mb} MB (${percentUsed}%)`;
        document.getElementById("storage-free").textContent = `${freeMB} MB`;
        document.getElementById("storage-bar").style.width = `${percentUsed}%`;

        // Change color based on usage
        const bar = document.getElementById("storage-bar");
        if (percentUsed > 90) {
          bar.style.background = "#ef4444"; // Red
        } else if (percentUsed > 70) {
          bar.style.background = "#f59e0b"; // Orange
        } else {
          bar.style.background = "white"; // White
        }
      });
    }

    updateDisplay();
    if (typeof onMetaUpdate === "function") {
      onMetaUpdate();
    }

    // Delete all sessions button
    const deleteBtn = document.getElementById("delete-all-sessions-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", async () => {
        const confirm = window.confirm(
          "Delete all saved sessions?\n\nThis frees storage but cannot be undone."
        );

        if (!confirm) return;

        try {
          await chrome.storage.local.remove(["sessions", "captures"]);
          showStatus("✅ All sessions deleted");
          updateDisplay(); // Refresh storage display
          if (typeof onMetaUpdate === "function") {
            onMetaUpdate();
          }
        } catch (error) {
          console.error("Failed to delete sessions:", error);
          showStatus("❌ Delete failed");
        }
      });

      // Hover effect
      deleteBtn.addEventListener("mouseenter", () => {
        deleteBtn.style.background = "rgba(239, 68, 68, 0.9)";
        deleteBtn.style.transform = "scale(1.02)";
      });
      deleteBtn.addEventListener("mouseleave", () => {
        deleteBtn.style.background = "rgba(255, 255, 255, 0.2)";
        deleteBtn.style.transform = "scale(1)";
      });
    }
  }

  // Initialize AI status
  function initializeAIStatus() {
    chrome.storage.local.get(["apiKey"], (result) => {
      const statusText = document.getElementById("ai-status-text");
      const card = document.getElementById("ai-status-card");

      if (result.apiKey && result.apiKey.trim() !== "") {
        statusText.innerHTML = "✅ Enabled";
        card.style.background =
          "linear-gradient(135deg, #10b981 0%, #059669 100%)";
        setApiKeyStatus(true);
      } else {
        statusText.innerHTML = "❌ Not configured";
        card.style.background =
          "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";
        setApiKeyStatus(false);
      }
    });

    // Listen for changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === "local" && changes.apiKey) {
        initializeAIStatus(); // Re-check
      }
    });
  }

  // Initialize click indicator toggle
  function initializeClickIndicatorToggle() {
    const toggle = document.getElementById("show-click-indicator-option");

    // Load current setting
    chrome.storage.local.get(["showClickIndicator"], (result) => {
      toggle.checked = result.showClickIndicator !== false; // Default to true
    });

    // Save on change
    toggle.addEventListener("change", (e) => {
      chrome.storage.local.set({ showClickIndicator: e.target.checked });
      showStatus(
        e.target.checked
          ? "Click indicator enabled"
          : "Click indicator disabled"
      );
    });
  }
});
