// Screenshot Enhancer - Advanced features for screenshots
// Features: Zoom, Full Screen, Annotations, Filters, etc.

class ScreenshotEnhancer {
  constructor() {
    this.currentImage = null;
    this.imageEditor = null;
    this.isFullScreen = false;
    this.zoomLevel = 1;
  }

  // Initialize TUI Image Editor
  initImageEditor(container, imageUrl) {
    // Create editor instance
    this.imageEditor = new tui.ImageEditor(container, {
      includeUI: {
        loadImage: {
          path: imageUrl,
          name: "Screenshot"
        },
        theme: this.getCustomTheme(),
        menu: [
          "crop",
          "flip",
          "rotate",
          "draw",
          "shape",
          "icon",
          "text",
          "mask",
          "filter"
        ],
        initMenu: "filter",
        uiSize: {
          width: "100%",
          height: "600px"
        },
        menuBarPosition: "bottom"
      },
      cssMaxWidth: 1000,
      cssMaxHeight: 800,
      selectionStyle: {
        cornerSize: 20,
        rotatingPointOffset: 70
      }
    });

    return this.imageEditor;
  }

  // Custom theme matching our gradient design
  getCustomTheme() {
    return {
      "common.bi.image": "",
      "common.bisize.width": "0px",
      "common.bisize.height": "0px",
      "common.backgroundImage": "none",
      "common.backgroundColor": "#f9fafb",
      "common.border": "1px solid #e2e8f0",

      // Header
      "header.backgroundImage":
        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      "header.backgroundColor": "transparent",
      "header.border": "0px",

      // Load button
      "loadButton.backgroundColor": "#fff",
      "loadButton.border": "1px solid #ddd",
      "loadButton.color": "#222",
      "loadButton.fontFamily":
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      "loadButton.fontSize": "14px",

      // Download button
      "downloadButton.backgroundColor": "#667eea",
      "downloadButton.border": "1px solid #667eea",
      "downloadButton.color": "#fff",
      "downloadButton.fontFamily":
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      "downloadButton.fontSize": "14px",

      // Main icons
      "menu.normalIcon.color": "#667eea",
      "menu.activeIcon.color": "#764ba2",
      "menu.disabledIcon.color": "#ccc",
      "menu.hoverIcon.color": "#667eea",
      "menu.iconSize.width": "24px",
      "menu.iconSize.height": "24px",

      // Submenu icons
      "submenu.normalIcon.color": "#667eea",
      "submenu.activeIcon.color": "#764ba2",
      "submenu.iconSize.width": "32px",
      "submenu.iconSize.height": "32px",

      // Submenu primary color
      "submenu.backgroundColor": "#fff",
      "submenu.partition.color": "#e5e5e5",

      // Submenu labels
      "submenu.normalLabel.color": "#334155",
      "submenu.normalLabel.fontWeight": "normal",
      "submenu.activeLabel.color": "#667eea",
      "submenu.activeLabel.fontWeight": "bold",

      // Checkbox style
      "checkbox.border": "1px solid #ccc",
      "checkbox.backgroundColor": "#fff",

      // Range style
      "range.pointer.color": "#667eea",
      "range.bar.color": "#e2e8f0",
      "range.subbar.color": "#667eea",

      "range.disabledPointer.color": "#d3d3d3",
      "range.disabledBar.color": "#f5f5f5",
      "range.disabledSubbar.color": "#e5e5e5",

      "range.value.color": "#667eea",
      "range.value.fontWeight": "normal",
      "range.value.fontSize": "11px",
      "range.value.border": "0",
      "range.value.backgroundColor": "#f5f5f5",
      "range.title.color": "#334155",
      "range.title.fontWeight": "bold",

      // Colorpicker style
      "colorpicker.button.border": "0px",
      "colorpicker.title.color": "#334155"
    };
  }

  // Add zoom functionality
  addZoomControls(imageElement) {
    const zoomContainer = document.createElement("div");
    zoomContainer.className = "zoom-controls";
    zoomContainer.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      display: flex;
      gap: 8px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      padding: 8px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      z-index: 1000;
    `;

    const zoomButtons = [
      {
        icon: "🔍+",
        action: () => this.zoomIn(imageElement),
        title: "Zoom In"
      },
      {
        icon: "🔍-",
        action: () => this.zoomOut(imageElement),
        title: "Zoom Out"
      },
      {
        icon: "↺",
        action: () => this.resetZoom(imageElement),
        title: "Reset Zoom"
      },
      {
        icon: "⛶",
        action: () => this.toggleFullScreen(imageElement),
        title: "Full Screen"
      }
    ];

    zoomButtons.forEach((btn) => {
      const button = document.createElement("button");
      button.textContent = btn.icon;
      button.title = btn.title;
      button.style.cssText = `
        width: 36px;
        height: 36px;
        border: none;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.3s;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      button.addEventListener("mouseenter", () => {
        button.style.transform = "scale(1.1)";
        button.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)";
      });

      button.addEventListener("mouseleave", () => {
        button.style.transform = "scale(1)";
        button.style.boxShadow = "none";
      });

      button.addEventListener("click", btn.action);
      zoomContainer.appendChild(button);
    });

    imageElement.parentElement.style.position = "relative";
    imageElement.parentElement.appendChild(zoomContainer);
  }

  zoomIn(imageElement) {
    this.zoomLevel = Math.min(this.zoomLevel + 0.25, 3);
    this.applyZoom(imageElement);
  }

  zoomOut(imageElement) {
    this.zoomLevel = Math.max(this.zoomLevel - 0.25, 0.5);
    this.applyZoom(imageElement);
  }

  resetZoom(imageElement) {
    this.zoomLevel = 1;
    this.applyZoom(imageElement);
  }

  applyZoom(imageElement) {
    imageElement.style.transform = `scale(${this.zoomLevel})`;
    imageElement.style.transformOrigin = "center center";
    imageElement.style.transition = "transform 0.3s ease";
  }

  toggleFullScreen(imageElement) {
    if (!this.isFullScreen) {
      this.enterFullScreen(imageElement);
    } else {
      this.exitFullScreen(imageElement);
    }
  }

  enterFullScreen(imageElement) {
    const overlay = document.createElement("div");
    overlay.className = "fullscreen-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.95);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease;
    `;

    const img = imageElement.cloneNode(true);
    img.style.cssText = `
      max-width: 90%;
      max-height: 90%;
      object-fit: contain;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      border-radius: 12px;
    `;

    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = "✕";
    closeBtn.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      width: 48px;
      height: 48px;
      border: none;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      color: white;
      font-size: 24px;
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.3s;
    `;

    closeBtn.addEventListener("mouseenter", () => {
      closeBtn.style.background = "rgba(255, 255, 255, 0.3)";
      closeBtn.style.transform = "scale(1.1)";
    });

    closeBtn.addEventListener("mouseleave", () => {
      closeBtn.style.background = "rgba(255, 255, 255, 0.2)";
      closeBtn.style.transform = "scale(1)";
    });

    closeBtn.addEventListener("click", () => {
      overlay.remove();
      this.isFullScreen = false;
    });

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.remove();
        this.isFullScreen = false;
      }
    });

    overlay.appendChild(img);
    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);
    this.isFullScreen = true;

    // Add keyboard support
    const handleKeyPress = (e) => {
      if (e.key === "Escape") {
        overlay.remove();
        this.isFullScreen = false;
        document.removeEventListener("keydown", handleKeyPress);
      }
    };
    document.addEventListener("keydown", handleKeyPress);
  }

  exitFullScreen(imageElement) {
    const overlay = document.querySelector(".fullscreen-overlay");
    if (overlay) {
      overlay.remove();
      this.isFullScreen = false;
    }
  }

  // Add annotation toolbar
  addAnnotationToolbar(imageElement) {
    const toolbar = document.createElement("div");
    toolbar.className = "annotation-toolbar";
    toolbar.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 8px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      padding: 12px;
      border-radius: 16px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      z-index: 1000;
    `;

    const tools = [
      {
        icon: "✏️",
        name: "Draw",
        action: () => this.enableDrawing(imageElement)
      },
      { icon: "📝", name: "Text", action: () => this.addText(imageElement) },
      { icon: "➡️", name: "Arrow", action: () => this.addArrow(imageElement) },
      { icon: "⬜", name: "Shape", action: () => this.addShape(imageElement) },
      {
        icon: "🎨",
        name: "Filter",
        action: () => this.openFilterMenu(imageElement)
      },
      { icon: "✂️", name: "Crop", action: () => this.enableCrop(imageElement) }
    ];

    tools.forEach((tool) => {
      const btn = document.createElement("button");
      btn.innerHTML = `${tool.icon}<br><span style="font-size: 10px;">${tool.name}</span>`;
      btn.title = tool.name;
      btn.style.cssText = `
        width: 60px;
        height: 60px;
        border: 2px solid transparent;
        background: white;
        color: #334155;
        border-radius: 12px;
        cursor: pointer;
        font-size: 20px;
        transition: all 0.3s;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
      `;

      btn.addEventListener("mouseenter", () => {
        btn.style.borderColor = "#667eea";
        btn.style.background =
          "linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)";
        btn.style.transform = "translateY(-4px)";
      });

      btn.addEventListener("mouseleave", () => {
        btn.style.borderColor = "transparent";
        btn.style.background = "white";
        btn.style.transform = "translateY(0)";
      });

      btn.addEventListener("click", tool.action);
      toolbar.appendChild(btn);
    });

    imageElement.parentElement.appendChild(toolbar);
  }

  // Placeholder methods for annotation tools
  enableDrawing(imageElement) {
    console.log("Drawing mode enabled");
    // Implementation would use canvas overlay
  }

  addText(imageElement) {
    console.log("Text tool activated");
    // Implementation would add text overlay
  }

  addArrow(imageElement) {
    console.log("Arrow tool activated");
    // Implementation would draw arrows
  }

  addShape(imageElement) {
    console.log("Shape tool activated");
    // Implementation would add shapes
  }

  openFilterMenu(imageElement) {
    console.log("Filter menu opened");
    // Implementation would show filter options
  }

  enableCrop(imageElement) {
    console.log("Crop mode enabled");
    // Implementation would enable cropping
  }

  // Add quick actions menu
  addQuickActions(imageElement) {
    const menu = document.createElement("div");
    menu.className = "quick-actions-menu";
    menu.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 1000;
    `;

    const actions = [
      { icon: "💾", title: "Save", action: () => this.saveImage(imageElement) },
      {
        icon: "📋",
        title: "Copy",
        action: () => this.copyToClipboard(imageElement)
      },
      {
        icon: "🔗",
        title: "Share",
        action: () => this.shareImage(imageElement)
      },
      {
        icon: "🗑️",
        title: "Delete",
        action: () => this.deleteImage(imageElement)
      }
    ];

    actions.forEach((action) => {
      const btn = document.createElement("button");
      btn.textContent = action.icon;
      btn.title = action.title;
      btn.style.cssText = `
        width: 44px;
        height: 44px;
        border: none;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 12px;
        cursor: pointer;
        font-size: 20px;
        transition: all 0.3s;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      `;

      btn.addEventListener("mouseenter", () => {
        btn.style.transform = "scale(1.1)";
        btn.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.15)";
      });

      btn.addEventListener("mouseleave", () => {
        btn.style.transform = "scale(1)";
        btn.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
      });

      btn.addEventListener("click", action.action);
      menu.appendChild(btn);
    });

    imageElement.parentElement.appendChild(menu);
  }

  saveImage(imageElement) {
    const link = document.createElement("a");
    link.href = imageElement.src;
    link.download = `screenshot_${Date.now()}.png`;
    link.click();
  }

  async copyToClipboard(imageElement) {
    try {
      const response = await fetch(imageElement.src);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob })
      ]);
      this.showNotification("✅ Copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
      this.showNotification("❌ Failed to copy");
    }
  }

  shareImage(imageElement) {
    if (navigator.share) {
      fetch(imageElement.src)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], "screenshot.png", {
            type: "image/png"
          });
          navigator.share({
            files: [file],
            title: "Screenshot",
            text: "Check out this screenshot"
          });
        });
    } else {
      this.showNotification("ℹ️ Sharing not supported");
    }
  }

  deleteImage(imageElement) {
    if (confirm("Are you sure you want to delete this screenshot?")) {
      imageElement.closest(".image-item")?.remove();
      this.showNotification("🗑️ Screenshot deleted");
    }
  }

  showNotification(message) {
    const notification = document.createElement("div");
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
      z-index: 10000;
      animation: slideInRight 0.3s ease, slideOutRight 0.3s ease 2.7s;
      font-weight: 600;
    `;

    const style = document.createElement("style");
    style.textContent = `
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

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }
}

// Export for use in editor
window.ScreenshotEnhancer = ScreenshotEnhancer;
