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
  provider?: string;
}

const DEFAULT_MAX_FILE_SIZE = 25 * 1024 * 1024;
const UPLOAD_TIMEOUT_MS = 60_000;

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
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), 5000) : null;

  try {
    const response = await fetch(getStorageBaseUrl() + '/api/storage/status', {
      headers: getAuthorizationHeader(token),
      signal: controller?.signal,
    });
    const payload = await readJsonResponse(response);
    if (!response.ok) return { configured: false, maxFileSizeMb: 25 };
    return payload as StorageStatus;
  } catch {
    return { configured: false, maxFileSizeMb: 25 };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/** Uploads every workspace asset to the same-origin Cloudflare Worker and R2 bucket. */
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

  const baseUrl = getStorageBaseUrl();
  const endpoint = baseUrl ? `${baseUrl}/api/storage/upload` : '/api/storage/upload';
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS) : null;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: getAuthorizationHeader(token),
      body: formData,
      signal: controller?.signal,
    });
    const payload = await readJsonResponse(response);

    if (!response.ok || !payload.url) {
      throw new Error(payload.error || `R2 upload failed (${response.status}).`);
    }

    return {
      url: payload.url,
      key: payload.key,
      name: payload.name || originalName,
      size: payload.size ?? file.size,
      type: payload.type || (file as File).type || 'application/octet-stream',
      storageProvider: payload.provider || 'cloudflare_r2',
    };
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error('The R2 upload timed out. Check your connection and try again.');
    }
    throw error instanceof Error ? error : new Error('Unable to upload this file to R2.');
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
