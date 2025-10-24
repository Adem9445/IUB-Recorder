// start-recording.js
import {
  addImageBubble,
  showChatScreen,
  showStartScreen,
  clearChat
} from "./chat-ui.js";

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

// Helper function to show warnings
function showWarning(message) {
  const chatContainer = document.getElementById('chat-container');
  if (!chatContainer) return;
  
  const warning = document.createElement('div');
  warning.style.cssText = `
    background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
    color: white;
    padding: 12px 16px;
    border-radius: 10px;
    margin: 12px 0;
    font-weight: 600;
    text-align: center;
    animation: fadeInUp 0.5s ease-in-out;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
  `;
  warning.textContent = message;
  chatContainer.appendChild(warning);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    warning.style.animation = 'fadeOut 0.5s ease-in-out';
    setTimeout(() => warning.remove(), 500);
  }, 5000);
}

// Listen for snapshot messages from background
chrome.runtime.onMessage.addListener((message, sender) => {
  console.log("Received message in sidepanel:", message);
  if (message.action === "snapshot") {
    if (message.dataUrl) {
      // Check if we've reached the limit
      if (captures.length >= MAX_CAPTURES) {
        showWarning(`⚠️ Max ${MAX_CAPTURES} screenshots nådd! Stopp og lagre session.`);
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
            <strong>👉 På side:</strong> ${pageInfo.title}
          </div>
          <div style="font-size: 12px; color: #94a3b8;">
            🌐 ${pageInfo.url}
          </div>
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0;">
            <span style="color: #64748b; font-style: italic; font-size: 12px;">
              Klikk ✎ for å legge til mer beskrivelse...
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
        showWarning(`⚠️ ${MAX_CAPTURES - captures.length} screenshots igjen før grense`);
      }
    }
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
    await chrome.storage.local.remove(['captures']);
    console.log('Cleared old captures from storage');
    
    // Check storage before starting
    const storageCheck = await checkStorageQuota();
    if (storageCheck.warning) {
      showWarning(storageCheck.message);
      
      if (storageCheck.level === 'critical') {
        // Auto-cleanup
        const cleanup = await autoCleanupIfNeeded();
        if (cleanup.cleaned) {
          showWarning('✅ Automatisk opprydding fullført');
        }
      }
    }
    
    captures.length = 0;
    clearChat();
    showChatScreen();
    startBtn.hidden = true;
    stopBtn.hidden = false;
    // Inject page click listener into active tab
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });
    if (tab.url.startsWith("chrome://")) {
      console.error("Cannot record on chrome:// URLs");
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
    await chrome.scripting.executeScript({
      target: { tabId: contentTabId },
      files: ["src/content/page-click-listener.js"]
    });

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
              chrome.scripting.executeScript({
                target: { tabId: contentTabId },
                files: ["src/content/page-click-listener.js"]
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
    },
    true
  );
}
