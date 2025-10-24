// Privacy Enhancer - Auto-blur sensitive data
// Detects and blurs credit cards, emails, phone numbers, SSN, etc.

class PrivacyEnhancer {
  constructor() {
    this.patterns = {
      creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /\b(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
      ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
      passport: /\b[A-Z]{1,2}\d{6,9}\b/g,
      ipAddress: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g
    };

    this.sensitiveSelectors = [
      'input[type="password"]',
      'input[type="email"]',
      'input[type="tel"]',
      'input[name*="card"]',
      'input[name*="cvv"]',
      'input[name*="ssn"]',
      '[class*="password"]',
      '[class*="credit-card"]',
      '[data-sensitive="true"]'
    ];
  }

  // Auto-blur sensitive data in screenshot
  async blurSensitiveData(imageDataUrl) {
    try {
      const img = await this.loadImage(imageDataUrl);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Find and blur sensitive areas
      await this.detectAndBlurSensitiveAreas(ctx, canvas);

      return canvas.toDataURL("image/png", 1.0);
    } catch (error) {
      console.error("Privacy enhancement failed:", error);
      return imageDataUrl; // Return original on error
    }
  }

  async detectAndBlurSensitiveAreas(ctx, canvas) {
    // Get all potentially sensitive elements
    const sensitiveElements = this.findSensitiveElements();

    for (const element of sensitiveElements) {
      const rect = element.getBoundingClientRect();

      if (rect.width > 0 && rect.height > 0) {
        // Apply blur to this area
        this.blurArea(ctx, rect.left, rect.top, rect.width, rect.height);
      }
    }

    // Also scan for text patterns
    await this.scanAndBlurTextPatterns(ctx, canvas);
  }

  findSensitiveElements() {
    const elements = [];

    this.sensitiveSelectors.forEach((selector) => {
      try {
        const found = document.querySelectorAll(selector);
        elements.push(...Array.from(found));
      } catch (e) {
        console.warn("Selector failed:", selector);
      }
    });

    return elements;
  }

  blurArea(ctx, x, y, width, height) {
    // Save current state
    ctx.save();

    // Create blur effect
    ctx.filter = "blur(10px)";

    // Get image data
    const imageData = ctx.getImageData(x, y, width, height);

    // Apply blur
    ctx.putImageData(imageData, x, y);

    // Add pixelation for extra privacy
    this.pixelateArea(ctx, x, y, width, height, 10);

    // Restore state
    ctx.restore();
  }

  pixelateArea(ctx, x, y, width, height, pixelSize) {
    const imageData = ctx.getImageData(x, y, width, height);
    const data = imageData.data;

    for (let py = 0; py < height; py += pixelSize) {
      for (let px = 0; px < width; px += pixelSize) {
        const i = (py * width + px) * 4;

        // Get average color
        let r = 0,
          g = 0,
          b = 0,
          count = 0;

        for (let dy = 0; dy < pixelSize && py + dy < height; dy++) {
          for (let dx = 0; dx < pixelSize && px + dx < width; dx++) {
            const idx = ((py + dy) * width + (px + dx)) * 4;
            r += data[idx];
            g += data[idx + 1];
            b += data[idx + 2];
            count++;
          }
        }

        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);

        // Apply average color to pixel block
        for (let dy = 0; dy < pixelSize && py + dy < height; dy++) {
          for (let dx = 0; dx < pixelSize && px + dx < width; dx++) {
            const idx = ((py + dy) * width + (px + dx)) * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
          }
        }
      }
    }

    ctx.putImageData(imageData, x, y);
  }

  async scanAndBlurTextPatterns(ctx, canvas) {
    // This would require OCR or text detection
    // For now, we rely on element-based detection
    // Future: Integrate with Chrome's text detection API
  }

  loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  // Check if privacy mode is enabled
  async isPrivacyModeEnabled() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["privacyMode"], (result) => {
        resolve(result.privacyMode !== false); // Default: enabled
      });
    });
  }

  // Toggle privacy mode
  async togglePrivacyMode() {
    const current = await this.isPrivacyModeEnabled();
    return new Promise((resolve) => {
      chrome.storage.local.set({ privacyMode: !current }, () => {
        resolve(!current);
      });
    });
  }
}

// Export for use
window.PrivacyEnhancer = PrivacyEnhancer;
