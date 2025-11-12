// storage-manager.js
// Utilities for managing chrome.storage quota

/**
 * Get current storage usage
 */
export async function getStorageUsage() {
  return new Promise((resolve) => {
    chrome.storage.local.getBytesInUse(null, (bytes) => {
      const mb = (bytes / (1024 * 1024)).toFixed(2);
      const quota = 10; // Chrome extensions have 10MB quota
      const percentUsed = ((bytes / (quota * 1024 * 1024)) * 100).toFixed(1);
      
      resolve({
        bytes,
        mb,
        percentUsed,
        quota
      });
    });
  });
}

/**
 * Clear old sessions to free up space
 */
export async function cleanupOldSessions(keepCount = 3) {
  try {
    const result = await chrome.storage.local.get(['sessions']);
    const sessions = result.sessions || [];
    
    if (sessions.length <= keepCount) {
      console.log('No cleanup needed, only', sessions.length, 'sessions');
      return { cleaned: 0, remaining: sessions.length };
    }
    
    // Sort by timestamp (newest first)
    sessions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    // Keep only the newest sessions
    const toKeep = sessions.slice(0, keepCount);
    const removed = sessions.length - toKeep.length;
    
    await chrome.storage.local.set({ sessions: toKeep });
    
    console.log(`Cleaned up ${removed} old sessions, kept ${toKeep.length}`);
    return { cleaned: removed, remaining: toKeep.length };
  } catch (error) {
    console.error('Failed to cleanup sessions:', error);
    return { cleaned: 0, remaining: 0, error };
  }
}

/**
 * Clear all captures to free space
 */
export async function clearAllCaptures() {
  try {
    await chrome.storage.local.remove(['captures']);
    console.log('Cleared all captures from storage');
    return { success: true };
  } catch (error) {
    console.error('Failed to clear captures:', error);
    return { success: false, error };
  }
}

/**
 * Check if storage is getting full and warn user
 */
export async function checkStorageQuota() {
  const usage = await getStorageUsage();
  
  if (usage.percentUsed > 90) {
    console.warn('⚠️ Storage quota is critically low:', usage.percentUsed + '%');
    return {
      warning: true,
      level: 'critical',
      message: `Storage ${usage.percentUsed}% full! Delete old sessions to stay safe.`,
      usage
    };
  } else if (usage.percentUsed > 70) {
    console.warn('⚠️ Storage quota is getting high:', usage.percentUsed + '%');
    return {
      warning: true,
      level: 'high',
      message: `Storage ${usage.percentUsed}% full. Consider deleting older sessions.`,
      usage
    };
  }
  
  return { warning: false, usage };
}

/**
 * Auto cleanup when quota is exceeded
 */
export async function autoCleanupIfNeeded() {
  const check = await checkStorageQuota();
  
  if (check.warning && check.level === 'critical') {
    console.log('Auto-cleaning old sessions...');
    const result = await cleanupOldSessions(2); // Keep only 2 newest
    await clearAllCaptures(); // Clear captures array
    
    const newUsage = await getStorageUsage();
    console.log(`Cleanup complete. Storage now at ${newUsage.percentUsed}%`);
    
    return {
      cleaned: true,
      oldUsage: check.usage,
      newUsage,
      sessionsRemoved: result.cleaned
    };
  }
  
  return { cleaned: false };
}
