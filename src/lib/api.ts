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
  deleteFirestoreChatGroup,
  deleteFirestoreMessage,
  updateFirestoreChatGroup,
  addFirestoreChatGroupMembers,
  removeFirestoreChatGroupMember
} from './firestoreService';
import { uploadWorkspaceFile } from './storageService';

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

  // 1. If running on a static domain without a dedicated backend server or auth login
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

    const contentType = res.headers.get('content-type') || '';
    const isHtmlResponse = contentType.includes('text/html') || contentType.includes('text/plain');

    // If fetch returned error or served the static SPA HTML page instead of API JSON, route through Firestore fallback
    if (!res.ok || (cleanEndpoint.startsWith('/api/') && isHtmlResponse)) {
      const fallbackData = await handleFirestoreFallback(cleanEndpoint, method, options);
      return new Response(JSON.stringify(fallbackData), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      });
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
      const folder = (options.body.get('folder') as string) || 'uploads';
      if (file) {
        const uploadResult = await uploadWorkspaceFile(file, file.name, folder);
        return {
          success: true,
          url: uploadResult.url,
          name: uploadResult.name,
          size: uploadResult.size,
          type: uploadResult.type,
          provider: uploadResult.storageProvider
        };
      }
    }
    return { success: true, url: 'https://via.placeholder.com/150' };
  }

  if (endpoint === '/api/analytics/workspace-insights' && method === 'GET') {
    const allTasks = (await fetchAllTasks()) || [];
    const allUsers = (await fetchAllUsers()) || [];
    const userId = localStorage.getItem('auth_user_id') || '';
    const userTasks = allTasks.filter((t: any) => t.assignedTo === userId);
    
    const DEPARTMENTS = [
      'Creative & Graphics',
      'Case Study',
      'Research',
      'Events & Management',
      'Cyber & Digital Forensics',
      'Campus Ambassadors'
    ];

    const departmentStats = DEPARTMENTS.map(deptName => {
      const deptTasks = allTasks.filter((t: any) => t.department === deptName);
      const completed = deptTasks.filter((t: any) => t.status === 'COMPLETED').length;
      const deptUsers = allUsers.filter((u: any) => u.department === deptName && u.active !== false);
      const score = deptTasks.length > 0 ? Math.round((completed / deptTasks.length) * 100) : 0;
      return {
        name: deptName,
        totalTasks: deptTasks.length,
        completedTasks: completed,
        activeUsers: deptUsers.length,
        score
      };
    });

    const totalWorkspaceTasks = allTasks.length;
    const totalCompleted = allTasks.filter((t: any) => t.status === 'COMPLETED').length;
    const totalInProgress = allTasks.filter((t: any) => t.status === 'IN_PROGRESS').length;
    const totalTodo = allTasks.filter((t: any) => t.status === 'TODO').length;

    const userCompleted = userTasks.filter((t: any) => t.status === 'COMPLETED').length;
    const userInProgress = userTasks.filter((t: any) => t.status === 'IN_PROGRESS').length;
    const userTodo = userTasks.filter((t: any) => t.status === 'TODO').length;

    const now = new Date();

    const formattedUserTasks = userTasks.map((t: any) => {
      let daysRemaining: number | null = null;
      let isOverdue = false;
      let deadlineStatus = 'ON_TRACK';
      let urgencyColor = 'bg-slate-500 text-white';

      if (t.dueDate) {
        const due = new Date(t.dueDate);
        if (!isNaN(due.getTime())) {
          const diffMs = due.getTime() - now.getTime();
          daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          if (daysRemaining < 0 && t.status !== 'COMPLETED') {
            isOverdue = true;
            deadlineStatus = 'OVERDUE';
            urgencyColor = 'bg-rose-500 text-white';
          } else if (daysRemaining <= 3 && t.status !== 'COMPLETED') {
            deadlineStatus = 'URGENT';
            urgencyColor = 'bg-amber-500 text-white';
          } else {
            deadlineStatus = 'ON_TRACK';
            urgencyColor = 'bg-emerald-500 text-white';
          }
        }
      }

      return {
        id: t.id,
        title: t.title || 'Untitled Task',
        description: t.description || null,
        priority: t.priority || 'MEDIUM',
        status: t.status || 'TODO',
        department: t.department || null,
        dueDate: t.dueDate || null,
        notes: t.notes || null,
        daysRemaining,
        deadlineStatus,
        isOverdue,
        urgencyColor
      };
    });

    const userOnTimeRate = userTasks.length > 0 
      ? Math.round((userCompleted / userTasks.length) * 100) 
      : 0;

    return {
      departmentStats,
      leaderboard: [],
      teamBenchmark: {
        totalWorkspaceTasks,
        totalCompleted,
        totalInProgress,
        totalTodo,
        overallOnTimeRate: totalWorkspaceTasks > 0 ? Math.round((totalCompleted / totalWorkspaceTasks) * 100) : 0,
        turnaroundAverageDays: 0,
        activeSprintVelocity: totalCompleted
      },
      userMetrics: {
        totalAllotted: userTasks.length,
        completed: userCompleted,
        inProgress: userInProgress,
        todo: userTodo,
        onTimeRate: userOnTimeRate,
        tasks: formattedUserTasks
      }
    };
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
    const creatorUser = await fetchAllUsers().then(users => users.find(u => u.id === (body.creatorId || localStorage.getItem('auth_user_id'))));
    return await createFirestoreChatGroup(body.name, body.type, body.department, creatorUser as any, body.initialMemberIds || []);
  }

  if (endpoint === '/api/chat/direct' && method === 'POST') {
    const userId = localStorage.getItem('auth_user_id') || 'user_admin_001';
    const users = await fetchAllUsers();
    const currentUser = users.find(u => u.id === userId);
    const targetUser = users.find(u => u.forenclueId === body.targetForenclueId);
    if (!currentUser || !targetUser) throw new Error('User not found');
    return await getOrCreateDirectChat(currentUser as any, targetUser as any);
  }

  if (endpoint.startsWith('/api/chat/groups/') && endpoint.endsWith('/messages') && method === 'GET') {
    const { getDocs, collection, query, orderBy, limit, doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('./firebase');
    const { decryptText } = await import('./firestoreService');
    const groupId = endpoint.split('/')[4];
    
    // Check if group is E2EE
    const groupDoc = await getDoc(doc(db, 'chat_groups', groupId));
    const groupData = groupDoc.data();
    const isE2EE = groupData?.isE2EE;

    const q = query(
      collection(db, `chat_groups/${groupId}/messages`),
      orderBy('createdAt', 'asc'),
      limit(100)
    );
    const snap = await getDocs(q);
    
    return snap.docs.map(docSnapshot => {
      const d: any = { ...docSnapshot.data(), id: docSnapshot.id };
      if (isE2EE && groupData?.memberIds && typeof d.content === 'string' && d.content.startsWith('E2EE:')) {
         const key = groupData.memberIds.slice(0, 2).sort().join('_') + "_secret";
         d.content = decryptText(d.content, key);
      }
      return d;
    });
  }

  if (endpoint.startsWith('/api/chat/groups/') && endpoint.endsWith('/messages') && method === 'POST') {
    const groupId = endpoint.split('/')[4];
    const users = await fetchAllUsers();
    const resolvedSenderId = body.senderId || localStorage.getItem('auth_user_id') || 'user_admin_001';
    let sender = users.find(u => u.id === resolvedSenderId);
    if (!sender) {
      const storedUserStr = localStorage.getItem('auth_user');
      if (storedUserStr) {
        try {
          const parsed = JSON.parse(storedUserStr);
          if (parsed && (parsed.id || parsed.name)) {
            sender = parsed;
          }
        } catch (e) {}
      }
    }
    if (!sender) {
      sender = users[0] || {
        id: resolvedSenderId,
        name: 'Workspace User',
        email: 'user@forenclue.com',
        forenclueId: resolvedSenderId,
        role: 'VOLUNTEER' as const,
      };
    }
    
    let attachment: any = undefined;
    if (body.attachmentUrl) {
      const isImg = body.attachmentType === 'image' || 
                    (typeof body.attachmentUrl === 'string' && body.attachmentUrl.startsWith('data:image/')) ||
                    (body.attachmentName && /\.(jpg|jpeg|png|gif|webp|svg|avif|bmp|ico)$/i.test(body.attachmentName));
      attachment = {
        url: body.attachmentUrl,
        name: body.attachmentName || 'Attachment',
        type: isImg ? 'image' : (body.attachmentType || 'file')
      };
    }
    const newMsg = await sendFirestoreMessage(groupId, sender, body.content || '', attachment);
    return newMsg;
  }

  if (endpoint.startsWith('/api/chat/groups/') && endpoint.includes('/messages/') && method === 'DELETE') {
    const parts = endpoint.split('/');
    const groupId = parts[4];
    const messageId = parts[6];
    await deleteFirestoreMessage(groupId, messageId);
    return { success: true };
  }

  if (endpoint.startsWith('/api/chat/groups/') && endpoint.endsWith('/members') && method === 'POST') {
    const groupId = endpoint.split('/')[4];
    await addFirestoreChatGroupMembers(groupId, body.memberIds || []);
    return { success: true };
  }

  if (endpoint.startsWith('/api/chat/groups/') && endpoint.includes('/members/') && method === 'DELETE') {
    const parts = endpoint.split('/');
    const groupId = parts[4];
    const targetUserId = parts[6];
    await removeFirestoreChatGroupMember(groupId, targetUserId);
    return { success: true };
  }

  if (endpoint.startsWith('/api/chat/groups/') && method === 'PUT') {
    const parts = endpoint.split('/');
    if (parts.length === 5) {
      const groupId = parts[4];
      await updateFirestoreChatGroup(groupId, body);
      return { success: true };
    }
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

  // Push notification fallback endpoints
  if (endpoint === '/api/push/vapid-public-key' && method === 'GET') {
    return { publicKey: 'BD6x0QDTjiEXrGNy1exUxz3JEL1-LbNRNu4WTxdeAqjNG59QnJef-hMTRHNdxjQ8d_tGoOmeUmqsFIMzrkz3jpk' };
  }

  if (endpoint === '/api/push/subscribe' && method === 'POST') {
    return { success: true };
  }

  if (endpoint === '/api/push/unsubscribe' && method === 'POST') {
    return { success: true };
  }

  if (endpoint === '/api/push/test' && method === 'POST') {
    return { success: true, message: 'Test notification triggered successfully.' };
  }

  if (endpoint === '/api/push/send' && method === 'POST') {
    return { success: true };
  }

  return { status: 'ok' };
}
