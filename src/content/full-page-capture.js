// Full-Page Screenshot Capture
// Captures entire scrollable pages by stitching multiple screenshots

class FullPageCapture {
  constructor() {
    this.screenshots = [];
    this.isCapturing = false;
    this.originalScrollPosition = 0;
  }

  async capture() {
    if (this.isCapturing) {
      console.log("Already capturing...");
      return null;
    }

    this.isCapturing = true;
    this.screenshots = [];
    this.originalScrollPosition = window.scrollY;

    try {
      // Show progress indicator
      this.showProgress("Starting full page capture...");

      // Get page dimensions
      const pageHeight = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );

      const viewportHeight = window.innerHeight;
      const scrollSteps = Math.ceil(pageHeight / viewportHeight);

      console.log(`Capturing ${scrollSteps} screenshots...`);

      // Capture each viewport
      for (let i = 0; i < scrollSteps; i++) {
        const scrollY = i * viewportHeight;

        // Scroll to position
        window.scrollTo({
          top: scrollY,
          left: 0,
          behavior: "instant"
        });

        // Wait for rendering
        await this.wait(200);

        // Update progress
        this.showProgress(`Capturing section ${i + 1} of ${scrollSteps}...`);

        // Request screenshot from background
        const screenshot = await this.requestScreenshot();
        if (screenshot) {
          this.screenshots.push({
            dataUrl: screenshot,
            scrollY: scrollY,
            index: i
          });
        }

        // Small delay between captures
        await this.wait(100);
      }

      // Restore original scroll position
      window.scrollTo({
        top: this.originalScrollPosition,
        left: 0,
        behavior: "instant"
      });

      this.showProgress("Stitching screenshots...");

      // Stitch screenshots together
      const fullPageImage = await this.stitchScreenshots(viewportHeight);

      this.hideProgress();
      this.isCapturing = false;

      return fullPageImage;
    } catch (error) {
      console.error("Full page capture failed:", error);
      this.hideProgress();
      this.isCapturing = false;

      // Restore scroll position on error
      window.scrollTo({
        top: this.originalScrollPosition,
        left: 0,
        behavior: "instant"
      });

      return null;
    }
  }

  async requestScreenshot() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { action: "captureVisibleTab" },
        (response) => {
          resolve(response?.dataUrl || null);
        }
      );
    });
  }

  async stitchScreenshots(viewportHeight) {
    if (this.screenshots.length === 0) return null;
    if (this.screenshots.length === 1) return this.screenshots[0].dataUrl;

    // Create canvas for stitching
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Load first image to get dimensions
    const firstImg = await this.loadImage(this.screenshots[0].dataUrl);
    const width = firstImg.width;
    const totalHeight =
      this.screenshots.length *
      viewportHeight *
      (firstImg.height / window.innerHeight);

    canvas.width = width;
    canvas.height = totalHeight;

    // Draw each screenshot
    for (let i = 0; i < this.screenshots.length; i++) {
      const img = await this.loadImage(this.screenshots[i].dataUrl);
      const y = i * viewportHeight * (img.height / window.innerHeight);
      ctx.drawImage(img, 0, y);
    }

    // Convert to data URL
    return canvas.toDataURL("image/png", 1.0);
  }

  loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  showProgress(message) {
    let progress = document.getElementById("iub-fullpage-progress");

    if (!progress) {
      progress = document.createElement("div");
      progress.id = "iub-fullpage-progress";
      progress.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 12px;
        animation: slideInRight 0.3s ease;
      `;

      progress.innerHTML = `
        <div class="spinner" style="
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        "></div>
        <span class="message"></span>
      `;

      const style = document.createElement("style");
      style.textContent = `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideInRight {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);

      document.body.appendChild(progress);
    }

    const messageEl = progress.querySelector(".message");
    if (messageEl) {
      messageEl.textContent = message;
    }
  }

  hideProgress() {
    const progress = document.getElementById("iub-fullpage-progress");
    if (progress) {
      progress.style.animation = "slideOutRight 0.3s ease";
      setTimeout(() => progress.remove(), 300);
    }
  }
}

// Export for use
window.FullPageCapture = FullPageCapture;

// Listen for capture request
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "captureFullPage") {
    const capturer = new FullPageCapture();
    capturer
      .capture()
      .then((dataUrl) => {
        sendResponse({ success: true, dataUrl });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Async response
  }
});
