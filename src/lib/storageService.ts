export interface UploadResult {
  url: string;
  key: string;
  name: string;
  size: number;
  type: string;
  storageProvider?: string;
}

export interface StorageStatus {
  configured: boolean;
  maxFileSizeMb: number;
}

const DEFAULT_MAX_FILE_SIZE = 25 * 1024 * 1024;

function getStorageBaseUrl(): string {
  const metaEnv = (import.meta as any)?.env || {};
  const windowConfig = typeof window !== 'undefined' ? (window as any).__STORAGE_API_URL__ : '';
  return String(windowConfig || metaEnv.VITE_STORAGE_API_URL || '').trim().replace(/\/+$/, '');
}

function getAuthorizationHeader(token?: string | null): Record<string, string> {
  if (token) return { Authorization: 'Bearer ' + token };
  if (typeof localStorage === 'undefined') return {};
  const storedToken = localStorage.getItem('auth_token') || localStorage.getItem('token');
  return storedToken ? { Authorization: 'Bearer ' + storedToken } : {};
}

async function readJsonResponse(response: Response): Promise<any> {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { error: text || 'Unexpected storage response.' };
  }
}

export async function getStorageStatus(token?: string | null): Promise<StorageStatus> {
  const response = await fetch(getStorageBaseUrl() + '/api/storage/status', {
    headers: getAuthorizationHeader(token)
  });
  const payload = await readJsonResponse(response);
  if (!response.ok) throw new Error(payload.error || 'Storage status is unavailable.');
  return payload as StorageStatus;
}

/**
 * Uploads a workspace asset securely through the server.
 * Storage credentials and internal buckets are never exposed to the client.
 */
export async function uploadWorkspaceFile(
  file: File | Blob,
  fileName?: string,
  folder: string = 'uploads',
  token?: string | null
): Promise<UploadResult> {
  if (!file || file.size === 0) throw new Error('Choose a non-empty file to upload.');
  if (file.size > DEFAULT_MAX_FILE_SIZE) throw new Error('Files must be 25 MB or smaller.');

  const originalName = fileName || (file instanceof File ? file.name : 'file_' + Date.now());
  const formData = new FormData();
  formData.append('file', file, originalName);
  formData.append('folder', folder);

  const response = await fetch(getStorageBaseUrl() + '/api/storage/upload', {
    method: 'POST',
    headers: getAuthorizationHeader(token),
    body: formData
  });
  const payload = await readJsonResponse(response);
  if (!response.ok) {
    throw new Error(payload.error || 'File upload failed.');
  }

  return {
    url: payload.url,
    key: payload.key,
    name: payload.name || originalName,
    size: payload.size ?? file.size,
    type: payload.type || file.type || 'application/octet-stream',
    storageProvider: payload.provider || 'cloud_storage'
  };
}
