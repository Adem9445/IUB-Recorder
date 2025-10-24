// Local storage implementation
const workspace = document.getElementById("workspace");

// Load documents from local storage
function loadDocuments() {
  chrome.storage.local.get(["documents"], (result) => {
    if (result.documents) {
      workspace.innerHTML = result.documents
        .map((doc) => `<div class="document">${doc.title}</div>`)
        .join("");
    }
  });
}

// Initial load
loadDocuments();
