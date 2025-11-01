import {
  createCloudClient,
  getDefaultCloudSettings,
  getDefaultCloudTokens,
  PROVIDERS
} from "./cloud-storage.js";

const META_KEY = "cloudStorageMeta";
const SIGNATURE_KEY = "cloudStorageSignature";
const REMOTE_REFRESH_INTERVAL = 60 * 1000; // 1 minute

const encoder = new TextEncoder();

async function digestSessions(sessions) {
  try {
    const serialised = JSON.stringify(sessions || []);
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(serialised));
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch (error) {
    console.warn("[session-sync] Failed to hash sessions", error);
    return null;
  }
}

function mergeSessions(localSessions, remoteSessions) {
  if (!Array.isArray(remoteSessions) || remoteSessions.length === 0) {
    return { sessions: localSessions, changed: false };
  }

  const map = new Map();
  const insert = (items = []) => {
    items.forEach((session) => {
      if (!session) return;
      const key = String(session.id || session.timestamp || session.title || Math.random());
      const existing = map.get(key);
      if (!existing || (session.timestamp || 0) >= (existing.timestamp || 0)) {
        map.set(key, session);
      }
    });
  };

  insert(remoteSessions);
  insert(localSessions);

  const merged = Array.from(map.values()).sort(
    (a, b) => (b?.timestamp || 0) - (a?.timestamp || 0)
  );

  if (!Array.isArray(localSessions) || localSessions.length !== merged.length) {
    return { sessions: merged, changed: true };
  }

  const changed = merged.some((session, index) => {
    try {
      return JSON.stringify(session) !== JSON.stringify(localSessions[index]);
    } catch (error) {
      console.warn("[session-sync] Failed to compare sessions", error);
      return true;
    }
  });

  return { sessions: merged, changed };
}

function withPromise(cb) {
  return new Promise((resolve) => cb(resolve));
}

async function readSettings() {
  const [syncData, localData] = await Promise.all([
    withPromise((resolve) => chrome.storage.sync.get(["cloudStorageSettings"], resolve)),
    withPromise((resolve) => chrome.storage.local.get(["cloudStorageTokens"], resolve))
  ]);

  const settings = {
    ...getDefaultCloudSettings(),
    ...(syncData?.cloudStorageSettings || {})
  };

  const tokens = {
    ...getDefaultCloudTokens(),
    ...((localData?.cloudStorageTokens) || {})
  };

  return { settings, tokens };
}

async function readLocalSessions() {
  const data = await withPromise((resolve) => chrome.storage.local.get(["sessions"], resolve));
  return data.sessions || [];
}

async function writeLocalSessions(sessions) {
  await chrome.storage.local.set({ sessions });
}

async function readSignature() {
  const data = await withPromise((resolve) => chrome.storage.local.get([SIGNATURE_KEY], resolve));
  return data[SIGNATURE_KEY] || null;
}

async function writeMeta(meta) {
  const payload = {
    [META_KEY]: {
      ...meta,
      updatedAt: Date.now()
    }
  };
  await chrome.storage.local.set(payload);
}

async function writeSignature(signature) {
  await chrome.storage.local.set({ [SIGNATURE_KEY]: signature });
}

export async function getCloudSyncMeta() {
  const data = await withPromise((resolve) => chrome.storage.local.get([META_KEY], resolve));
  return data[META_KEY] || null;
}

class SessionSync {
  constructor() {
    this.client = null;
    this.settings = getDefaultCloudSettings();
    this.tokens = getDefaultCloudTokens();
    this.provider = PROVIDERS.LOCAL;
    this.lastRemoteFetch = 0;
    this.initialised = false;
    this.initialising = null;
  }

  async ensureInitialised(force = false) {
    if (this.initialising) {
      return this.initialising;
    }

    if (this.initialised && !force) {
      return true;
    }

    this.initialising = (async () => {
      const { settings, tokens } = await readSettings();
      this.settings = settings;
      this.tokens = tokens;
      this.provider = settings.provider || PROVIDERS.LOCAL;
      this.client = createCloudClient(this.provider, settings, tokens);
      this.initialised = true;
      this.lastRemoteFetch = 0;
      this.initialising = null;
      return true;
    })();

    return this.initialising;
  }

  async getActiveProvider() {
    await this.ensureInitialised();
    return this.provider;
  }

  async loadSessions({ forceRemote = false } = {}) {
    await this.ensureInitialised();
    const localSessions = await readLocalSessions();

    if (!this.client || this.provider === PROVIDERS.LOCAL) {
      return localSessions;
    }

    const now = Date.now();
    if (!forceRemote && now - this.lastRemoteFetch < REMOTE_REFRESH_INTERVAL) {
      return localSessions;
    }

    try {
      const remoteSessions = await this.client.loadSessions();
      this.lastRemoteFetch = Date.now();
      if (!remoteSessions) {
        return localSessions;
      }

      const { sessions: merged, changed } = mergeSessions(localSessions, remoteSessions);
      if (changed) {
        await writeLocalSessions(merged);
        const signature = await digestSessions(merged);
        if (signature) {
          await writeSignature(signature);
        }
      }
      return merged;
    } catch (error) {
      await writeMeta({
        provider: this.provider,
        status: "error",
        error: error.message
      });
      console.error("[session-sync] Remote load failed", error);
      return localSessions;
    }
  }

  async saveSessions(sessions) {
    await this.ensureInitialised();
    const normalised = Array.isArray(sessions) ? sessions : [];
    await writeLocalSessions(normalised);

    const previousSignature = await readSignature();
    const signature = await digestSessions(normalised);
    if (signature) {
      await writeSignature(signature);
    }

    if (!this.client || this.provider === PROVIDERS.LOCAL) {
      await writeMeta({ provider: this.provider, status: "local" });
      return { success: true, provider: this.provider, skipped: true };
    }

    try {
      if (signature && previousSignature && signature === previousSignature) {
        await writeMeta({ provider: this.provider, status: "cached" });
        return { success: true, provider: this.provider, skipped: true, reason: "unchanged" };
      }
    } catch (error) {
      console.warn("[session-sync] Failed to compare signatures", error);
    }

    try {
      const result = await this.client.saveSessions(normalised);
      if (result && result.success === false) {
        await writeMeta({
          provider: this.provider,
          status: "error",
          error: result.reason || result.error || "Ukonfigurert skylagring"
        });
        return { success: false, provider: this.provider, error: result.reason || result.error };
      }
      await writeMeta({ provider: this.provider, status: "synced" });
      this.lastRemoteFetch = Date.now();
      return { success: true, provider: this.provider, remote: result };
    } catch (error) {
      await writeMeta({ provider: this.provider, status: "error", error: error.message });
      console.error("[session-sync] Remote save failed", error);
      return { success: false, provider: this.provider, error: error.message };
    }
  }
}

export const sessionSync = new SessionSync();
