// open-workspace.js
// Opens the editor workspace in a new tab
const openBtn = document.getElementById("open-workspace");
if (openBtn) {
  openBtn.addEventListener("click", () => {
    // Use standalone editor (no external dependencies)
    chrome.tabs.create({
      url: chrome.runtime.getURL("src/editor/editor-standalone.html")
    });
  });
}
