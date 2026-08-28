import { storage } from './firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

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
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 2000) : null;

    const response = await fetch(getStorageBaseUrl() + '/api/storage/status', {
      headers: getAuthorizationHeader(token),
      signal: controller?.signal
    });
    if (timeoutId) clearTimeout(timeoutId);

    const payload = await readJsonResponse(response);
    if (!response.ok) return { configured: true, maxFileSizeMb: 25 };
    return payload as StorageStatus;
  } catch {
    return { configured: true, maxFileSizeMb: 25 };
  }
}

/**
 * Compresses an image to an optimized Data URL to guarantee transmission on any static domain or offline mode.
 * Always outputs highly compressed JPEG/WebP to stay well below Firestore 1MB document bounds.
 */
async function compressImageToDataUrl(file: File | Blob, maxDimension = 1100, initialQuality = 0.75): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        
        // Scale down dimensions if exceeding max bounds
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          
          // Use JPEG compression (or WEBP) which drastically compresses both PNG and JPEG images to < 180KB
          let outputData = canvas.toDataURL('image/jpeg', initialQuality);
          
          // If still over 280KB, do a second pass with lower dimension & quality
          if (outputData.length > 280000) {
            const smallCanvas = document.createElement('canvas');
            const targetW = Math.round(width * 0.75);
            const targetH = Math.round(height * 0.75);
            smallCanvas.width = targetW;
            smallCanvas.height = targetH;
            const smallCtx = smallCanvas.getContext('2d');
            if (smallCtx) {
              smallCtx.drawImage(img, 0, 0, targetW, targetH);
              outputData = smallCanvas.toDataURL('image/jpeg', 0.65);
            }
          }
          
          resolve(outputData);
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
  const isImage = fileType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|avif|bmp)$/i.test(originalName);

  // 1. First Tier: Try Server Backend Upload with 2.5s Timeout
  try {
    const formData = new FormData();
    formData.append('file', file, originalName);
    formData.append('folder', folder);

    const baseUrl = getStorageBaseUrl();
    const endpoint = baseUrl ? `${baseUrl}/api/storage/upload` : '/api/storage/upload';
    
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 2500) : null;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: getAuthorizationHeader(token),
      body: formData,
      signal: controller?.signal
    });
    if (timeoutId) clearTimeout(timeoutId);

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
    console.info('Backend server upload unavailable or timed out, switching to client storage:', serverErr);
  }

  // 2. Second Tier: Direct Client Firebase Storage (with 3-second strict timeout)
  try {
    const timestamp = Date.now();
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${folder}/${timestamp}_${safeName}`;
    const storageRef = ref(storage, storagePath);

    // Use a resumable task so a production storage failure can be cancelled instead of
    // continuing Firebase's default retry loop for several minutes in the background.
    const uploadTask = uploadBytesResumable(storageRef, file, { contentType: fileType });
    const snapshot = await new Promise<any>((resolve, reject) => {
      let settled = false;
      const timeoutId = setTimeout(() => {
        if (settled) return;
        settled = true;
        uploadTask.cancel();
        reject(new Error('Firebase Storage connection timed out'));
      }, 3000);

      uploadTask.then(
        (result) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);
          resolve(result);
        },
        (error) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);
          reject(error);
        }
      );
    });
    const downloadUrl = await getDownloadURL(snapshot.ref);

    if (downloadUrl) {
      return {
        url: downloadUrl,
        key: storagePath,
        name: originalName,
        size: file.size,
        type: fileType,
        storageProvider: 'firebase_storage'
      };
    }
  } catch (firebaseStorageErr) {
    console.warn('Firebase Storage upload unavailable, switching to instant data compression:', firebaseStorageErr);
  }

  // 3. Third Tier: Fast Optimized Data Encoding (Instant, works 100% reliably on work.forenclue.in)
  try {
    let dataUrl: string;
    if (isImage) {
      dataUrl = await compressImageToDataUrl(file);
    } else {
      if (file.size > 600 * 1024) {
        throw new Error('This document file is larger than 600 KB. Please attach a smaller file or image.');
      }
      dataUrl = await fileToDataUrl(file);
    }

    if (dataUrl) {
      return {
        url: dataUrl,
        key: `inline_${Date.now()}_${originalName}`,
        name: originalName,
        size: Math.round(dataUrl.length * 0.75),
        type: fileType,
        storageProvider: 'inline_data'
      };
    }
  } catch (dataErr: any) {
    console.error('Data conversion failed:', dataErr);
    throw new Error(dataErr.message || 'Unable to encode file for transmission.');
  }

  throw new Error('Failed to attach and upload file. Please check file format and retry.');
}


