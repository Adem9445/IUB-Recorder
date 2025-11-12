// start-recording.js
import {
  addImageBubble,
  showChatScreen,
  showStartScreen,
  clearChat
} from "./chat-ui.js";

import { showWarning, showError, showInfo } from "./feedback.js";

import { 
  checkStorageQuota, 
  autoCleanupIfNeeded 
} from "../utils/storage-manager.js";

const startBtn = document.getElementById("start-recording");
const stopBtn = document.getElementById("stop-recording");
const captures = [];
const MAX_CAPTURES = 15; // Limit to prevent storage quota issues (reduced for safety)
let contentTabId = null; // track the tab where listener is injected
let onUpdateListener = null;

// Helper: strip HTML to plain text for storage in captures
function stripHtml(html) {
  try {
    const div = document.createElement('div');
    div.innerHTML = html;
    return (div.textContent || div.innerText || '').trim();
  } catch {
    return html;
  }
}

// Helper function to get page info
async function getPageInfo() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      return {
        title: tab.title || 'Unknown page',
        url: shortenUrl(tab.url)
      };
    }
  } catch (error) {
    console.error('Failed to get page info:', error);
  }
  return {
    title: 'Unknown page',
    url: 'N/A'
  };
}

// Helper function to shorten URL for display
function shortenUrl(url) {
  try {
    const urlObj = new URL(url);
    let display = urlObj.hostname + urlObj.pathname;
    if (display.length > 50) {
      display = display.substring(0, 47) + '...';
    }
    return display;
  } catch (error) {
    return url.substring(0, 50);
  }
}

// Listen for snapshot messages from background
chrome.runtime.onMessage.addListener((message, sender) => {
  console.log("Received message in sidepanel:", message);
  if (message.action === "snapshot") {
    if (message.dataUrl) {
      // Check if we've reached the limit
      if (captures.length >= MAX_CAPTURES) {
        showWarning(
          `⚠️ You've reached the ${MAX_CAPTURES}-screenshot limit. Stop and save before recording more.`,
          { duration: 12000 }
        );
        console.warn(`Maximum ${MAX_CAPTURES} screenshots reached`);
        return;
      }
      
      // Create description with button text and page info (HTML for sidepanel)
      getPageInfo().then(pageInfo => {
        const description = `
          <div style="margin-bottom: 8px;">
            <strong style="color: #667eea;">${message.title}</strong>
          </div>
          <div style="font-size: 13px; color: #475569; margin-bottom: 4px;">
            <strong>👉 On page:</strong> ${pageInfo.title}
          </div>
          <div style="font-size: 12px; color: #94a3b8;">
            🌐 ${pageInfo.url}
          </div>
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0;">
            <span style="color: #64748b; font-style: italic; font-size: 12px;">
              Click ✎ to add more detail...
            </span>
          </div>
        `;
        
        addImageBubble(message.dataUrl, description);
        // Persist plain text description with capture for the editor/exports
        captures.push({ 
          dataUrl: message.dataUrl, 
          title: message.title,
          description: stripHtml(description)
        });
      });
      
      // Warn when getting close to limit
      if (captures.length === MAX_CAPTURES - 5) {
        showWarning(
          `⚠️ ${MAX_CAPTURES - captures.length} screenshots left before you hit the session limit.`
        );
      }
    }
  } else if (message.action === "recordingError" && message.message) {
    showError(`Recording issue: ${message.message}`);
  } else if (message.action === "toggleRecording") {
    // Toggle recording via keyboard shortcut
    if (startBtn.hidden) {
      // Currently recording, stop it
      stopBtn.click();
    } else {
      // Not recording, start it
      startBtn.click();
    }
  }
});

function handleClickCapture(e) {
  chrome.tabs.captureVisibleTab(
    null,
    { format: "png", quality: 70 },
    (dataUrl) => {
      if (chrome.runtime.lastError || !dataUrl) {
        showError("Couldn't capture this tab. Try again or reload the page.");
        console.error("captureVisibleTab failed", chrome.runtime.lastError);
        return;
      }
      const title = "Screenshot " + (captures.length + 1);
      // Add bubble with title only
      const html = `<strong>${title}</strong>`;
      addImageBubble(dataUrl, html);
      captures.push({ dataUrl, title, description: stripHtml(html) });
    }
  );
}

if (startBtn && stopBtn) {
  startBtn.addEventListener("click", async () => {
    // Clear old captures from storage FIRST to free space
    await chrome.storage.local.remove(["captures"]);
    console.log("Cleared old captures from storage");

    chrome.storage.local.set({ hasSeenSidepanelIntro: true });
    const onboarding = document.getElementById("onboarding-card");
    if (onboarding) onboarding.setAttribute("aria-hidden", "true");

    // Check storage before starting
    const storageCheck = await checkStorageQuota();
    if (storageCheck.warning) {
      showWarning(storageCheck.message);

      if (storageCheck.level === 'critical') {
        // Auto-cleanup
        const cleanup = await autoCleanupIfNeeded();
        if (cleanup.cleaned) {
          showInfo("✅ Automatic cleanup completed.");
        }
      }
    }

    captures.length = 0;
    clearChat();
    showChatScreen();
    startBtn.hidden = true;
    stopBtn.hidden = false;
    showInfo("Recording started. Click anywhere in the tab to capture key steps.", {
      duration: 7000
    });
    // Inject page click listener into active tab
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });
    if (tab.url.startsWith("chrome://")) {
      console.error("Cannot record on chrome:// URLs");
      showError("Chrome internal pages can't be recorded. Switch to a regular tab.");
      startBtn.hidden = false;
      stopBtn.hidden = true;
      return;
    }
    contentTabId = tab.id;

    // First, try to stop any existing listener
    try {
      await chrome.tabs.sendMessage(contentTabId, { action: "stopRecording" });
      await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for cleanup
    } catch (e) {
      // No existing listener, that's fine
    }

    // Now inject the new listener
    try {
      await chrome.scripting.executeScript({
        target: { tabId: contentTabId },
        files: ["src/content/page-click-listener.js"]
      });
    } catch (err) {
      console.error("Failed to inject page-click-listener", err);
      showError("Couldn't start the click listener. Reload the tab and try again.");
      stopBtn.click();
      return;
    }

    // Also inject click indicator if enabled
    chrome.storage.local.get(["showClickIndicator"], async (result) => {
      if (result.showClickIndicator !== false) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: contentTabId },
            files: ["src/content/click-indicator.js"]
          });
        } catch (err) {
          console.log("Click indicator already injected or failed:", err);
        }
      }
    });

    // Re-inject listener after navigation
    onUpdateListener = (tabId, changeInfo) => {
      if (tabId === contentTabId && changeInfo.status === "complete") {
        chrome.tabs.get(tabId, (updatedTab) => {
          if (!updatedTab.url.startsWith("chrome://")) {
            // Stop old listener first
            chrome.tabs
              .sendMessage(contentTabId, { action: "stopRecording" })
              .catch(() => {});
            setTimeout(() => {
              chrome.scripting
                .executeScript({
                  target: { tabId: contentTabId },
                  files: ["src/content/page-click-listener.js"]
                })
                .catch((err) => {
                  console.error("Failed to re-inject listener", err);
                  showError("Lost connection to the page. Restart the recording.");
                });

              // Re-inject click indicator if enabled
              chrome.storage.local.get(["showClickIndicator"], (result) => {
                if (result.showClickIndicator !== false) {
                  chrome.scripting.executeScript({
                    target: { tabId: contentTabId },
                    files: ["src/content/click-indicator.js"]
                  }).catch(() => {});
                }
              });
            }, 100);
          }
        });
      }
    };
    chrome.tabs.onUpdated.addListener(onUpdateListener);
  });

  stopBtn.addEventListener(
    "click",
    async (e) => {
      e.stopPropagation();
      showStartScreen();
      startBtn.hidden = false;
      stopBtn.hidden = true;
      // Remove navigation listener
      if (onUpdateListener) {
        chrome.tabs.onUpdated.removeListener(onUpdateListener);
        onUpdateListener = null;
      }
      // Instruct content script to remove click listener
      if (contentTabId) {
        chrome.tabs.sendMessage(contentTabId, { action: "stopRecording" });
        contentTabId = null;
      }
      // Sync any edited side panel bubble text into captures descriptions
      try {
        const container = document.getElementById('chat-container');
        const bubbles = container ? Array.from(container.querySelectorAll('.chat-bubble')) : [];
        bubbles.forEach((b, i) => {
          const textHtml = b.querySelector('.bubble-text')?.innerHTML || '';
          if (captures[i]) {
            captures[i].description = stripHtml(textHtml);
          }
        });
      } catch (err) {
        console.debug('Failed to sync edited descriptions:', err);
      }
      // Save session and open editor
      chrome.runtime.sendMessage({ action: "saveSession", captures });
      showInfo("Session saved. The editor will open in a new tab.");
    },
    true
  );
}
