(function applySelectiveMasking() {
  if (window.__IUB_PRIVACY_MASKS__?.cleanup) {
    window.__IUB_PRIVACY_MASKS__.cleanup();
  }

  const overlays = [];
  const MASK_STYLE_ID = "iub-privacy-mask-style";

  function ensureStyles() {
    if (document.getElementById(MASK_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = MASK_STYLE_ID;
    style.textContent = `
      .iub-privacy-mask {
        position: fixed;
        background: rgba(15, 23, 42, 0.58);
        backdrop-filter: blur(12px);
        border-radius: 6px;
        pointer-events: none;
        z-index: 2147483647;
        box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.35);
        transition: opacity 0.2s ease;
      }
      .iub-privacy-mask::after {
        content: attr(data-label);
        position: absolute;
        bottom: 100%;
        left: 0;
        transform: translateY(-4px);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: rgba(226, 232, 240, 0.95);
        background: rgba(30, 41, 59, 0.8);
        padding: 2px 6px;
        border-radius: 4px;
        pointer-events: none;
        white-space: nowrap;
      }
    `;
    document.head.appendChild(style);
  }

  function createMask(rect, label) {
    if (!rect || rect.width < 4 || rect.height < 4) {
      return null;
    }
    const mask = document.createElement("div");
    mask.className = "iub-privacy-mask";
    mask.style.top = `${Math.max(rect.top, 0)}px`;
    mask.style.left = `${Math.max(rect.left, 0)}px`;
    mask.style.width = `${rect.width}px`;
    mask.style.height = `${rect.height}px`;
    if (label) {
      mask.dataset.label = label;
    }
    document.body.appendChild(mask);
    overlays.push(mask);
    return mask;
  }

  function maskElement(element, label) {
    if (!element) return;
    const rects = element.getClientRects();
    const seen = new Set();
    for (const rect of rects) {
      const key = `${Math.round(rect.top)}-${Math.round(rect.left)}-${Math.round(rect.width)}-${Math.round(rect.height)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      createMask(rect, label);
    }
  }

  function scanForPatterns() {
    const patterns = [
      { regex: /\b(?:\d[ -]?){12,16}\b/, label: "Sensitive number" },
      { regex: /\b\d{6}[- ]?\d{5}\b/, label: "ID number" },
      { regex: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i, label: "Email" }
    ];

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node || !node.nodeValue || !node.parentElement) return NodeFilter.FILTER_SKIP;
        const value = node.nodeValue.trim();
        if (!value) return NodeFilter.FILTER_SKIP;
        for (const { regex } of patterns) {
          if (regex.test(value)) {
            return NodeFilter.FILTER_ACCEPT;
          }
        }
        return NodeFilter.FILTER_SKIP;
      }
    });

    const matches = [];
    while (walker.nextNode()) {
      matches.push(walker.currentNode);
    }

    matches.forEach((node) => {
      const parent = node.parentElement;
      if (!parent) return;
      maskElement(parent, "Sensitive text");
    });
  }

  ensureStyles();

  const sensitiveSelectors = [
    'input[type="password"]',
    'input[type="email"]',
    'input[type="tel"]',
    'input[type="text"][autocomplete*="cc"]',
    "input[data-sensitive]",
    "textarea[data-sensitive]",
    "[data-sensitive=true]",
    '[aria-label*="password"]',
    '[aria-label*="card"]',
    '[aria-label*="security code"]'
  ];

  sensitiveSelectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      maskElement(el, el.getAttribute("aria-label") || "Sensitive field");
    });
  });

  scanForPatterns();

  function cleanup() {
    overlays.forEach((overlay) => overlay.remove());
    overlays.length = 0;
    const style = document.getElementById(MASK_STYLE_ID);
    if (style) {
      style.remove();
    }
  }

  window.__IUB_PRIVACY_MASKS__ = { cleanup };

  // Automatically remove masks shortly after capture to avoid lingering UI
  setTimeout(() => {
    cleanup();
    if (window.__IUB_PRIVACY_MASKS__) {
      window.__IUB_PRIVACY_MASKS__ = null;
    }
  }, 4000);
})();
