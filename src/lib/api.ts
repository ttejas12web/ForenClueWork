import { 
  authenticateWithFirestore, 
  fetchAllUsers, 
  createFirestoreUser, 
  updateFirestoreUserProfile, 
  updateFirestoreUserPassword, 
  fetchAllTasks, 
  createFirestoreTask, 
  updateFirestoreTask, 
  submitTaskDeliverable, 
  deleteFirestoreTask,
  fetchChatGroups,
  createFirestoreChatGroup,
  getOrCreateDirectChat,
  sendFirestoreMessage,
  deleteFirestoreChatGroup
} from './firestoreService';

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const windowApiUrl = (window as any).__API_URL__ || (window as any).__VITE_API_URL__;
    if (windowApiUrl && typeof windowApiUrl === 'string' && windowApiUrl.trim() !== '') {
      return windowApiUrl.trim().replace(/\/+$/, '');
    }

    try {
      const storedApi = localStorage.getItem('forenclue_api_url');
      if (storedApi && typeof storedApi === 'string' && storedApi.trim() !== '') {
        return storedApi.trim().replace(/\/+$/, '');
      }
    } catch {
      // Ignore local storage errors
    }
  }

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

export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const url = formatApiUrl(endpoint);
  const method = (options.method || 'GET').toUpperCase();
  const cleanEndpoint = endpoint.split('?')[0].replace(/\/+$/, '');

  // 1. If running on a static domain or Cloudflare pages without a dedicated backend server,
  // route directly through Firebase Firestore!
  try {
    const isStaticDeployment = !getApiBaseUrl() || window.location.hostname.includes('forenclue.in') || window.location.hostname.includes('pages.dev');
    
    // Check if it's an auth endpoint
    if (cleanEndpoint === '/api/auth/login' && method === 'POST') {
      try {
        const body = JSON.parse((options.body as string) || '{}');
        const user = await authenticateWithFirestore(body.identifier, body.password);
        const token = `fc_token_${user.id}_${Date.now()}`;
        return new Response(JSON.stringify({ token, user }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message || 'Invalid credentials' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // Try standard fetch first if not clearly a static fallback
    const res = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    if (!res.ok) {
      if (res.status === 405 || isStaticDeployment) {
        const fallbackData = await handleFirestoreFallback(cleanEndpoint, method, options);
        return new Response(JSON.stringify(fallbackData), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
    }
    return res;
  } catch (err: any) {
    // If fetch failed due to network / 405 / CORS on custom domain, execute via Firestore
    try {
      const fallbackData = await handleFirestoreFallback(cleanEndpoint, method, options);
      return new Response(JSON.stringify(fallbackData), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (fallbackErr: any) {
      return new Response(JSON.stringify({ error: fallbackErr.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }
}

async function handleFirestoreFallback(endpoint: string, method: string, options: RequestInit): Promise<any> {
  const body = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : {};

  if (endpoint === '/api/auth/login' && method === 'POST') {
    const user = await authenticateWithFirestore(body.identifier, body.password);
    const token = `fc_token_${user.id}_${Date.now()}`;
    return { token, user };
  }

  if (endpoint === '/api/users' && method === 'GET') {
    return await fetchAllUsers();
  }

  if (endpoint === '/api/auth/register' && method === 'POST') {
    return await createFirestoreUser(body);
  }

  if (endpoint === '/api/auth/profile' && method === 'PUT') {
    const userId = body.id || localStorage.getItem('auth_user_id') || '';
    await updateFirestoreUserProfile(userId, body);
    return { success: true, message: 'Profile updated' };
  }

  if (endpoint === '/api/auth/update-password' && method === 'POST') {
    const userId = body.id || localStorage.getItem('auth_user_id') || '';
    await updateFirestoreUserPassword(userId, body.newPassword);
    return { success: true, message: 'Password updated successfully' };
  }

  if (endpoint === '/api/upload' && method === 'POST') {
    if (options.body && options.body instanceof FormData) {
      const file = options.body.get('file') as File;
      if (file) {
        // Create a local object URL to serve as a mock uploaded image/file
        const mockUrl = URL.createObjectURL(file);
        return { success: true, url: mockUrl };
      }
    }
    return { success: true, url: 'https://via.placeholder.com/150' };
  }

  if (endpoint === '/api/tasks' && method === 'GET') {
    return await fetchAllTasks();
  }

  if (endpoint === '/api/tasks' && method === 'POST') {
    return await createFirestoreTask(body);
  }

  if (endpoint.startsWith('/api/tasks/') && method === 'PUT') {
    const taskId = endpoint.replace('/api/tasks/', '').split('/')[0];
    await updateFirestoreTask(taskId, body);
    return { success: true, message: 'Task updated' };
  }

  if (endpoint.startsWith('/api/tasks/') && method === 'DELETE') {
    const taskId = endpoint.replace('/api/tasks/', '').split('/')[0];
    await deleteFirestoreTask(taskId);
    return { success: true, message: 'Task deleted' };
  }

  if (endpoint === '/api/chat/groups' && method === 'GET') {
    const userId = localStorage.getItem('auth_user_id') || 'user_admin_001';
    return await fetchChatGroups(userId);
  }

  if (endpoint === '/api/chat/groups' && method === 'POST') {
    return await createFirestoreChatGroup(body);
  }

  if (endpoint === '/api/chat/direct' && method === 'POST') {
    const userId = localStorage.getItem('auth_user_id') || 'user_admin_001';
    return await getOrCreateDirectChat(userId, body.targetForenclueId);
  }

  if (endpoint.startsWith('/api/chat/groups/') && endpoint.endsWith('/messages') && method === 'GET') {
    // Return empty array for now or try to fetch once using db
    const { getDocs, collection, query, where, orderBy, limit } = await import('firebase/firestore');
    const { db } = await import('./firebase');
    const groupId = endpoint.split('/')[4];
    const q = query(
      collection(db, 'chat_messages'),
      where('groupId', '==', groupId),
      orderBy('createdAt', 'asc'),
      limit(100)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  }

  if (endpoint.startsWith('/api/chat/groups/') && endpoint.endsWith('/messages') && method === 'POST') {
    const groupId = endpoint.split('/')[4];
    await sendFirestoreMessage(groupId, body.senderId, body.content, body.attachmentUrl, body.attachmentName);
    return { success: true };
  }

  if (endpoint.startsWith('/api/chat/groups/') && method === 'DELETE') {
    const parts = endpoint.split('/');
    if (parts.length === 5) {
      // DELETE /api/chat/groups/:id
      const groupId = parts[4];
      await deleteFirestoreChatGroup(groupId);
      return { success: true };
    }
  }

  return { status: 'ok' };
}
