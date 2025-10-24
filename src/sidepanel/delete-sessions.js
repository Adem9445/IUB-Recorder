// delete-sessions.js
// Handles deleting all saved sessions

import { getStorageUsage } from "../utils/storage-manager.js";

const deleteBtn = document.getElementById("delete-sessions");

if (deleteBtn) {
  // Add hover effects via JavaScript (CSP compliant)
  deleteBtn.addEventListener("mouseover", () => {
    deleteBtn.style.transform = "translateY(-2px)";
    deleteBtn.style.boxShadow = "0 6px 20px rgba(239, 68, 68, 0.4)";
  });
  
  deleteBtn.addEventListener("mouseout", () => {
    deleteBtn.style.transform = "translateY(0)";
    deleteBtn.style.boxShadow = "none";
  });

  // Delete all sessions on click
  deleteBtn.addEventListener("click", async () => {
    // Confirm deletion
    const confirm = window.confirm(
      "Er du sikker på at du vil slette ALLE lagrede sessions?\n\n" +
      "Dette kan ikke angres!"
    );
    
    if (!confirm) return;
    
    try {
      // Get current storage usage
      const usageBefore = await getStorageUsage();
      
      // Delete all sessions and captures
      await chrome.storage.local.remove(["sessions", "captures"]);
      
      // Get new storage usage
      const usageAfter = await getStorageUsage();
      const freedMB = (usageBefore.mb - usageAfter.mb).toFixed(2);
      
      // Show success message
      showToast(`✅ Alle sessions slettet! ${freedMB}MB frigjort.`);
      
      console.log(`Deleted all sessions. Freed ${freedMB}MB of storage.`);
    } catch (error) {
      console.error("Failed to delete sessions:", error);
      showToast("❌ Feil ved sletting av sessions");
    }
  });
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 24px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    animation: slideUp 0.3s ease-in-out;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = "slideDown 0.3s ease-in-out";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
