const DEFAULT_FILE_NAME = "iub-recorder-sessions.json";

export const PROVIDERS = {
  LOCAL: "local",
  DROPBOX: "dropbox",
  ONEDRIVE: "onedrive",
  GDRIVE: "gdrive"
};

const DROPBOX_DOWNLOAD_URL = "https://content.dropboxapi.com/2/files/download";
const DROPBOX_UPLOAD_URL = "https://content.dropboxapi.com/2/files/upload";
const ONEDRIVE_BASE_URL = "https://graph.microsoft.com/v1.0/me/drive/root:";
const GDRIVE_METADATA_URL = "https://www.googleapis.com/drive/v3/files";
const GDRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files";

function normalisePath(path, fallback) {
  if (!path || typeof path !== "string") {
    return fallback;
  }
  if (!path.startsWith("/")) {
    return `/${path}`;
  }
  return path;
}

function ensureFileName(name) {
  if (!name || typeof name !== "string") {
    return DEFAULT_FILE_NAME;
  }
  return name.trim() || DEFAULT_FILE_NAME;
}

class DropboxClient {
  constructor(settings = {}, tokens = {}) {
    this.token = tokens.dropboxToken || "";
    this.path = normalisePath(settings.dropboxPath, "/Apps/IUB-Recorder");
    this.fileName = ensureFileName(settings.fileName);
  }

  get isConfigured() {
    return Boolean(this.token);
  }

  get remotePath() {
    return `${this.path}/${this.fileName}`.replace(/\/+/g, "/");
  }

  async loadSessions() {
    if (!this.isConfigured) {
      return null;
    }

    const headers = {
      Authorization: `Bearer ${this.token}`,
      "Dropbox-API-Arg": JSON.stringify({ path: this.remotePath })
    };

    try {
      const response = await fetch(DROPBOX_DOWNLOAD_URL, {
        method: "POST",
        headers
      });

      if (response.status === 409) {
        // File does not exist yet
        return [];
      }

      if (!response.ok) {
        throw new Error(`Dropbox download failed (${response.status})`);
      }

      const text = await response.text();
      return parseRemoteSessions(text);
    } catch (error) {
      throw new Error(`Dropbox fetch error: ${error.message}`);
    }
  }

  async saveSessions(sessions) {
    if (!this.isConfigured) {
      return { success: false, skipped: true, reason: "missing-token" };
    }

    const body = JSON.stringify(buildRemotePayload(sessions));
    const headers = {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/octet-stream",
      "Dropbox-API-Arg": JSON.stringify({
        path: this.remotePath,
        mode: "overwrite",
        mute: true,
        autorename: false
      })
    };

    const response = await fetch(DROPBOX_UPLOAD_URL, {
      method: "POST",
      headers,
      body
    });

    if (!response.ok) {
      const message = await safeErrorMessage(response);
      throw new Error(`Dropbox upload failed (${response.status}): ${message}`);
    }

    return { success: true, status: response.status };
  }
}

class OneDriveClient {
  constructor(settings = {}, tokens = {}) {
    this.token = tokens.oneDriveToken || "";
    this.path = normalisePath(settings.oneDrivePath, "/Documents/IUB-Recorder");
    this.fileName = ensureFileName(settings.fileName);
  }

  get isConfigured() {
    return Boolean(this.token);
  }

  get basePath() {
    return `${this.path}/${this.fileName}`.replace(/\/+/g, "/");
  }

  buildUrl() {
    return `${ONEDRIVE_BASE_URL}${encodeURI(this.basePath)}:/content`;
  }

  async loadSessions() {
    if (!this.isConfigured) {
      return null;
    }

    const response = await fetch(this.buildUrl(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.token}`
      }
    });

    if (response.status === 404) {
      return [];
    }

    if (!response.ok) {
      const message = await safeErrorMessage(response);
      throw new Error(`OneDrive download failed (${response.status}): ${message}`);
    }

    const text = await response.text();
    return parseRemoteSessions(text);
  }

  async saveSessions(sessions) {
    if (!this.isConfigured) {
      return { success: false, skipped: true, reason: "missing-token" };
    }

    const response = await fetch(this.buildUrl(), {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(buildRemotePayload(sessions))
    });

    if (!response.ok) {
      const message = await safeErrorMessage(response);
      throw new Error(`OneDrive upload failed (${response.status}): ${message}`);
    }

    return { success: true, status: response.status };
  }
}

class GoogleDriveClient {
  constructor(settings = {}, tokens = {}) {
    this.token = tokens.googleDriveToken || "";
    this.fileId = settings.googleDriveFileId || "";
    this.fileName = ensureFileName(settings.fileName);
    this.parentId = settings.googleDriveFolderId || "";
  }

  get isConfigured() {
    return Boolean(this.token && (this.fileId || this.parentId));
  }

  async ensureFileExists() {
    if (this.fileId) {
      return this.fileId;
    }

    const metadata = {
      name: this.fileName,
      mimeType: "application/json"
    };

    if (this.parentId) {
      metadata.parents = [this.parentId];
    }

    const response = await fetch(`${GDRIVE_METADATA_URL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(metadata)
    });

    if (!response.ok) {
      const message = await safeErrorMessage(response);
      throw new Error(`Google Drive create failed (${response.status}): ${message}`);
    }

    const data = await response.json();
    this.fileId = data.id;
    return this.fileId;
  }

  async loadSessions() {
    if (!this.isConfigured) {
      return null;
    }

    const fileId = this.fileId;
    if (!fileId) {
      return [];
    }

    const response = await fetch(`${GDRIVE_METADATA_URL}/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${this.token}`
      }
    });

    if (response.status === 404) {
      return [];
    }

    if (!response.ok) {
      const message = await safeErrorMessage(response);
      throw new Error(`Google Drive download failed (${response.status}): ${message}`);
    }

    const text = await response.text();
    return parseRemoteSessions(text);
  }

  async saveSessions(sessions) {
    if (!this.isConfigured) {
      return { success: false, skipped: true, reason: "missing-token" };
    }

    const fileId = await this.ensureFileExists();
    const response = await fetch(`${GDRIVE_UPLOAD_URL}/${fileId}?uploadType=media`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(buildRemotePayload(sessions))
    });

    if (!response.ok) {
      const message = await safeErrorMessage(response);
      throw new Error(`Google Drive upload failed (${response.status}): ${message}`);
    }

    return { success: true, status: response.status };
  }
}

function parseRemoteSessions(text) {
  if (!text) return [];
  try {
    const data = JSON.parse(text);
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.sessions)) return data.sessions;
    return [];
  } catch (error) {
    throw new Error(`Invalid session payload: ${error.message}`);
  }
}

function buildRemotePayload(sessions) {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    sessions: Array.isArray(sessions) ? sessions : []
  };
}

async function safeErrorMessage(response) {
  try {
    const text = await response.text();
    if (!text) return "";
    const data = JSON.parse(text);
    return data?.error?.message || data?.message || text;
  } catch (error) {
    return error.message;
  }
}

export function createCloudClient(provider, settings = {}, tokens = {}) {
  switch (provider) {
    case PROVIDERS.DROPBOX:
      return new DropboxClient(settings, tokens);
    case PROVIDERS.ONEDRIVE:
      return new OneDriveClient(settings, tokens);
    case PROVIDERS.GDRIVE:
      return new GoogleDriveClient(settings, tokens);
    default:
      return null;
  }
}

export function getDefaultCloudSettings() {
  return {
    provider: PROVIDERS.LOCAL,
    fileName: DEFAULT_FILE_NAME,
    dropboxPath: "/Apps/IUB-Recorder",
    oneDrivePath: "/Documents/IUB-Recorder",
    googleDriveFileId: "",
    googleDriveFolderId: ""
  };
}

export function getDefaultCloudTokens() {
  return {
    dropboxToken: "",
    oneDriveToken: "",
    googleDriveToken: ""
  };
}
