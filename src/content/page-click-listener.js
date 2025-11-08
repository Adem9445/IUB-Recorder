// Injected into active page to forward click events to background
(() => {
  // Prevent multiple instances of this script
  if (window.__IUB_CLICK_LISTENER_ACTIVE__) {
    console.debug("page-click-listener: Already active, skipping initialization");
    return;
  }
  window.__IUB_CLICK_LISTENER_ACTIVE__ = true;

  let lastClickTime = 0;
  let isProcessing = false;
  const DEBOUNCE_MS = 500; // Prevent duplicate clicks within 500ms
  const MAX_TEXT_LENGTH = 100; // Increased from 50 for better context
  let messageQueue = [];
  let flushTimeout = null;

  // Batch message sending to reduce overhead
  function flushMessageQueue() {
    if (messageQueue.length === 0) return;
    const messages = [...messageQueue];
    messageQueue = [];
    
    try {
      chrome.runtime.sendMessage({ 
        type: "PAGE_CLICK_BATCH", 
        messages 
      });
    } catch (err) {
      console.warn('page-click-listener: Failed to send batch', err);
    }
  }

  function clickHandler(e) {
    // Safety check: ensure we're not disconnected
    if (!window.__IUB_CLICK_LISTENER_ACTIVE__) {
      return;
    }
    const now = Date.now();

    // Prevent duplicate clicks
    if (isProcessing || now - lastClickTime < DEBOUNCE_MS) {
      console.log("page-click-listener: Ignoring duplicate click");
      return;
    }

    const isPointerEvent = e.type === "pointerdown";
    const pointerButton = typeof e.button === "number" ? e.button : 0;
    if (
      isPointerEvent &&
      pointerButton !== 0 &&
      e.pointerType !== "touch" &&
      e.pointerType !== "pen"
    ) {
      // Only react to primary button for mouse/pen; touch events allowed
      return;
    }

    isProcessing = true;
    lastClickTime = now;

    // Capture clicked element text with better error handling
    let elementText = "";
    try {
      if (!e.target) return;
      
      elementText = e.target.innerText || 
                    e.target.textContent || 
                    e.target.alt || 
                    e.target.title || 
                    e.target.ariaLabel || 
                    "";
      
      // Trim and limit length
      elementText = elementText.trim().slice(0, MAX_TEXT_LENGTH);
      
      // Sanitize to prevent issues
      elementText = elementText.replace(/[\r\n\t]+/g, ' ');
    } catch (err) {
      console.warn('page-click-listener: Error extracting text', err);
      elementText = "";
    }

    console.debug(
      "page-click-listener: click detected, elementText=",
      elementText
    );

    // If the clicked element is a button, prefix with navigation instruction
    if (e.target.tagName === "BUTTON" && elementText) {
      elementText = `Naviger hit ${elementText}`;
    }

    // Get click coordinates for drawing on screenshot
    const clickX = e.clientX;
    const clickY = e.clientY;
    
    try {
      // Queue message for batch sending to reduce overhead
      messageQueue.push({ 
        type: "PAGE_CLICK", 
        elementText, 
        timestamp: Date.now(),
        clickX,
        clickY
      });
      
      // Flush immediately if queue is getting large
      if (messageQueue.length >= 5) {
        clearTimeout(flushTimeout);
        flushMessageQueue();
      } else {
        // Otherwise batch within 300ms
        clearTimeout(flushTimeout);
        flushTimeout = setTimeout(flushMessageQueue, 300);
      }
    } catch (err) {
      console.warn('page-click-listener: Error queuing message', err);
    }
    
    // Reset processing flag shortly after sending
    setTimeout(() => {
      isProcessing = false;
    }, 100);
  }

  window.addEventListener("pointerdown", clickHandler, true);
  window.addEventListener("click", clickHandler, true);

  // Cleanup function
  function cleanup() {
    try {
      window.removeEventListener("pointerdown", clickHandler, true);
      window.removeEventListener("click", clickHandler, true);
      clearTimeout(flushTimeout);
      flushMessageQueue(); // Send any remaining messages
      isProcessing = false;
      lastClickTime = 0;
      messageQueue = [];
      window.__IUB_CLICK_LISTENER_ACTIVE__ = false;
      console.log("page-click-listener: Stopped and cleaned up");
    } catch (err) {
      console.error('page-click-listener: Cleanup error', err);
    }
  }

  // Listen for stop command to remove listener
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "stopRecording") {
      cleanup();
    }
  });

  // Cleanup on page unload to prevent memory leaks
  window.addEventListener('beforeunload', cleanup, { once: true });
  window.addEventListener('pagehide', cleanup, { once: true });

  console.debug("page-click-listener: Initialized successfully");
})();
