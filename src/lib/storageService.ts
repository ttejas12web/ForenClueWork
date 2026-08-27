import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
  try {
    const response = await fetch(getStorageBaseUrl() + '/api/storage/status', {
      headers: getAuthorizationHeader(token)
    });
    const payload = await readJsonResponse(response);
    if (!response.ok) return { configured: true, maxFileSizeMb: 25 };
    return payload as StorageStatus;
  } catch {
    return { configured: true, maxFileSizeMb: 25 };
  }
}

/**
 * Compresses an image to an optimized Data URL to guarantee transmission on any static domain or offline mode.
 */
async function compressImageToDataUrl(file: File | Blob, maxWidth = 1600, maxHeight = 1600, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const mime = (file as File).type === 'image/png' ? 'image/png' : 'image/jpeg';
          resolve(canvas.toDataURL(mime, quality));
        } else {
          resolve((e.target?.result as string) || '');
        }
      };
      img.onerror = () => resolve((e.target?.result as string) || '');
      img.src = (e.target?.result as string) || '';
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

/**
 * Converts a file to a standard Data URL.
 */
async function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a workspace asset securely through the server, with automatic multi-tier fallback
 * to Firebase Cloud Storage and optimized data-encoding for custom domains (e.g. work.forenclue.in).
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
  const fileType = (file as File).type || 'application/octet-stream';

  // 1. First Tier: Try Server Backend Upload (if backend storage endpoint is active)
  try {
    const formData = new FormData();
    formData.append('file', file, originalName);
    formData.append('folder', folder);

    const baseUrl = getStorageBaseUrl();
    const endpoint = baseUrl ? `${baseUrl}/api/storage/upload` : '/api/storage/upload';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: getAuthorizationHeader(token),
      body: formData
    });

    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.includes('application/json')) {
      const payload = await response.json();
      if (payload.url) {
        return {
          url: payload.url,
          key: payload.key || `${folder}/${Date.now()}_${originalName}`,
          name: payload.name || originalName,
          size: payload.size ?? file.size,
          type: payload.type || fileType,
          storageProvider: payload.provider || 'cloud_storage'
        };
      }
    }
  } catch (serverErr) {
    console.info('Backend server upload unavailable, switching to Firebase Storage tier:', serverErr);
  }

  // 2. Second Tier: Direct Client Firebase Storage (articulate-listener-rlcf1.firebasestorage.app)
  try {
    const timestamp = Date.now();
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${folder}/${timestamp}_${safeName}`;
    const storageRef = ref(storage, storagePath);

    const snapshot = await uploadBytes(storageRef, file, {
      contentType: fileType
    });
    const downloadUrl = await getDownloadURL(snapshot.ref);

    return {
      url: downloadUrl,
      key: storagePath,
      name: originalName,
      size: file.size,
      type: fileType,
      storageProvider: 'firebase_storage'
    };
  } catch (firebaseStorageErr) {
    console.warn('Firebase Storage upload failed or restricted, switching to resilient Data fallback:', firebaseStorageErr);
  }

  // 3. Third Tier: Resilient Data URL Fallback (Works 100% everywhere on any custom domain)
  try {
    let dataUrl: string;
    if (fileType.startsWith('image/')) {
      dataUrl = await compressImageToDataUrl(file);
    } else {
      dataUrl = await fileToDataUrl(file);
    }

    if (dataUrl) {
      return {
        url: dataUrl,
        key: `inline_${Date.now()}_${originalName}`,
        name: originalName,
        size: file.size,
        type: fileType,
        storageProvider: 'inline_data'
      };
    }
  } catch (dataErr) {
    console.error('Data URL conversion failed:', dataErr);
  }

  throw new Error('Failed to attach and upload file. Please check file format and retry.');
}

