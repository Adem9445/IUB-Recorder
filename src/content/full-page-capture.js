// Full-Page Screenshot Capture
// Captures entire scrollable pages by stitching multiple screenshots

class FullPageCapture {
  constructor() {
    this.screenshots = [];
    this.isCapturing = false;
    this.originalScrollPosition = 0;
    this.viewportHeight = window.innerHeight;
    this.pageHeight = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );
  }

  async capture() {
    if (this.isCapturing) {
      console.log("Already capturing...");
      return null;
    }

    this.isCapturing = true;
    this.screenshots = [];
    this.originalScrollPosition = window.scrollY;

    // Refresh viewport and page sizes in case they changed since construction
    this.viewportHeight = window.innerHeight;
    this.pageHeight = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );

    try {
      // Show progress indicator
      this.showProgress("Starting full page capture...");

      const estimatedSteps = Math.max(1, Math.ceil(this.pageHeight / this.viewportHeight));
      console.log(`Capturing approximately ${estimatedSteps} screenshots...`);

      let targetScrollY = 0;
      let previousScrollY = -1;
      let captureCount = 0;

      while (targetScrollY < this.pageHeight) {
        window.scrollTo({
          top: targetScrollY,
          left: 0,
          behavior: "auto"
        });

        await this.wait(200);

        const actualScrollY = window.scrollY;
        if (actualScrollY === previousScrollY && this.screenshots.length > 0) {
          console.warn("FullPageCapture: scroll position stuck, stopping capture loop.");
          break;
        }

        captureCount += 1;
        this.showProgress(`Capturing section ${captureCount} of ${estimatedSteps}...`);

        const screenshot = await this.requestScreenshot();
        if (!screenshot) {
          throw new Error(`Unable to capture section ${captureCount}`);
        }

        this.screenshots.push({
          dataUrl: screenshot,
          scrollY: actualScrollY,
          index: captureCount - 1
        });

        previousScrollY = actualScrollY;

        if (actualScrollY + this.viewportHeight >= this.pageHeight) {
          break;
        }

        targetScrollY = actualScrollY + this.viewportHeight;

        await this.wait(100);
      }

      if (this.screenshots.length === 0) {
        throw new Error("No screenshots were captured");
      }

      // Restore original scroll position
      window.scrollTo({
        top: this.originalScrollPosition,
        left: 0,
        behavior: "auto"
      });

      this.showProgress("Stitching screenshots...");

      // Stitch screenshots together
      const fullPageImage = await this.stitchScreenshots();

      this.hideProgress();

      return fullPageImage;
    } catch (error) {
      console.error("Full page capture failed:", error);
      this.hideProgress();

      // Restore scroll position on error
      window.scrollTo({
        top: this.originalScrollPosition,
        left: 0,
        behavior: "auto"
      });

      throw error;
    } finally {
      this.isCapturing = false;
    }
  }

  async requestScreenshot() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { action: "captureVisibleTab" },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error(
              "FullPageCapture: captureVisibleTab failed",
              chrome.runtime.lastError
            );
            resolve(null);
            return;
          }
          if (!response || response.success === false || !response.dataUrl) {
            console.warn("FullPageCapture: empty screenshot response", response);
            resolve(null);
            return;
          }
          resolve(response.dataUrl);
        }
      );
    });
  }

  async stitchScreenshots() {
    if (this.screenshots.length === 0) return null;
    if (this.screenshots.length === 1) return this.screenshots[0].dataUrl;

    // Create canvas for stitching
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Load first image to get dimensions
    const firstImg = await this.loadImage(this.screenshots[0].dataUrl);
    const width = firstImg.width;
    const effectiveViewport = this.viewportHeight || window.innerHeight;
    const scale = firstImg.height / effectiveViewport;
    const totalHeight = Math.max(
      firstImg.height,
      Math.round((this.pageHeight || window.innerHeight) * scale)
    );

    canvas.width = width;
    canvas.height = totalHeight;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw each screenshot aligned by scroll position
    for (let i = 0; i < this.screenshots.length; i++) {
      const shot = this.screenshots[i];
      const img = await this.loadImage(shot.dataUrl);
      const y = Math.round(shot.scrollY * scale);

      if (y >= totalHeight) {
        continue;
      }

      const remainingHeight = totalHeight - y;
      const drawHeight = Math.min(img.height, remainingHeight);
      const sourceY = drawHeight === img.height ? 0 : img.height - drawHeight;

      ctx.drawImage(
        img,
        0,
        sourceY,
        img.width,
        drawHeight,
        0,
        y,
        width,
        drawHeight
      );
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

      if (!document.getElementById("iub-fullpage-progress-style")) {
        const style = document.createElement("style");
        style.id = "iub-fullpage-progress-style";
        style.textContent = `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes slideInRight {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
          }
        `;
        document.head.appendChild(style);
      }

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
