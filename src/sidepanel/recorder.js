// recorder.js
// Handles prompting the user to select a tab and starting/pause/stop recording

/**
 * Prompt the user to select a Chrome tab to record and notify that tab that recording has started.
 * Returns a Promise resolving with the tabId.
 */
export function startRecording() {
  return new Promise((resolve, reject) => {
    if (!chrome.desktopCapture || !chrome.desktopCapture.chooseDesktopMedia) {
      reject(
        new Error(
          "Legacy desktop capture is no longer available. Use the new screen recording controls in the side panel."
        )
      );
      return;
    }
    // Prompt the user to choose a tab for recording
    chrome.desktopCapture.chooseDesktopMedia(["tab"], (streamId) => {
      if (!streamId) {
        reject(new Error("Tab selection canceled"));
        return;
      }
      // Find the active tab in the current window
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || tabs.length === 0) {
          reject(new Error("No active tab found"));
          return;
        }
        const tabId = tabs[0].id;
        // Send a message to the content script in the selected tab to start recording
        chrome.tabs.sendMessage(tabId, { action: "startRecording", streamId });
        resolve(tabId);
      });
    });
  });
}

/**
 * Send a pause command to the recording content script for the given tab.
 * @param {number} tabId
 */
export function pauseRecording(tabId) {
  if (typeof tabId !== "number") return;
  chrome.tabs.sendMessage(tabId, { action: "pauseRecording" });
}

/**
 * Send a stop command to the recording content script for the given tab.
 * @param {number} tabId
 */
export function stopRecording(tabId) {
  if (typeof tabId !== "number") return;
  chrome.tabs.sendMessage(tabId, { action: "stopRecording" });
}
