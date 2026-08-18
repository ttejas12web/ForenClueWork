export function getApiBaseUrl(): string {
  const metaEnv = (import.meta as any)?.env || {};
  const envUrl = (metaEnv.VITE_API_URL || metaEnv.VITE_API_BASE_URL || '') as string;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return '';
}

export function formatApiUrl(endpoint: string): string {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const base = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${cleanEndpoint}`;
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = formatApiUrl(endpoint);
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
      }
      return data;
    } else {
      const text = await res.text();
      if (!res.ok) {
        if (res.status === 405) {
          throw new Error('Server returned HTTP 405 (Method Not Allowed). The request reached a static web host or proxy that is not forwarding API calls to the Node.js backend. Please ensure the backend server is running and reverse proxy passes /api/* to the backend.');
        }
        throw new Error(`Server returned status ${res.status}. Please ensure backend is running.`);
      }
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    }
  } catch (err: any) {
    if (err.message && err.message.includes('Failed to fetch')) {
      throw new Error('Network connection error. Please check your internet connection or domain configuration.');
    }
    throw err;
  }
}

