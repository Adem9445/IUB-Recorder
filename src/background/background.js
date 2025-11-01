import { sessionSync } from "../utils/session-sync.js";

// Helper function to send messages with error handling
function safeSendMessage(message, callback) {
  chrome.runtime.sendMessage(message, (response) => {
    // Suppress "Could not establish connection" errors
    if (chrome.runtime.lastError) {
      // Silently ignore - this just means no one is listening
      console.debug('Message sent but no receiver:', chrome.runtime.lastError.message);
    } else if (callback) {
      callback(response);
    }
  });
}

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Keyboard shortcuts handler
chrome.commands.onCommand.addListener((command) => {
  console.log("Command received:", command);

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab) return;

    switch (command) {
      case "capture-full-page":
        captureFullPage(tab);
        break;
      case "capture-visible":
        captureVisibleArea(tab);
        break;
      case "toggle-recording":
        toggleRecording(tab);
        break;
      case "open-editor":
        chrome.tabs.create({
          url: chrome.runtime.getURL("src/editor/editor-standalone.html")
        });
        break;
    }
  });
});

// Capture full page screenshot
async function captureFullPage(tab) {
  try {
    // Open sidepanel first
    chrome.sidePanel.open({ tabId: tab.id });

    // Inject full page capture script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: async () => {
        const scrollHeight = document.documentElement.scrollHeight;
        const viewportHeight = window.innerHeight;
        const scrollSteps = Math.ceil(scrollHeight / viewportHeight);

        // Notify that we're capturing
        chrome.runtime.sendMessage({
          action: "snapshot",
          dataUrl: null,
          title: "Full Page Capture Starting..."
        }, () => {
          // Suppress error
          if (chrome.runtime.lastError) {}
        });

        return { scrollHeight, viewportHeight, scrollSteps };
      }
    });

    // For now, just capture visible area
    // Full implementation would stitch multiple screenshots
    chrome.tabs.captureVisibleTab(
      null,
      { format: "jpeg", quality: 60 },
      (dataUrl) => {
        safeSendMessage({
          action: "snapshot",
          dataUrl,
          title: "Full Page Screenshot (Alt+Shift+P)"
        });
      }
    );
  } catch (error) {
    console.error("Full page capture failed:", error);
  }
}

// Capture visible area
function captureVisibleArea(tab) {
  chrome.sidePanel.open({ tabId: tab.id });
  chrome.tabs.captureVisibleTab(
    null,
    { format: "jpeg", quality: 60 },
    (dataUrl) => {
      safeSendMessage({
        action: "snapshot",
        dataUrl,
        title: "Visible Area (Alt+Shift+V)"
      });
    }
  );
}

// Toggle recording
function toggleRecording(tab) {
  chrome.sidePanel.open({ tabId: tab.id });
  // Send message to sidepanel to toggle recording
  safeSendMessage({ action: "toggleRecording" });
}

// API key should be stored in chrome.storage.local for security
// Users can set it in the options page
let API_KEY = "";

// Load API key from storage on startup
chrome.storage.local.get(["apiKey"], (result) => {
  if (result.apiKey) {
    API_KEY = result.apiKey;
    console.log("API key loaded from storage");
  } else {
    console.warn("No API key found. Please set it in the options page.");
  }
});

// Pro features storage
const proFeatures = {
  blurSensitive: false,
  autoCapture: false,
  highQuality: false
};

// Load pro features from storage
chrome.storage.local.get(["proFeatures"], (result) => {
  if (result.proFeatures) {
    Object.assign(proFeatures, result.proFeatures);
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background received message:", request);
  if (request.type === "START_RECORDING") {
    // Trigger capture flow on start recording
    captureAndSave(proFeatures)
      .then((capture) => sendResponse(capture))
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  } else if (request.action === "startCapture") {
    captureAndSave(proFeatures)
      .then((capture) => sendResponse(capture))
      .catch((error) => sendResponse({ error }));
    return true;
  } else if (request.action === "toggleProFeature") {
    proFeatures[request.feature] = request.value;
    chrome.storage.local.set({ proFeatures }, () => {
      sendResponse({ success: true });
    });
    return true;
  } else if (request.action === "analyzeCapture") {
    analyzeWithAI(request.dataUrl, request.steps)
      .then((result) => {
        sendResponse({ steps: result.steps });
      })
      .catch((error) =>
        sendResponse({ error: error.message || String(error) })
      );
    return true;
  } else if (request.action === "generateGuide") {
    generateGuide(request.captures)
      .then((guide) => sendResponse({ guide }))
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  } else if (request.action === "openChatExporter") {
    // Open the chat exporter extension page to generate a PDF via html2pdf
    const url = chrome.runtime.getURL("src/exporter/chat-exporter.html");
    chrome.tabs.create({ url }, () => {
      sendResponse({ ok: true });
    });
    return true;
  } else if (request.action === "saveSession") {
    (async () => {
      try {
        const existingSessions = await sessionSync.loadSessions({ forceRemote: true });
        const sessions = Array.isArray(existingSessions) ? [...existingSessions] : [];
        const sessionId = Date.now();
        const timestamp = Date.now();
        const defaultTitle =
          request.title ||
          (request.captures && request.captures[0]?.title) ||
          `Session ${new Date(timestamp).toLocaleString()}`;

        sessions.push({
          id: sessionId,
          title: defaultTitle,
          timestamp,
          captures: request.captures
        });

        const syncResult = await sessionSync.saveSessions(sessions);

        chrome.tabs.create(
          { url: chrome.runtime.getURL("src/editor/editor-standalone.html") },
          () => {
            sendResponse({ success: true, sessionId, syncResult });
          }
        );
      } catch (error) {
        console.error("Failed to persist session", error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  } else if (request.type === "PAGE_CLICK_BATCH") {
    // Handle batched click messages - only process the most recent one
    const messages = request.messages || [];
    if (messages.length === 0) return;
    
    // Take the most recent click event from the batch
    const latestMessage = messages[messages.length - 1];
    console.log(
      "Background handling PAGE_CLICK_BATCH (",
      messages.length,
      "clicks), processing latest:",
      latestMessage.elementText
    );
    
    handlePageClick(latestMessage);
    sendResponse({ success: true });
  } else if (request.type === "PAGE_CLICK") {
    // Fallback for single click messages
    console.log(
      "Background handling PAGE_CLICK, elementText:",
      request.elementText
    );
    handlePageClick(request);
    sendResponse({ success: true });
  }
  // Return false for any unhandled messages to close the channel immediately
  return false;
});

// Helper function to draw click indicator on screenshot
async function drawClickIndicator(dataUrl, x, y, tabId) {
  try {
    // Check if click indicator should be shown
    const result = await chrome.storage.local.get(["showClickIndicator"]);
    if (result.showClickIndicator === false) {
      return dataUrl;
    }
    
    // Inject script to draw on canvas in page context (where canvas works)
    let results;
    try {
      results = await chrome.scripting.executeScript({
        target: { tabId },
        func: (imageData, clickX, clickY) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            
            // Draw original screenshot
            ctx.drawImage(img, 0, 0);
            
            // Calculate device pixel ratio to adjust coordinates
            const dpr = window.devicePixelRatio || 1;
            
            // Adjust coordinates based on device pixel ratio
            // Screenshots are captured at actual pixel size, but clientX/Y are in CSS pixels
            const adjustedX = clickX * dpr;
            const adjustedY = clickY * dpr;
            
            // Scale radius based on DPR for consistent size
            const radius = 25 * dpr;
            const dotRadius = 5 * dpr;
            const lineWidth = 4 * dpr;
            
            console.log(`Drawing indicator at: original(${clickX}, ${clickY}), adjusted(${adjustedX}, ${adjustedY}), dpr=${dpr}, canvas=${img.width}x${img.height}`);
            
            // Outer circle (red)
            ctx.beginPath();
            ctx.arc(adjustedX, adjustedY, radius, 0, 2 * Math.PI);
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = lineWidth;
            ctx.stroke();
            
            // Inner circle (semi-transparent red)
            ctx.beginPath();
            ctx.arc(adjustedX, adjustedY, radius, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
            ctx.fill();
            
            // Center dot
            ctx.beginPath();
            ctx.arc(adjustedX, adjustedY, dotRadius, 0, 2 * Math.PI);
            ctx.fillStyle = '#ef4444';
            ctx.fill();
            
            // Return modified image as JPEG to keep file size small
            resolve(canvas.toDataURL('image/jpeg', 0.85));
          };
          img.onerror = () => resolve(imageData);
          img.src = imageData;
        });
      },
      args: [dataUrl, x, y]
      });
    } catch (scriptError) {
      console.debug('Could not inject click indicator script:', scriptError.message);
      return dataUrl;
    }
    
    if (results && results[0] && results[0].result) {
      return results[0].result;
    }
    return dataUrl;
  } catch (error) {
    console.error('Failed to draw click indicator:', error);
    return dataUrl;
  }
}

// Helper function to handle page click events
function handlePageClick(request) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab) return;
    
    if (tab.url.startsWith("chrome://")) {
      console.error("Cannot capture on chrome:// URLs");
      return;
    }
    
    // Note: Sidepanel should already be open from start-recording
    // Don't try to open it here as it causes "user gesture" errors
    
    // On page click, capture screenshot with optimized quality to save storage
    chrome.tabs.captureVisibleTab(
      null,
      { format: "jpeg", quality: proFeatures.highQuality ? 85 : 60 },
      async (dataUrl) => {
        if (chrome.runtime.lastError) {
          console.error("Capture failed:", chrome.runtime.lastError);
          return;
        }
        console.log("Background captured dataUrl, drawing click indicator");
        
        // Draw click indicator if coordinates are provided
        let finalDataUrl = dataUrl;
        if (request.clickX !== undefined && request.clickY !== undefined) {
          finalDataUrl = await drawClickIndicator(dataUrl, request.clickX, request.clickY, tab.id);
          console.log("Click indicator drawn at", request.clickX, request.clickY);
        }
        
        // Use clicked element text if available
        const rawText =
          typeof request.elementText === "string" ? request.elementText : "";
        const title =
          rawText.length > 0
            ? rawText
            : "Screenshot " + new Date().toLocaleTimeString();
        safeSendMessage({ action: "snapshot", dataUrl: finalDataUrl, title });
      }
    );
  });
}

async function captureAndSave(features, options = {}) {
  try {
    let dataUrl;

    if (options.tabId) {
      await chrome.tabs.update(options.tabId, { active: true });
      // Wait a bit for the tab to become active
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const activeTab = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });
    if (activeTab[0].url.startsWith("chrome://")) {
      throw new Error("Cannot capture chrome:// URLs");
    }

    if (features.blurSensitive) {
      const tab = await chrome.tabs.query({
        active: true,
        currentWindow: true
      });
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab[0].id },
          files: ["src/content/content-script-blur.js"]
        });
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (scriptError) {
        console.debug('Could not inject blur script:', scriptError.message);
        // Continue without blur feature
      }
    }

    const quality = features.highQuality ? 75 : 50;
    dataUrl = await new Promise((resolve) => {
      chrome.tabs.captureVisibleTab(null, { format: "jpeg", quality }, resolve);
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `iub-rec-${timestamp}.png`;
    const currentUrl = (
      await chrome.tabs.query({ active: true, currentWindow: true })
    )[0].url;

    return new Promise((resolve) => {
      chrome.storage.local.get(["captures"], async (result) => {
        const captures = result.captures || [];
        const newCapture = {
          id: Date.now(),
          title: filename,
          timestamp: new Date().toISOString(),
          dataUrl,
          url: currentUrl,
          isPro: true,
          featuresUsed: { ...features },
          steps: []
        };
        captures.unshift(newCapture);
        // Limit to 10 captures to avoid quota
        if (captures.length > 10) {
          captures.splice(10);
        }
        await chrome.storage.local.set({ captures });

        chrome.downloads.download({
          url: dataUrl,
          filename: `IUB-Rec/${filename}`,
          saveAs: false
        });

        resolve(newCapture);
      });
    });
  } catch (error) {
    console.error("Capture failed:", error);
    throw error;
  }
}

async function analyzeWithAI(dataUrl, existingSteps = []) {
  try {
    if (!API_KEY) {
      throw new Error(
        "API key not configured. Please set it in the options page."
      );
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this screenshot and describe the key actionable steps a user should take. ${existingSteps.length > 0 ? "Existing steps:\n" + existingSteps.join("\n") + "\nContinue from step " + (existingSteps.length + 1) : "Start from step 1"}`
              },
              {
                type: "image_url",
                image_url: {
                  url: dataUrl
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || `API error: ${response.status}`);
    }
    const steps = data.choices[0].message.content
      .split("\n")
      .filter((step) => step.trim().length > 0)
      .map((step) => step.replace(/^\d+\.\s*/, "").trim());
    return { steps };
  } catch (error) {
    console.error("AI analysis failed:", error);
    throw error;
  }
}

async function generateGuide(captures) {
  try {
    if (!API_KEY) {
      throw new Error(
        "API key not configured. Please set it in the options page."
      );
    }

    const textContent =
      "Create a comprehensive step-by-step user guide based on these screenshots and titles:\n" +
      captures
        .map((cap, i) => "Step " + (i + 1) + ": " + cap.title + "\n")
        .join("");
    const messages = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: textContent
          },
          ...captures.map((cap) => ({
            type: "image_url",
            image_url: { url: cap.dataUrl }
          }))
        ]
      }
    ];
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages,
        max_tokens: 2000
      })
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error?.message || `API error: ${response.status}`);
    return data.choices[0].message.content;
  } catch (error) {
    console.error("AI guide generation failed:", error);
    throw error;
  }
}
