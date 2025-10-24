// main.js
// Orchestrates UI events: start/pause/stop controls and message handling

import { startRecording, pauseRecording, stopRecording } from "./recorder.js";
import {
  showChatScreen,
  showStartScreen,
  addImageBubble,
  clearChat
} from "./chat-ui.js";

let recordingTabId = null;

// Listen for incoming messages (e.g., snapshots) from content scripts or background
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === "snapshot") {
    const { dataUrl, aiText } = message;
    addImageBubble(dataUrl, aiText);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("start-recording");
  const pauseBtn = document.getElementById("pause-recording");
  const stopBtn = document.getElementById("stop-recording");

  startBtn.addEventListener("click", async () => {
    try {
      // Begin recording: prompt for tab and notify it
      recordingTabId = await startRecording();
      // Reset chat UI and show chat screen
      clearChat();
      showChatScreen();
    } catch (error) {
      console.error("Recording start failed:", error);
    }
  });

  pauseBtn.addEventListener("click", () => {
    if (recordingTabId !== null) {
      pauseRecording(recordingTabId);
    }
  });

  stopBtn.addEventListener("click", () => {
    if (recordingTabId !== null) {
      stopRecording(recordingTabId);
      recordingTabId = null;
      showStartScreen();
    }
  });
});
