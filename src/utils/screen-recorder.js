// Screen Recorder - Record screen with audio
// Supports tab recording, window recording, and full screen

export default class ScreenRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
    this.stream = null;
    this.startTime = null;
    this.timerInterval = null;
    this.stopListeners = new Set();
    this.stylesInjected = false;
  }

  async startRecording(options = {}) {
    if (this.isRecording) {
      throw new Error("A recording session is already running");
    }

    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        throw new Error("Screen recording is not supported in this browser");
      }
      // Request screen capture
      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: "screen",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: options.includeAudio !== false
      });

      // Setup MediaRecorder
      const mimeType = this.getSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: mimeType,
        videoBitsPerSecond: 2500000 // 2.5 Mbps
      });

      this.recordedChunks = [];

      // Handle data available
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      // Handle stop
      this.mediaRecorder.onstop = () => {
        this.handleRecordingStop();
      };

      // Handle errors
      this.mediaRecorder.onerror = (error) => {
        console.error("MediaRecorder error:", error);
        this.cleanupOnError();
      };

      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second
      this.isRecording = true;
      this.startTime = Date.now();

      // Start timer
      this.startTimer();

      // Show recording indicator
      this.showRecordingIndicator();

      // Handle stream end (user stops sharing)
      const [videoTrack] = this.stream.getVideoTracks();
      if (videoTrack) {
        videoTrack.addEventListener("ended", () => {
          this.stopRecording();
        });
      }

      return true;
    } catch (error) {
      console.error("Failed to start recording:", error);
      this.cleanupOnError();
      throw error;
    }
  }

  stopRecording() {
    if (!this.mediaRecorder) {
      this.finalizeStopState({ notify: false });
      return;
    }

    if (this.mediaRecorder.state === "inactive") {
      this.finalizeStopState();
      return;
    }

    try {
      this.mediaRecorder.stop();
    } catch (error) {
      console.error("Failed to stop MediaRecorder", error);
      this.finalizeStopState();
      throw error;
    }

    this.stopStream();
  }

  handleRecordingStop() {
    try {
      if (this.recordedChunks.length === 0) {
        this.showNotification("⚠️ No recording data was captured.");
        return;
      }

      const mimeType = this.getSupportedMimeType();
      const blob = new Blob(this.recordedChunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const elapsedMs = this.startTime ? Date.now() - this.startTime : 0;
      const duration = Math.max(0, Math.floor(elapsedMs / 1000));
      const filename = `screen-recording-${Date.now()}.webm`;

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();

      setTimeout(() => URL.revokeObjectURL(url), 100);

      this.showNotification(`✅ Recording saved! Duration: ${duration}s`);
    } catch (error) {
      console.error("Failed to save recording", error);
      this.showNotification("⚠️ We couldn't save the screen recording.");
    } finally {
      this.recordedChunks = [];
      this.finalizeStopState();
    }
  }

  getSupportedMimeType() {
    const types = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
      "video/mp4"
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return "video/webm";
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      this.updateTimer(elapsed);
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  updateTimer(seconds) {
    const indicator = document.getElementById("iub-recording-indicator");
    if (indicator) {
      const timer = indicator.querySelector(".timer");
      if (timer) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        timer.textContent = `${minutes}:${secs.toString().padStart(2, "0")}`;
      }
    }
  }

  showRecordingIndicator() {
    this.hideRecordingIndicator();
    this.ensureGlobalStyles();
    const indicator = document.createElement("div");
    indicator.id = "iub-recording-indicator";
    indicator.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(239, 68, 68, 0.95);
      backdrop-filter: blur(10px);
      color: white;
      padding: 12px 24px;
      border-radius: 24px;
      box-shadow: 0 8px 24px rgba(239, 68, 68, 0.4);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 12px;
      animation: pulse 2s ease-in-out infinite;
    `;

    indicator.innerHTML = `
      <div style="
        width: 12px;
        height: 12px;
        background: white;
        border-radius: 50%;
        animation: blink 1s ease-in-out infinite;
      "></div>
      <span>REC</span>
      <span class="timer">0:00</span>
      <button class="stop-btn" style="
        background: white;
        color: #ef4444;
        border: none;
        padding: 4px 12px;
        border-radius: 12px;
        cursor: pointer;
        font-weight: 600;
        font-size: 12px;
        margin-left: 8px;
      ">Stop</button>
    `;

    // Stop button handler
    indicator.querySelector(".stop-btn").addEventListener("click", () => {
      this.stopRecording();
    });

    document.body.appendChild(indicator);
  }

  hideRecordingIndicator() {
    const indicator = document.getElementById("iub-recording-indicator");
    if (indicator) {
      indicator.style.animation = "fadeOut 0.3s ease";
      setTimeout(() => indicator.remove(), 300);
    }
  }

  showNotification(message) {
    this.ensureGlobalStyles();
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-weight: 600;
      animation: slideInRight 0.3s ease;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }

  onStop(callback) {
    if (typeof callback === "function") {
      this.stopListeners.add(callback);
      return () => this.stopListeners.delete(callback);
    }
    return () => {};
  }

  notifyStop() {
    if (this.stopListeners.size === 0) {
      return;
    }
    [...this.stopListeners].forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error("ScreenRecorder stop callback failed", error);
      }
    });
  }

  cleanupOnError() {
    try {
      if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
        this.mediaRecorder.stop();
        return;
      }
    } catch (err) {
      console.debug("MediaRecorder cleanup issue", err);
    }
    this.finalizeStopState();
  }

  stopStream() {
    if (!this.stream) return;
    this.stream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch (err) {
        console.debug("Track stop failed", err);
      }
    });
    this.stream = null;
  }

  finalizeStopState({ notify = true } = {}) {
    this.stopStream();
    this.stopTimer();
    this.hideRecordingIndicator();
    const wasRecording =
      this.isRecording || (this.mediaRecorder && this.mediaRecorder.state !== "inactive");
    this.isRecording = false;
    this.mediaRecorder = null;
    this.startTime = null;
    this.recordedChunks = [];
    if (notify && wasRecording) {
      this.notifyStop();
    }
  }

  ensureGlobalStyles() {
    if (this.stylesInjected) {
      return;
    }
    if (document.getElementById("iub-screen-recorder-style")) {
      this.stylesInjected = true;
      return;
    }
    const style = document.createElement("style");
    style.id = "iub-screen-recorder-style";
    style.textContent = `
      @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
      @keyframes pulse {
        0%, 100% { transform: translateX(-50%) scale(1); }
        50% { transform: translateX(-50%) scale(1.05); }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      @keyframes slideInRight {
        from {
          transform: translateX(24px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
    this.stylesInjected = true;
  }
}
