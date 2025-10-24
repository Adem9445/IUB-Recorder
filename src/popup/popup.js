document.getElementById("open-sidepanel").addEventListener("click", () => {
  console.log("Opening side panel...");
  chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT }, () => {
    if (chrome.runtime.lastError) {
      console.error("Error opening side panel:", chrome.runtime.lastError);
    } else {
      console.log("Side panel opened successfully.");
    }
  });
});

document.getElementById("open-editor").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("src/editor/editor.html") });
});

document.getElementById("open-options").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});
