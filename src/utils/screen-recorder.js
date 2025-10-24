// Screen Recorder - Record screen with audio
// Supports tab recording, window recording, and full screen

class ScreenRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
    this.stream = null;
    this.startTime = null;
    this.timerInterval = null;
  }

  async startRecording(options = {}) {
    if (this.isRecording) {
      console.log("Already recording");
      return false;
    }

    try {
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
        this.stopRecording();
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
      this.stream.getVideoTracks()[0].addEventListener("ended", () => {
        this.stopRecording();
      });

      return true;
    } catch (error) {
      console.error("Failed to start recording:", error);
      return false;
    }
  }

  stopRecording() {
    if (!this.isRecording) {
      return;
    }

    this.isRecording = false;

    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    this.stopTimer();
    this.hideRecordingIndicator();
  }

  handleRecordingStop() {
    if (this.recordedChunks.length === 0) {
      console.log("No data recorded");
      return;
    }

    // Create blob from recorded chunks
    const mimeType = this.getSupportedMimeType();
    const blob = new Blob(this.recordedChunks, { type: mimeType });

    // Create download link
    const url = URL.createObjectURL(blob);
    const duration = Math.floor((Date.now() - this.startTime) / 1000);
    const filename = `screen-recording-${Date.now()}.webm`;

    // Download file
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    // Cleanup
    setTimeout(() => URL.revokeObjectURL(url), 100);

    // Show notification
    this.showNotification(`✅ Recording saved! Duration: ${duration}s`);

    // Reset
    this.recordedChunks = [];
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

    const style = document.createElement("style");
    style.textContent = `
      @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
      @keyframes pulse {
        0%, 100% { transform: translateX(-50%) scale(1); }
        50% { transform: translateX(-50%) scale(1.05); }
      }
    `;
    document.head.appendChild(style);

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
}

// Export for use
window.ScreenRecorder = ScreenRecorder;
