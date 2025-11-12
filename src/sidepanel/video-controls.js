import ScreenRecorder from "../utils/screen-recorder.js";
import { showError, showInfo } from "./feedback.js";

const startVideoBtn = document.getElementById("start-video-recording");
const stopVideoBtn = document.getElementById("stop-video-recording");
const includeAudioToggle = document.getElementById("video-include-audio");
const statusElement = document.getElementById("video-status");

let recorder = null;
let unsubscribeStop = null;

function ensureRecorder() {
  if (!recorder) {
    recorder = new ScreenRecorder();
    unsubscribeStop = recorder.onStop(() => {
      toggleRecordingButtons(false);
      setStatus("Screen recording stopped. The file will download automatically.");
    });
  }
  return recorder;
}

function toggleRecordingButtons(isRecording) {
  if (!startVideoBtn || !stopVideoBtn) return;
  startVideoBtn.hidden = isRecording;
  stopVideoBtn.hidden = !isRecording;
  startVideoBtn.disabled = false;
  stopVideoBtn.disabled = false;
}

function setStatus(message = "", tone = "info") {
  if (!statusElement) return;
  statusElement.textContent = message;
  statusElement.dataset.tone = tone;
  statusElement.hidden = message.length === 0;
}

async function handleStartRecording() {
  const recorderInstance = ensureRecorder();
  startVideoBtn.disabled = true;
  setStatus("Preparing screen recording…");

  const includeAudio = includeAudioToggle ? includeAudioToggle.checked : true;

  try {
    await recorderInstance.startRecording({ includeAudio });
    toggleRecordingButtons(true);
    setStatus("Recording in progress. Use the floating stop control when finished.");
    showInfo("Screen recording started. Chrome will display a sharing indicator while we capture.", {
      duration: 7000
    });
  } catch (error) {
    const isPermissionDenied =
      error?.name === "NotAllowedError" || /denied|permission/i.test(error?.message || "");
    if (isPermissionDenied) {
      setStatus("Screen recording canceled.", "warning");
      showInfo("Screen recording was canceled before it started.");
    } else {
      setStatus("Couldn't start screen recording.", "error");
      showError(
        error?.message
          ? `Couldn't start screen recording: ${error.message}`
          : "Couldn't start screen recording."
      );
    }
  } finally {
    startVideoBtn.disabled = false;
  }
}

function handleStopRecording() {
  if (!recorder) {
    return;
  }

  stopVideoBtn.disabled = true;
  setStatus("Stopping recording…");
  try {
    recorder.stopRecording();
  } catch (error) {
    console.error("Failed to stop recording", error);
    setStatus("We couldn't stop the recording cleanly.", "error");
    showError("We couldn't stop the recording. Refresh the side panel and try again.");
    toggleRecordingButtons(false);
  }
}

function cleanup() {
  if (typeof unsubscribeStop === "function") {
    unsubscribeStop();
    unsubscribeStop = null;
  }
}

if (startVideoBtn && stopVideoBtn) {
  startVideoBtn.addEventListener("click", handleStartRecording);
  stopVideoBtn.addEventListener("click", handleStopRecording);

  window.addEventListener("unload", cleanup, { once: true });
}
