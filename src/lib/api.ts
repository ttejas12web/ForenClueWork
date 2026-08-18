export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  try {
    const res = await fetch(endpoint, {
      ...options,
      headers: {
        ...options.headers,
      },
    });

    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
      }
      return data;
    } else {
      const text = await res.text();
      if (!res.ok) {
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
