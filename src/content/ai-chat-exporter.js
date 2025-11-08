/**
 * AI Chat Exporter Content Script
 *
 * Injects contextual export and settings controls for the supported AI chat
 * platforms. The script is intentionally dependency-free so it can be served as
 * a content script inside Chromium based browsers without additional bundles.
 */
(function () {
  "use strict";

  // --- Lightweight i18n (EN/NO) ---
  const I18N = {
    en: {
      export: "Export",
      exporting: "Exporting...",
      exported_ok: "Exported! ✅",
      export_failed_alert: "Export failed. Please try again.",
      export_settings: "Export Settings",
      save_export: "Save & Export",
      cancel: "Cancel",
      export_format_label: "Export Format",
      conversation_scope_label: "Conversation Scope",
      include_from_label: "Include Messages From",
      toolbar_mode_label: "Toolbar Mode",
      toolbar_always: "Always floating (default)",
      toolbar_prefer_header: "Prefer header, fallback to floating",
      toolbar_header_only: "Header only (no floating)",
      toolbar_show_toggle: "Show floating toolbar",
      toolbar_move: "Move toolbar position",
      timestamps_label: "Include timestamps",
      codeblocks_label: "Include code blocks",
      scope_all: "Entire conversation",
      scope_last: "Only last message",
      scope_recent: "Last 10 messages",
      role_both: "Both me and AI",
      role_assistant: "AI answers only",
      role_user: "My messages only",
      md_platform: "Platform",
      md_exported: "Exported",
      md_messages: "Messages",
      md_scope: "Scope",
      md_includes: "Includes",
      md_user: "User",
      md_ai: "AI Assistant",
      md_code_removed: "[Code block removed]",
      md_exported_with: "Exported with IUB v3.0.0",
      export_button_tooltip: "Export conversation",
      settings_tooltip: "Open export settings"
    },
    no: {
      export: "Eksporter",
      exporting: "Eksporterer...",
      exported_ok: "Eksportert! ✅",
      export_failed_alert: "Eksport feilet. Vennligst prøv igjen.",
      export_settings: "Eksportinnstillinger",
      save_export: "Lagre & Eksporter",
      cancel: "Avbryt",
      export_format_label: "Eksportformat",
      conversation_scope_label: "Samtaleomfang",
      include_from_label: "Inkluder meldinger fra",
      toolbar_mode_label: "Verktøylinje-modus",
      toolbar_always: "Alltid flytende (standard)",
      toolbar_prefer_header: "Foretrekk header, fallback til flytende",
      toolbar_header_only: "Kun header (ikke flytende)",
      toolbar_show_toggle: "Vis flytende verktøylinje",
      toolbar_move: "Flytt verktøylinje",
      timestamps_label: "Inkluder tidsstempler",
      codeblocks_label: "Inkluder kodeblokker",
      scope_all: "Hele samtalen",
      scope_last: "Kun siste melding",
      scope_recent: "Siste 10 meldinger",
      role_both: "Både meg og AI",
      role_assistant: "Kun AI svar",
      role_user: "Kun mine meldinger",
      md_platform: "Plattform",
      md_exported: "Eksportert",
      md_messages: "Meldinger",
      md_scope: "Omfang",
      md_includes: "Inkluderer",
      md_user: "Bruker",
      md_ai: "AI Assistent",
      md_code_removed: "[Kodeblokk fjernet]",
      md_exported_with: "Eksportert med IUB v3.0.0",
      export_button_tooltip: "Eksporter samtale",
      settings_tooltip: "Åpne eksportinnstillinger"
    }
  };

  /** @type {Array<{id: string, hosts: string[], containerSelectors: string[]}>} */
  const PLATFORM_CONFIG = [
    {
      id: "chatgpt",
      hosts: ["chatgpt.com", "chat.openai.com"],
      containerSelectors: ["header nav", 'header div[class*="flex"]']
    },
    {
      id: "gemini",
      hosts: ["gemini.google.com"],
      containerSelectors: [
        "header",
        'div[role="banner"]',
        'div[role="navigation"]',
        'div[aria-label*="header"]',
        "div[data-header]",
        'div[class*="Header" i]',
        'div[class*="Topbar" i]'
      ]
    },
    {
      id: "deepseek",
      hosts: ["deepseek.com"],
      containerSelectors: [
        "header",
        "nav",
        'div[class*="header" i]',
        'div[class*="top" i]',
        'div[class*="navbar" i]',
        'div[class*="nav" i]'
      ]
    },
    {
      id: "copilot",
      hosts: ["copilot.microsoft.com", "bing.com"],
      containerSelectors: ["header", 'div[class*="header"]']
    },
    {
      id: "perplexity",
      hosts: ["perplexity.ai", "www.perplexity.ai"],
      containerSelectors: [
        "header",
        "nav",
        'div[class*="header" i]',
        'div[class*="topbar" i]'
      ]
    },
    {
      id: "claude",
      hosts: ["claude.ai"],
      containerSelectors: [
        "header",
        "nav",
        'div[class*="header" i]',
        'div[class*="topbar" i]'
      ]
    },
    {
      id: "grok",
      hosts: ["x.ai", "www.x.ai"],
      containerSelectors: ["header", "nav", '[data-testid*="header"]']
    }
  ];
  let __lang = "en";

  /**
   * Hydrates the localized language preference from storage.
   */
  function getLang() {
    try {
      chrome.storage?.local.get(["lang"], (res) => {
        __lang =
          res?.lang ||
          (navigator.language?.toLowerCase().startsWith("no") ? "no" : "en");
      });
    } catch {
      __lang = navigator.language?.toLowerCase().startsWith("no") ? "no" : "en";
    }
  }
  function t(key) {
    return (I18N[__lang] && I18N[__lang][key]) || I18N.en[key] || key;
  }
  getLang();

  // Detect which AI platform we're on
  const platformConfig = detectPlatform();
  if (!platformConfig) {
    console.warn("AI Chat Exporter: Unsupported platform, skipping inject");
    return;
  }

  const platform = platformConfig.id;
  console.log(`AI Chat Exporter: Detected ${platform}`);

  const DEFAULT_TOOLBAR_MODE = "always"; // 'always' | 'prefer-header' | 'header-only'
  const DEFAULT_TOOLBAR_VISIBILITY = true;
  let toolbarMode = DEFAULT_TOOLBAR_MODE;
  let floatingToolbarEnabled = DEFAULT_TOOLBAR_VISIBILITY;

  // Initialize exporter (load settings first)
  chrome.storage?.local.get(["exportSettings"], (res) => {
    const s = res?.exportSettings || {};
    const storedMode = validateToolbarMode(s.toolbarMode);
    toolbarMode = storedMode || DEFAULT_TOOLBAR_MODE;
    floatingToolbarEnabled =
      typeof s.floatingToolbarEnabled === "boolean"
        ? s.floatingToolbarEnabled
        : DEFAULT_TOOLBAR_VISIBILITY;
    if (!floatingToolbarEnabled) {
      document.querySelector(".iub-floating-toolbar")?.remove();
    }
    initializeExporter(platformConfig);
  });

  /**
   * Resolves the platform configuration based on the active hostname.
   * @returns {{id: string, hosts: string[], containerSelectors: string[]} | null}
   */
  function detectPlatform() {
    const hostname = window.location.hostname;
    return (
      PLATFORM_CONFIG.find((platform) =>
        platform.hosts.some((host) => hostname.includes(host))
      ) || null
    );
  }

  /**
   * Creates a throttled version of a function to limit execution frequency.
   * @param {Function} func
   * @param {number} wait
   * @returns {Function}
   */
  function throttle(func, wait) {
    let timeout = null;
    let lastRan = 0;
    return function (...args) {
      const now = Date.now();
      if (now - lastRan >= wait) {
        func.apply(this, args);
        lastRan = now;
      } else {
        clearTimeout(timeout);
        timeout = setTimeout(
          () => {
            func.apply(this, args);
            lastRan = Date.now();
          },
          wait - (now - lastRan)
        );
      }
    };
  }

  /**
   * Validates that a stored toolbar mode value is supported.
   * @param {string|undefined} mode
   * @returns {"always"|"prefer-header"|"header-only"|null}
   */
  function validateToolbarMode(mode) {
    const allowed = ["always", "prefer-header", "header-only"];
    return typeof mode === "string" && allowed.includes(mode) ? mode : null;
  }

  /**
   * Bootstraps the exporter on the detected platform by wiring up DOM
   * listeners and rendering buttons.
   * @param {{id: string, containerSelectors: string[]}} platformConfig
   */
  function initializeExporter(platformConfig) {
    const platform = platformConfig.id;
    const safeRender = () => {
      try {
        addExportButtons(platformConfig);
      } catch (error) {
        console.error("AI Chat Exporter: Failed to render controls", error);
      }
    };

    // Wait for page to load before injecting
    const init = () => safeRender();
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
      init();
    }

    // Watch for navigation changes (SPA) with throttled updates
    const startObserver = () => {
      const target = document.body || document.documentElement;
      if (!target) return;

      // Throttle button updates to once per 2 seconds maximum
      const throttledUpdate = throttle(safeRender, 2000);

      // Only observe header/nav area, not entire page
      const observeTarget =
        findButtonContainer(platformConfig) ||
        document.querySelector('header, nav, [role="banner"]') ||
        target;

      // Validate observeTarget is a valid Node before observing
      if (!observeTarget || !(observeTarget instanceof Node)) {
        console.warn(
          "AI Chat Exporter: Invalid observe target, skipping MutationObserver"
        );
        return;
      }

      const observer = new MutationObserver((mutations) => {
        // Only update if significant changes detected (new buttons/nav elements)
        const hasSignificantChange = mutations.some(
          (m) =>
            m.addedNodes.length > 0 &&
            Array.from(m.addedNodes).some(
              (node) =>
                node.nodeType === 1 &&
                (node.tagName === "BUTTON" ||
                  node.tagName === "NAV" ||
                  node.tagName === "HEADER")
            )
        );

        if (hasSignificantChange) {
          throttledUpdate();
        }
      });

      observer.observe(observeTarget, {
        childList: true,
        subtree: true
      });

      // Cleanup on page unload
      window.addEventListener(
        "beforeunload",
        () => {
          observer.disconnect();
        },
        { once: true }
      );
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", startObserver, {
        once: true
      });
    } else {
      startObserver();
    }
  }

  /**
   * Renders toolbar buttons on the detected platform.
   * @param {{id: string, containerSelectors: string[]}} platformConfig
   */
  function addExportButtons(platformConfig) {
    const platform = platformConfig.id;
    // Remove existing buttons
    document
      .querySelectorAll(".iub-export-button, .iub-settings-button")
      .forEach((el) => el.remove());

    // Find appropriate container based on platform
    const container = findButtonContainer(platformConfig);
    const showFloating = shouldShowFloating(container);
    const floating = showFloating ? ensureFloatingToolbar(platform) : null;
    if (!showFloating) {
      document.querySelector(".iub-floating-toolbar")?.remove();
    }

    // Create button container
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "iub-button-container";
    buttonContainer.style.cssText = `
      display: flex;
      gap: 8px;
      align-items: center;
      margin-left: 12px;
    `;
    // Create Export/Settings buttons for container
    if (container) {
      const ctn = buttonContainer.cloneNode(false);
      ctn.className = "iub-button-container";
      ctn.style.cssText = buttonContainer.style.cssText;
      const exportButton1 = createExportButton(platform);
      const settingsButton1 = createSettingsButton();
      ctn.appendChild(exportButton1);
      ctn.appendChild(settingsButton1);
      container.appendChild(ctn);
    }

    // Also render into floating toolbar based on mode
    if (floating) {
      floating
        .querySelectorAll(".iub-button-container")
        .forEach((n) => n.remove());
      const exportButton2 = createExportButton(platform);
      const settingsButton2 = createSettingsButton();
      buttonContainer.appendChild(exportButton2);
      buttonContainer.appendChild(settingsButton2);
      floating.appendChild(buttonContainer);
    }
  }

  /**
   * Determines the inline container that should host the extension buttons.
   * @param {{containerSelectors: string[]}} platformConfig
   * @returns {Element|null}
   */
  function findButtonContainer(platformConfig) {
    const selectors = Array.isArray(platformConfig?.containerSelectors)
      ? platformConfig.containerSelectors
      : [];

    for (const selector of selectors) {
      if (!selector) continue;
      const containers = document.querySelectorAll(selector);
      if (containers.length) {
        return containers[containers.length - 1];
      }
    }

    return null;
  }

  /**
   * Ensures a floating toolbar is present for the current page.
   * @param {string} platform
   * @returns {HTMLElement|null}
   */
  function ensureFloatingToolbar(platform) {
    if (!document.body) return null;
    let floating = document.querySelector(".iub-floating-toolbar");
    if (!floating) {
      floating = document.createElement("div");
      floating.className = "iub-floating-toolbar";
      floating.style.cssText = baseToolbarStyle();
      document.body.appendChild(floating);
    }

    // Ensure Fix Visibility button exists
    if (!floating.querySelector(".iub-fix-visibility")) {
      const fixBtn = createFixButton(platform, floating);
      floating.appendChild(fixBtn);
    }

    // Load and apply saved position
    applySavedToolbarPosition(platform, floating);
    return floating;
  }

  /**
   * Determines whether the floating toolbar should be rendered.
   * @param {Element|null} container
   * @returns {boolean}
   */
  function shouldShowFloating(container) {
    if (!floatingToolbarEnabled) {
      return false;
    }
    // Decide based on toolbarMode
    switch (toolbarMode) {
      case "header-only":
        return false;
      case "prefer-header":
        return !container;
      case "always":
      default:
        return true;
    }
  }

  function baseToolbarStyle() {
    return `
      position: fixed;
      top: 10px;
      right: 10px;
      display: flex;
      gap: 8px;
      z-index: 2147483647;
      background: rgba(255,255,255,0.9);
      backdrop-filter: blur(8px);
      padding: 8px;
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      border: 1px solid rgba(0,0,0,0.08);
    `;
  }

  /**
   * Generates the toolbar pin/move control.
   * @param {string} platform
   * @param {HTMLElement} toolbar
   * @returns {HTMLButtonElement}
   */
  function createFixButton(platform, toolbar) {
    const btn = document.createElement("button");
    btn.className = "iub-fix-visibility";
    const label = t("toolbar_move");
    btn.title = label;
    btn.setAttribute("aria-label", label);
    btn.innerText = "📌";
    btn.style.cssText = `
      width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center;
      background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer;
    `;

    const positions = [
      "top-right",
      "top-left",
      "bottom-right",
      "bottom-left",
      "middle-right"
    ];

    btn.addEventListener("click", () => {
      getToolbarPositions((map) => {
        const current = map[platform] || "top-right";
        const next =
          positions[(positions.indexOf(current) + 1) % positions.length];
        map[platform] = next;
        setToolbarPositions(map, () => applyToolbarPosition(toolbar, next));
      });
    });
    return btn;
  }

  function applySavedToolbarPosition(platform, toolbar) {
    getToolbarPositions((map) => {
      const pos = map[platform] || "top-right";
      applyToolbarPosition(toolbar, pos);
    });
  }

  /**
   * Applies the saved toolbar position to the floating toolbar element.
   * @param {HTMLElement} toolbar
   * @param {string} pos
   */
  function applyToolbarPosition(toolbar, pos) {
    // Reset positional styles
    toolbar.style.top =
      toolbar.style.right =
      toolbar.style.bottom =
      toolbar.style.left =
        "";
    toolbar.style.transform = "";
    switch (pos) {
      case "top-left":
        toolbar.style.top = "10px";
        toolbar.style.left = "10px";
        break;
      case "bottom-right":
        toolbar.style.bottom = "10px";
        toolbar.style.right = "10px";
        break;
      case "bottom-left":
        toolbar.style.bottom = "10px";
        toolbar.style.left = "10px";
        break;
      case "middle-right":
        toolbar.style.top = "50%";
        toolbar.style.right = "10px";
        toolbar.style.transform = "translateY(-50%)";
        break;
      case "top-right":
      default:
        toolbar.style.top = "10px";
        toolbar.style.right = "10px";
        break;
    }
  }

  /**
   * Retrieves the persisted toolbar positions.
   * @param {(map: Record<string, string>) => void} cb
   */
  function getToolbarPositions(cb) {
    try {
      chrome.storage?.local.get(["iubToolbarPositions"], (res) => {
        cb(res.iubToolbarPositions || {});
      });
    } catch {
      cb({});
    }
  }

  /**
   * Stores the toolbar position for all platforms.
   * @param {Record<string, string>} map
   * @param {Function} cb
   */
  function setToolbarPositions(map, cb) {
    try {
      chrome.storage?.local.set({ iubToolbarPositions: map }, cb);
    } catch {
      cb && cb();
    }
  }

  /**
   * Builds the platform export button element.
   * @param {string} platform
   * @returns {HTMLButtonElement}
   */
  function createExportButton(platform) {
    const button = document.createElement("button");
    button.className = "iub-export-button";
    const tooltip = t("export_button_tooltip");
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      <span>${t("export")}</span>
    `;
    button.title = tooltip;
    button.setAttribute("aria-label", tooltip);

    button.style.cssText = `
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    `;

    button.addEventListener("mouseenter", () => {
      button.style.transform = "translateY(-2px)";
      button.style.boxShadow = "0 6px 16px rgba(102, 126, 234, 0.4)";
      button.style.background =
        "linear-gradient(135deg, #764ba2 0%, #667eea 100%)";
    });

    button.addEventListener("mouseleave", () => {
      button.style.transform = "translateY(0)";
      button.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.3)";
      button.style.background =
        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
    });

    button.addEventListener("click", () => exportChat(platform));

    return button;
  }

  /**
   * Builds the settings button element for quick configuration access.
   * @returns {HTMLButtonElement}
   */
  function createSettingsButton() {
    const button = document.createElement("button");
    button.className = "iub-settings-button";
    const tooltip = t("settings_tooltip");
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M12 1v6m0 6v6m-6-6h6m6 0h-6M4.22 4.22l4.24 4.24m7.08 7.08l4.24 4.24M19.78 4.22l-4.24 4.24m-7.08 7.08l-4.24 4.24"></path>
      </svg>
    `;
    button.title = tooltip;
    button.setAttribute("aria-label", tooltip);

    button.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      color: #667eea;
      border: 2px solid rgba(102, 126, 234, 0.3);
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    `;

    button.addEventListener("mouseenter", () => {
      button.style.transform = "rotate(90deg) scale(1.1)";
      button.style.background = "rgba(102, 126, 234, 0.2)";
      button.style.borderColor = "#667eea";
    });

    button.addEventListener("mouseleave", () => {
      button.style.transform = "rotate(0deg) scale(1)";
      button.style.background = "rgba(255, 255, 255, 0.1)";
      button.style.borderColor = "rgba(102, 126, 234, 0.3)";
    });

    button.addEventListener("click", () => showSettingsModal());

    return button;
  }

  /**
   * Presents the settings modal before exporting a conversation.
   * @param {string} platform
   */
  function exportChat(platform) {
    // Show settings modal instead of direct export
    showSettingsModal();
  }

  /**
   * Executes the export using the selected settings.
   * @param {string} platform
   * @param {{
   *   format: string,
   *   scope: string,
   *   includeRole: string,
   *   includeTimestamps: boolean,
   *   includeCodeBlocks: boolean,
   *   toolbarMode?: string,
   *   floatingToolbarEnabled?: boolean
   * }} settings
   */
  function exportChatWithSettings(platform, settings) {
    const button = document.querySelector(".iub-export-button");
    const originalHTML = button ? button.innerHTML : "";

    if (button) {
      button.innerHTML = `
        <svg class="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
        </svg>
        <span>${t("exporting")}</span>
      `;
      button.disabled = true;
    }

    // Add spin animation
    const style = document.createElement("style");
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .animate-spin {
        animation: spin 1s linear infinite;
      }
    `;
    document.head.appendChild(style);

    // Extract chat content based on platform and settings
    setTimeout(() => {
      try {
        const content = extractChatContent(platform, settings);

        if (settings.format === "pdf") {
          // Route to exporter page: persist payload then open extension page
          const payload = { ...content, platform, settings };
          chrome.storage.local.set({ chatExportPayload: payload }, () => {
            // Prefer background to open a new tab to avoid popup blockers
            chrome.runtime.sendMessage({ action: "openChatExporter" }, () => {
              // Fallback if no background listener
              const url = chrome.runtime.getURL(
                "src/exporter/chat-exporter.html"
              );
              try {
                window.open(url, "_blank");
              } catch (_) {}
            });
          });
        } else {
          // Default: Markdown download in-page
          downloadMarkdown(content, platform, settings);
        }

        if (button) {
          button.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>${t("exported_ok")}</span>
          `;
          setTimeout(() => {
            button.innerHTML = originalHTML;
            button.disabled = false;
          }, 2000);
        }
      } catch (error) {
        console.error("Export failed:", error);
        if (button) {
          button.innerHTML = originalHTML;
          button.disabled = false;
        }
        alert(t("export_failed_alert"));
      }
    }, 500);
  }

  /**
   * Extracts chat metadata and message payloads from the active DOM.
   * @param {string} platform
   * @param {{scope: string, includeRole: string, includeTimestamps: boolean, includeCodeBlocks: boolean}} settings
   * @returns {{title: string, messages: Array<{role: string, content: string, timestamp: string}>}}
   */
  function extractChatContent(platform, settings) {
    let messages = [];
    let title = document.title?.trim() || "AI Chat Export";

    switch (platform) {
      case "chatgpt":
        title =
          document.querySelector("h1")?.textContent || "ChatGPT Conversation";
        const chatgptMessages = document.querySelectorAll(
          "[data-message-author-role]"
        );
        chatgptMessages.forEach((msg) => {
          const role = msg.getAttribute("data-message-author-role");
          const content =
            msg.querySelector(".markdown, .whitespace-pre-wrap")?.textContent ||
            "";
          const timestamp =
            msg.querySelector("time")?.getAttribute("datetime") ||
            new Date().toISOString();
          if (content) {
            messages.push({ role, content, timestamp });
          }
        });
        break;

      case "gemini":
        const geminiMessages = document.querySelectorAll(
          '[data-test-id*="conversation-turn"], .conversation-turn'
        );
        geminiMessages.forEach((msg) => {
          const isUser =
            msg.querySelector('[data-test-id="user-message"]') ||
            msg.classList.contains("user-turn");
          const role = isUser ? "user" : "assistant";
          const content = msg.textContent?.trim() || "";
          const timestamp = new Date().toISOString();
          if (content) {
            messages.push({ role, content, timestamp });
          }
        });
        break;

      case "deepseek":
        const deepseekMessages = document.querySelectorAll(
          '.message, [class*="message"]'
        );
        deepseekMessages.forEach((msg) => {
          const isUser =
            msg.classList.contains("user") || msg.querySelector(".user");
          const role = isUser ? "user" : "assistant";
          const content = msg.textContent?.trim() || "";
          const timestamp = new Date().toISOString();
          if (content) {
            messages.push({ role, content, timestamp });
          }
        });
        break;

      case "copilot":
        const copilotMessages = document.querySelectorAll(
          '[class*="message"], .chat-turn'
        );
        copilotMessages.forEach((msg) => {
          const isUser =
            msg.classList.contains("user") ||
            msg.getAttribute("data-author") === "user";
          const role = isUser ? "user" : "assistant";
          const content = msg.textContent?.trim() || "";
          const timestamp = new Date().toISOString();
          if (content) {
            messages.push({ role, content, timestamp });
          }
        });
        break;

      case "perplexity":
        title =
          document
            .querySelector('[data-testid="chat-title"], header h1')
            ?.textContent?.trim() || "Perplexity Conversation";
        document
          .querySelectorAll(
            '[data-testid*="message"], article[data-testid*="response"], main article'
          )
          .forEach((msg) => {
            const testId = msg.getAttribute("data-testid") || "";
            const isUser =
              testId.includes("user") ||
              msg.classList.contains("user") ||
              msg.querySelector('[data-testid*="user"]');
            const role = isUser ? "user" : "assistant";
            const content = msg.textContent?.trim() || "";
            const timestamp = new Date().toISOString();
            if (content) {
              messages.push({ role, content, timestamp });
            }
          });
        break;

      case "claude":
        title =
          document.querySelector("header h1")?.textContent?.trim() ||
          "Claude Conversation";
        document
          .querySelectorAll(
            '[data-testid*="message"], .conversation-message, main article'
          )
          .forEach((msg) => {
            const roleAttr = msg.getAttribute("data-testid") || "";
            const isUser =
              roleAttr.includes("user") ||
              msg.classList.contains("user") ||
              msg.querySelector('[data-testid*="user"]');
            const role = isUser ? "user" : "assistant";
            const content = msg.textContent?.trim() || "";
            const timestamp = new Date().toISOString();
            if (content) {
              messages.push({ role, content, timestamp });
            }
          });
        break;

      case "grok":
        title = document.title || "Grok Conversation";
        document
          .querySelectorAll('[data-testid*="message"], article, .chat-message')
          .forEach((msg) => {
            const roleAttr = msg.getAttribute("data-testid") || "";
            const isUser =
              roleAttr.includes("user") ||
              msg.classList.contains("user") ||
              msg.querySelector('[data-testid*="user"]');
            const role = isUser ? "user" : "assistant";
            const content = msg.textContent?.trim() || "";
            const timestamp = new Date().toISOString();
            if (content) {
              messages.push({ role, content, timestamp });
            }
          });
        break;

      default:
        // Fallback extractor for future chat layouts
        document
          .querySelectorAll('main article, main section, [class*="message" i]')
          .forEach((msg) => {
            const isUser =
              msg.classList.contains("user") ||
              msg.getAttribute("data-author") === "user" ||
              msg.getAttribute("data-role") === "user";
            const role = isUser ? "user" : "assistant";
            const content = msg.textContent?.trim() || "";
            const timestamp = new Date().toISOString();
            if (content) {
              messages.push({ role, content, timestamp });
            }
          });
        break;
    }

    // Apply scope filter
    if (settings.scope === "last") {
      messages = messages.slice(-1);
    } else if (settings.scope === "recent") {
      messages = messages.slice(-10);
    }

    // Apply role filter
    if (settings.includeRole === "assistant") {
      messages = messages.filter((msg) => msg.role === "assistant");
    } else if (settings.includeRole === "user") {
      messages = messages.filter((msg) => msg.role === "user");
    }

    return { title, messages };
  }

  /**
   * Persists the exported chat as a Markdown file.
   * @param {{title: string, messages: Array<{role: string, content: string, timestamp: string}>}} data
   * @param {string} platform
   * @param {{scope: string, includeRole: string, includeTimestamps: boolean, includeCodeBlocks: boolean}} settings
   */
  function downloadMarkdown(data, platform, settings) {
    const { title, messages } = data;

    // Create markdown content
    let markdown = `# ${title}\n\n`;
    markdown += `**Platform:** ${platform.charAt(0).toUpperCase() + platform.slice(1)}\n`;
    markdown += `**${t("md_exported")}:** ${new Date().toLocaleString(__lang === "no" ? "no-NO" : "en-GB")}\n`;
    markdown += `**${t("md_messages")}:** ${messages.length}\n`;

    // Add scope info
    const scopeLabels = {
      all: t("scope_all"),
      last: t("scope_last"),
      recent: t("scope_recent")
    };
    markdown += `**${t("md_scope")}:** ${scopeLabels[settings.scope]}\n`;

    // Add role filter info
    const roleLabels = {
      both: t("role_both"),
      assistant: t("role_assistant"),
      user: t("role_user")
    };
    markdown += `**${t("md_includes")}:** ${roleLabels[settings.includeRole]}\n\n`;
    markdown += `---\n\n`;

    messages.forEach((msg, idx) => {
      const emoji = msg.role === "user" ? "👤" : "🤖";
      const label = msg.role === "user" ? t("md_user") : t("md_ai");

      markdown += `## ${emoji} ${label}`;

      // Add timestamp if enabled
      if (settings.includeTimestamps && msg.timestamp) {
        const date = new Date(msg.timestamp);
        markdown += ` - ${date.toLocaleString(__lang === "no" ? "no-NO" : "en-GB")}`;
      }

      markdown += `\n\n`;

      // Process content
      let content = msg.content;

      // Handle code blocks if enabled
      if (settings.includeCodeBlocks) {
        // Keep code blocks as-is
        markdown += `${content}\n\n`;
      } else {
        // Remove code blocks
        content = content.replace(/```[\s\S]*?```/g, t("md_code_removed"));
        markdown += `${content}\n\n`;
      }

      markdown += `---\n\n`;
    });

    // Add footer
    markdown += `\n\n*${t("md_exported_with")}*\n`;

    // Download file
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const filename = `${title.replace(/[^a-z0-9]/gi, "_")}_${Date.now()}.md`;

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  }

  /**
   * Renders the export configuration modal dialog.
   */
  function showSettingsModal() {
    // Remove existing modal
    document.querySelector(".iub-settings-modal")?.remove();

    // Load saved settings
    chrome.storage.local.get(["exportSettings"], (result) => {
      const stored = result.exportSettings || {};
      const settings = {
        format: stored.format || "markdown",
        scope: stored.scope || "all",
        includeRole: stored.includeRole || "both",
        includeTimestamps:
          typeof stored.includeTimestamps === "boolean"
            ? stored.includeTimestamps
            : true,
        includeCodeBlocks:
          typeof stored.includeCodeBlocks === "boolean"
            ? stored.includeCodeBlocks
            : true,
        toolbarMode: validateToolbarMode(stored.toolbarMode) || toolbarMode,
        floatingToolbarEnabled:
          typeof stored.floatingToolbarEnabled === "boolean"
            ? stored.floatingToolbarEnabled
            : DEFAULT_TOOLBAR_VISIBILITY
      };

      // Create modal
      const modal = document.createElement("div");
      modal.className = "iub-settings-modal";
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(5px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        animation: fadeIn 0.3s ease;
      `;

      modal.innerHTML = `
        <div style="
          background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
          border-radius: 20px;
          padding: 32px;
          max-width: 550px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideIn 0.3s ease;
          max-height: 90vh;
          overflow-y: auto;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
            <h2 style="margin: 0; font-size: 24px; font-weight: 600; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
              🎯 ${t("export_settings")}
            </h2>
            <button class="close-modal" style="
              background: none;
              border: none;
              font-size: 28px;
              cursor: pointer;
              color: #999;
              line-height: 1;
              padding: 0;
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 8px;
              transition: all 0.2s;
            ">&times;</button>
          </div>

          <!-- Export Format -->
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #334155; font-size: 15px;">
              📄 ${t("export_format_label")}
            </label>
            <select id="export-format" style="
              width: 100%;
              padding: 12px;
              border: 2px solid #e2e8f0;
              border-radius: 10px;
              font-size: 14px;
              font-family: inherit;
              transition: all 0.2s;
              cursor: pointer;
            ">
              <option value="markdown" ${settings.format === "markdown" ? "selected" : ""}>📝 Markdown (.md)</option>
              <option value="pdf" ${settings.format === "pdf" ? "selected" : ""}>📄 PDF (.pdf)</option>
              <option value="json" disabled>📊 JSON (Coming Soon)</option>
            </select>
          </div>

          <!-- Conversation Scope -->
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #334155; font-size: 15px;">
              💬 ${t("conversation_scope_label")}
            </label>
            <select id="export-scope" style="
              width: 100%;
              padding: 12px;
              border: 2px solid #e2e8f0;
              border-radius: 10px;
              font-size: 14px;
              font-family: inherit;
              transition: all 0.2s;
              cursor: pointer;
            ">
              <option value="all" ${settings.scope === "all" ? "selected" : ""}>📚 ${t("scope_all")}</option>
              <option value="last" ${settings.scope === "last" ? "selected" : ""}>💬 ${t("scope_last")}</option>
              <option value="recent" ${settings.scope === "recent" ? "selected" : ""}>🕐 ${t("scope_recent")}</option>
            </select>
          </div>

          <!-- Include Role -->
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #334155; font-size: 15px;">
              👥 ${t("include_from_label")}
            </label>
            <select id="include-role" style="
              width: 100%;
              padding: 12px;
              border: 2px solid #e2e8f0;
              border-radius: 10px;
              font-size: 14px;
              font-family: inherit;
              transition: all 0.2s;
              cursor: pointer;
            ">
              <option value="both" ${settings.includeRole === "both" ? "selected" : ""}>👤🤖 ${t("role_both")}</option>
              <option value="assistant" ${settings.includeRole === "assistant" ? "selected" : ""}>🤖 ${t("role_assistant")}</option>
              <option value="user" ${settings.includeRole === "user" ? "selected" : ""}>👤 ${t("role_user")}</option>
            </select>
          </div>

          <!-- Toolbar Mode -->
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #334155; font-size: 15px;">
              🧭 ${t("toolbar_mode_label")}
            </label>
            <select id="toolbar-mode" style="
              width: 100%;
              padding: 12px;
              border: 2px solid #e2e8f0;
              border-radius: 10px;
              font-size: 14px;
              font-family: inherit;
              transition: all 0.2s;
              cursor: pointer;
            ">
              <option value="always" ${settings.toolbarMode === "always" ? "selected" : ""}>${t("toolbar_always")}</option>
              <option value="prefer-header" ${settings.toolbarMode === "prefer-header" ? "selected" : ""}>${t("toolbar_prefer_header")}</option>
              <option value="header-only" ${settings.toolbarMode === "header-only" ? "selected" : ""}>${t("toolbar_header_only")}</option>
            </select>
          </div>

          <!-- Checkboxes -->
          <div style="margin-bottom: 16px; padding: 16px; background: #f8fafc; border-radius: 10px;">
            <label style="display: flex; align-items: center; cursor: pointer; margin-bottom: 12px;">
              <input type="checkbox" id="floating-toolbar-toggle" ${settings.floatingToolbarEnabled ? "checked" : ""} style="
                width: 20px;
                height: 20px;
                margin-right: 12px;
                cursor: pointer;
                accent-color: #667eea;
              ">
              <span style="font-size: 14px; color: #334155; font-weight: 500;">🧰 ${t("toolbar_show_toggle")}</span>
            </label>

            <label style="display: flex; align-items: center; cursor: pointer; margin-bottom: 12px;">
              <input type="checkbox" id="include-timestamps" ${settings.includeTimestamps ? "checked" : ""} style="
                width: 20px;
                height: 20px;
                margin-right: 12px;
                cursor: pointer;
                accent-color: #667eea;
              ">
              <span style="font-size: 14px; color: #334155; font-weight: 500;">🕐 ${t("timestamps_label")}</span>
            </label>

            <label style="display: flex; align-items: center; cursor: pointer;">
              <input type="checkbox" id="include-code" ${settings.includeCodeBlocks ? "checked" : ""} style="
                width: 20px;
                height: 20px;
                margin-right: 12px;
                cursor: pointer;
                accent-color: #667eea;
              ">
              <span style="font-size: 14px; color: #334155; font-weight: 500;">💻 ${t("codeblocks_label")}</span>
            </label>
          </div>

          <!-- Buttons -->
          <div style="display: flex; gap: 12px; margin-top: 24px;">
            <button class="save-settings" style="
              flex: 1;
              padding: 14px 24px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              border: none;
              border-radius: 10px;
              font-size: 15px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s;
              box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            ">💾 ${t("save_export")}</button>
            <button class="close-modal" style="
              padding: 14px 24px;
              background: #f1f5f9;
              color: #334155;
              border: none;
              border-radius: 10px;
              font-size: 15px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s;
            ">${t("cancel")}</button>
          </div>
        </div>
      `;

      // Add animations
      const style = document.createElement("style");
      style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideIn {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      .close-modal:hover {
        background: #f1f5f9 !important;
        color: #667eea !important;
      }
      .save-settings:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
      }
    `;
      document.head.appendChild(style);

      document.body.appendChild(modal);

      // Close modal handlers
      modal.querySelectorAll(".close-modal").forEach((btn) => {
        btn.addEventListener("click", () => modal.remove());
      });

      modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.remove();
      });

      // Save settings and export
      modal.querySelector(".save-settings").addEventListener("click", () => {
        const newSettings = {
          format: modal.querySelector("#export-format").value,
          scope: modal.querySelector("#export-scope").value,
          includeRole: modal.querySelector("#include-role").value,
          includeTimestamps: modal.querySelector("#include-timestamps").checked,
          includeCodeBlocks: modal.querySelector("#include-code").checked,
          toolbarMode: modal.querySelector("#toolbar-mode").value,
          floatingToolbarEnabled:
            modal.querySelector("#floating-toolbar-toggle").checked
        };

        // Save settings
        chrome.storage.local.set({ exportSettings: newSettings }, () => {
          // Apply toolbar mode immediately
          const mode = validateToolbarMode(newSettings.toolbarMode);
          toolbarMode = mode || DEFAULT_TOOLBAR_MODE;
          floatingToolbarEnabled =
            typeof newSettings.floatingToolbarEnabled === "boolean"
              ? newSettings.floatingToolbarEnabled
              : DEFAULT_TOOLBAR_VISIBILITY;
          if (!floatingToolbarEnabled) {
            document.querySelector(".iub-floating-toolbar")?.remove();
          }
          addExportButtons(platformConfig);
          modal.remove();
          // Trigger export with new settings
          exportChatWithSettings(platform, newSettings);
        });
      });
    });
  }
})();
