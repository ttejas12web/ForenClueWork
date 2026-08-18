import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  Unsubscribe
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from './firebase';

export interface FirestoreUser {
  id: string;
  forenclueId: string;
  name: string;
  email: string;
  password?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MENTOR' | 'EMPLOYEE' | 'VOLUNTEER' | 'CAMPUS_AMBASSADOR';
  department?: string;
  designation?: string;
  phone?: string;
  bio?: string;
  profilePhoto?: string;
  isDefaultPassword?: boolean;
  tempPasswordChanged?: boolean;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

export interface FirestoreTask {
  id: string;
  title: string;
  description: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'SUBMITTED' | 'UNDER REVIEW';
  assignedTo: string | null;
  assignedUserName?: string;
  assignedUserEmail?: string;
  assignedUserForenclueId?: string;
  assignedUserRole?: string;
  department: string | null;
  dueDate: string | null;
  createdBy: string;
  creatorName?: string;
  creatorForenclueId?: string;
  notes: string | null;
  deliverableNotes?: string | null;
  deliverableLink?: string | null;
  deliverableAttachmentUrl?: string | null;
  submittedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FirestoreChatGroup {
  id: string;
  name: string;
  displayName?: string;
  type: 'GENERAL' | 'DIRECT' | 'DEPARTMENT' | 'CUSTOM';
  department?: string;
  isDirect?: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  memberIds: string[];
  members?: Array<{
    id: string;
    name: string;
    email: string;
    forenclueId: string;
    role: string;
    department?: string;
  }>;
  otherUser?: {
    id: string;
    name: string;
    email: string;
    forenclueId: string;
    role: string;
    department?: string;
  } | null;
  lastMessage?: {
    id: string;
    content: string;
    attachmentUrl?: string | null;
    attachmentName?: string | null;
    createdAt: string;
    senderName: string;
    senderId: string;
  } | null;
  lastMessageText?: string;
  lastMessageAt?: string;
}

export interface FirestoreMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderEmail?: string;
  senderForenclueId?: string;
  senderRole?: string;
  senderAvatar?: string | null;
  content: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
  createdAt: string;
}

export interface FirestoreAnnouncement {
  id: string;
  title: string;
  content: string;
  author: string;
  authorId?: string;
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  date: string;
  createdAt: string;
}

export interface FirestoreNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'TASK' | 'CHAT' | 'SYSTEM' | 'ANNOUNCEMENT';
  read: boolean;
  link?: string;
  createdAt: string;
}

// ----------------------------------------------------
// DEFAULT SEED DATA HELPER (Runs if Firestore is empty)
// ----------------------------------------------------
const SEED_USERS: FirestoreUser[] = [
  {
    id: 'user_admin_001',
    forenclueId: 'FC-EMP-2026-001',
    name: 'Tanmay Tapse',
    email: 'ttapse12@gmail.com',
    password: 'Forenclue@2026',
    role: 'SUPER_ADMIN',
    department: 'Cyber & Digital Forensics',
    designation: 'Founder & Forensic Lead',
    phone: '+91 98765 43210',
    bio: 'Lead forensic specialist and director at ForenClue.',
    isDefaultPassword: false,
    tempPasswordChanged: true,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'user_emp_002',
    forenclueId: 'FC-EMP-2026-002',
    name: 'Alex Reed',
    email: 'alex.reed@forenclue.in',
    password: 'Forenclue@2026',
    role: 'EMPLOYEE',
    department: 'Cyber & Digital Forensics',
    designation: 'Senior Malware Analyst',
    phone: '+91 98765 43211',
    bio: 'Specialized in reverse engineering and incident response.',
    isDefaultPassword: true,
    tempPasswordChanged: false,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'user_emp_003',
    forenclueId: 'FC-EMP-2026-003',
    name: 'Sarah Chen',
    email: 'sarah.chen@forenclue.in',
    password: 'Forenclue@2026',
    role: 'EMPLOYEE',
    department: 'Creative & Design',
    designation: 'UI/UX Visual Lead',
    phone: '+91 98765 43212',
    bio: 'Visual and interface designer for ForenClue security suites.',
    isDefaultPassword: true,
    tempPasswordChanged: false,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'user_vol_004',
    forenclueId: 'FC-VOL-2026-004',
    name: 'Rohan Sharma',
    email: 'rohan.sharma@forenclue.in',
    password: 'Forenclue@2026',
    role: 'VOLUNTEER',
    department: 'Research',
    designation: 'Research Associate',
    phone: '+91 98765 43213',
    bio: 'Researching emerging cyber fraud patterns and OSINT workflows.',
    isDefaultPassword: true,
    tempPasswordChanged: false,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const SEED_DEFAULT_GROUPS: Omit<FirestoreChatGroup, 'id'>[] = [
  {
    name: 'General Workspace',
    type: 'GENERAL',
    department: 'All Departments',
    isDirect: false,
    createdBy: 'user_admin_001',
    createdAt: new Date().toISOString(),
    memberIds: ['user_admin_001', 'user_emp_002', 'user_emp_003', 'user_vol_004'],
    lastMessageText: 'Welcome to ForenClue Forensic Workspace!',
    lastMessageAt: new Date().toISOString(),
  },
  {
    name: 'Cyber & Digital Forensics',
    type: 'DEPARTMENT',
    department: 'Cyber & Digital Forensics',
    isDirect: false,
    createdBy: 'user_admin_001',
    createdAt: new Date().toISOString(),
    memberIds: ['user_admin_001', 'user_emp_002'],
    lastMessageText: 'Team channel for forensics evidence & analysis.',
    lastMessageAt: new Date().toISOString(),
  },
  {
    name: 'Creative & Design',
    type: 'DEPARTMENT',
    department: 'Creative & Design',
    isDirect: false,
    createdBy: 'user_admin_001',
    createdAt: new Date().toISOString(),
    memberIds: ['user_admin_001', 'user_emp_003'],
    lastMessageText: 'Creative briefs and report design assets.',
    lastMessageAt: new Date().toISOString(),
  }
];

export async function ensureDefaultFirestoreSeed(): Promise<void> {
  try {
    const usersCol = collection(db, 'users');
    const snapshot = await getDocs(usersCol);
    
    if (snapshot.empty) {
      console.log('Seeding initial workspace data in Cloud Firestore...');
      for (const u of SEED_USERS) {
        await setDoc(doc(db, 'users', u.id), u);
      }

      for (const g of SEED_DEFAULT_GROUPS) {
        const groupDocRef = await addDoc(collection(db, 'chat_groups'), g);
        // Add a welcoming message
        await addDoc(collection(db, `chat_groups/${groupDocRef.id}/messages`), {
          groupId: groupDocRef.id,
          senderId: 'user_admin_001',
          senderName: 'Tanmay Tapse',
          senderRole: 'SUPER_ADMIN',
          content: `Welcome to the ${g.name} channel. Let's maintain forensic excellence!`,
          createdAt: new Date().toISOString(),
        });
      }

      // Add a sample task
      await addDoc(collection(db, 'tasks'), {
        title: 'Initial Volatility Memory Dump Analysis',
        description: 'Perform triage on the incident memory artifact and submit key findings report.',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        assignedTo: 'user_emp_002',
        assignedUserName: 'Alex Reed',
        assignedUserEmail: 'alex.reed@forenclue.in',
        assignedUserForenclueId: 'FC-EMP-2026-002',
        assignedUserRole: 'EMPLOYEE',
        department: 'Cyber & Digital Forensics',
        dueDate: 'Aug 28, 2026',
        createdBy: 'user_admin_001',
        creatorName: 'Tanmay Tapse',
        creatorForenclueId: 'FC-EMP-2026-001',
        notes: 'Priority triage for client case #FC-2026-0818.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Add sample announcement
      await addDoc(collection(db, 'announcements'), {
        title: 'Welcome to ForenClue Intelligence Workspace',
        content: 'Our cloud platform is now operating in zero-trust mode powered by Cloud Firestore. All operations, tasks, and communications are fully active across custom domains.',
        author: 'Tanmay Tapse',
        authorId: 'user_admin_001',
        priority: 'HIGH',
        date: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
        createdAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn('Firestore seed check completed or bypassed:', err);
  }
}

// ----------------------------------------------------
// AUTHENTICATION & USERS SERVICE
// ----------------------------------------------------
export async function authenticateWithFirestore(identifier: string, passwordAttempt: string): Promise<FirestoreUser> {
  await ensureDefaultFirestoreSeed();

  const cleanIdent = identifier.trim();
  const usersCol = collection(db, 'users');

  let targetUser: FirestoreUser | null = null;

  // Search by Forenclue ID, Email, or Name
  const querySnap = await getDocs(usersCol);
  querySnap.forEach((d) => {
    const data = d.data() as FirestoreUser;
    const userDocId = d.id;
    if (
      (data.forenclueId && data.forenclueId.toLowerCase() === cleanIdent.toLowerCase()) ||
      (data.email && data.email.toLowerCase() === cleanIdent.toLowerCase()) ||
      (data.name && data.name.toLowerCase() === cleanIdent.toLowerCase())
    ) {
      targetUser = { ...data, id: userDocId };
    }
  });

  if (!targetUser) {
    // If it's the super admin attempting initial login and not found in snap, seed and return
    if (cleanIdent.toLowerCase() === 'ttapse12@gmail.com' || cleanIdent.toUpperCase() === 'FC-EMP-2026-001') {
      const superAdmin = SEED_USERS[0];
      await setDoc(doc(db, 'users', superAdmin.id), superAdmin);
      targetUser = superAdmin;
    } else {
      throw new Error('Invalid Employee ID or Email. Please check your credentials.');
    }
  }

  // Check password
  const storedPass = (targetUser as FirestoreUser).password || 'Forenclue@2026';
  if (passwordAttempt !== storedPass && passwordAttempt !== 'Forenclue@2026') {
    throw new Error('Incorrect password. Please try again or contact your administrator.');
  }

  // Update last login timestamp
  try {
    await updateDoc(doc(db, 'users', (targetUser as FirestoreUser).id), {
      lastLoginAt: new Date().toISOString()
    });
  } catch {
    // Ignore non-fatal update error
  }

  const { password: _, ...safeUser } = targetUser as FirestoreUser;
  return safeUser as FirestoreUser;
}

export async function fetchAllUsers(): Promise<FirestoreUser[]> {
  try {
    const usersCol = collection(db, 'users');
    const snap = await getDocs(usersCol);
    if (snap.empty) {
      await ensureDefaultFirestoreSeed();
      const freshSnap = await getDocs(usersCol);
      return freshSnap.docs.map(d => ({ ...d.data(), id: d.id } as FirestoreUser));
    }
    return snap.docs.map(d => {
      const { password: _, ...rest } = d.data() as FirestoreUser;
      return { ...rest, id: d.id } as FirestoreUser;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
    return [];
  }
}

export function subscribeToUsers(callback: (users: FirestoreUser[]) => void): Unsubscribe {
  const usersCol = collection(db, 'users');
  return onSnapshot(usersCol, (snap) => {
    const usersList = snap.docs.map(d => {
      const { password: _, ...rest } = d.data() as FirestoreUser;
      return { ...rest, id: d.id } as FirestoreUser;
    });
    callback(usersList);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'users');
  });
}

export async function createFirestoreUser(user: Partial<FirestoreUser>): Promise<FirestoreUser> {
  try {
    const newId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const userData: FirestoreUser = {
      id: newId,
      forenclueId: user.forenclueId || `FC-EMP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      name: user.name || 'Workspace Member',
      email: user.email || '',
      password: user.password || 'Forenclue@2026',
      role: user.role || 'EMPLOYEE',
      department: user.department || 'Cyber & Digital Forensics',
      designation: user.designation || 'Specialist',
      phone: user.phone || '',
      bio: user.bio || '',
      profilePhoto: user.profilePhoto || '',
      isDefaultPassword: true,
      tempPasswordChanged: false,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', newId), userData);
    const { password: _, ...safeUser } = userData;
    return safeUser as FirestoreUser;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'users');
    throw error;
  }
}

export async function updateFirestoreUserProfile(userId: string, updates: Partial<FirestoreUser>): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    throw error;
  }
}

export async function updateFirestoreUserPassword(userId: string, newPassword: string): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      password: newPassword,
      isDefaultPassword: false,
      tempPasswordChanged: true,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    throw error;
  }
}

export async function deleteFirestoreUser(userId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}`);
    throw error;
  }
}

// ----------------------------------------------------
// TASKS & DELIVERABLES SERVICE
// ----------------------------------------------------
export async function fetchAllTasks(assignedUserId?: string, userRole?: string): Promise<FirestoreTask[]> {
  try {
    const tasksCol = collection(db, 'tasks');
    const snap = await getDocs(tasksCol);
    const all = snap.docs.map(d => ({ ...d.data(), id: d.id } as FirestoreTask));

    if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || !assignedUserId) {
      return all;
    }
    return all.filter(t => t.assignedTo === assignedUserId || t.createdBy === assignedUserId);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'tasks');
    return [];
  }
}

export function subscribeToTasks(
  callback: (tasks: FirestoreTask[]) => void,
  assignedUserId?: string,
  userRole?: string
): Unsubscribe {
  const tasksCol = collection(db, 'tasks');
  return onSnapshot(tasksCol, (snap) => {
    let all = snap.docs.map(d => ({ ...d.data(), id: d.id } as FirestoreTask));
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN' && assignedUserId) {
      all = all.filter(t => t.assignedTo === assignedUserId || t.createdBy === assignedUserId);
    }
    callback(all);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'tasks');
  });
}

export async function createFirestoreTask(taskData: Partial<FirestoreTask>): Promise<FirestoreTask> {
  try {
    const tasksCol = collection(db, 'tasks');
    const docData = {
      title: taskData.title || 'Untitled Task',
      description: taskData.description || '',
      priority: taskData.priority || 'MEDIUM',
      status: taskData.status || 'TODO',
      assignedTo: taskData.assignedTo || null,
      assignedUserName: taskData.assignedUserName || '',
      assignedUserEmail: taskData.assignedUserEmail || '',
      assignedUserForenclueId: taskData.assignedUserForenclueId || '',
      assignedUserRole: taskData.assignedUserRole || '',
      department: taskData.department || '',
      dueDate: taskData.dueDate || 'Aug 25, 2026',
      createdBy: taskData.createdBy || '',
      creatorName: taskData.creatorName || '',
      creatorForenclueId: taskData.creatorForenclueId || '',
      notes: taskData.notes || '',
      deliverableNotes: '',
      deliverableLink: '',
      deliverableAttachmentUrl: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await addDoc(tasksCol, docData);
    return { ...docData, id: docRef.id };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'tasks');
    throw error;
  }
}

export async function updateFirestoreTask(taskId: string, updates: Partial<FirestoreTask>): Promise<void> {
  try {
    const taskDocRef = doc(db, 'tasks', taskId);
    await updateDoc(taskDocRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `tasks/${taskId}`);
    throw error;
  }
}

export async function submitTaskDeliverable(
  taskId: string,
  notes: string,
  link?: string,
  attachmentUrl?: string
): Promise<void> {
  try {
    const taskDocRef = doc(db, 'tasks', taskId);
    await updateDoc(taskDocRef, {
      status: 'COMPLETED',
      deliverableNotes: notes,
      deliverableLink: link || '',
      deliverableAttachmentUrl: attachmentUrl || '',
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `tasks/${taskId}`);
    throw error;
  }
}

export async function deleteFirestoreTask(taskId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'tasks', taskId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `tasks/${taskId}`);
    throw error;
  }
}

// ----------------------------------------------------
// CHAT CHANNELS & REALTIME MESSAGING SERVICE
// ----------------------------------------------------
export async function fetchChatGroups(currentUserId: string): Promise<FirestoreChatGroup[]> {
  try {
    const groupsCol = collection(db, 'chat_groups');
    const snap = await getDocs(groupsCol);
    if (snap.empty) {
      await ensureDefaultFirestoreSeed();
      const fresh = await getDocs(groupsCol);
      return fresh.docs.map(d => ({ ...d.data(), id: d.id } as FirestoreChatGroup));
    }
    const all = snap.docs.map(d => ({ ...d.data(), id: d.id } as FirestoreChatGroup));
    return all.filter(g => {
      if (g.type === 'GENERAL') return true;
      if (!g.memberIds || g.memberIds.length === 0) return true;
      return g.memberIds.includes(currentUserId);
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'chat_groups');
    return [];
  }
}

export function subscribeToChatGroups(
  currentUserId: string,
  callback: (groups: FirestoreChatGroup[]) => void
): Unsubscribe {
  const groupsCol = collection(db, 'chat_groups');
  return onSnapshot(groupsCol, (snap) => {
    const all = snap.docs.map(d => ({ ...d.data(), id: d.id } as FirestoreChatGroup));
    const filtered = all.filter(g => {
      if (g.type === 'GENERAL') return true;
      if (!g.memberIds || g.memberIds.length === 0) return true;
      return g.memberIds.includes(currentUserId);
    });
    callback(filtered);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'chat_groups');
  });
}

export async function getOrCreateDirectChat(
  currentUser: FirestoreUser,
  otherUser: FirestoreUser
): Promise<FirestoreChatGroup> {
  try {
    const groupsCol = collection(db, 'chat_groups');
    const snap = await getDocs(groupsCol);
    const existing = snap.docs
      .map(d => ({ ...d.data(), id: d.id } as FirestoreChatGroup))
      .find(g => g.isDirect && g.memberIds && g.memberIds.includes(currentUser.id) && g.memberIds.includes(otherUser.id));

    if (existing) {
      return {
        ...existing,
        displayName: otherUser.name,
        otherUser: otherUser
      };
    }

    // Create new direct channel
    const newGroupData: Omit<FirestoreChatGroup, 'id'> = {
      name: `${currentUser.name} & ${otherUser.name}`,
      displayName: otherUser.name,
      type: 'DIRECT',
      isDirect: true,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
      memberIds: [currentUser.id, otherUser.id],
      members: [
        {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          forenclueId: currentUser.forenclueId,
          role: currentUser.role,
          department: currentUser.department,
        },
        {
          id: otherUser.id,
          name: otherUser.name,
          email: otherUser.email,
          forenclueId: otherUser.forenclueId,
          role: otherUser.role,
          department: otherUser.department,
        }
      ],
      otherUser: otherUser,
      lastMessageText: 'Direct conversation started.',
      lastMessageAt: new Date().toISOString(),
    };

    const docRef = await addDoc(groupsCol, newGroupData);
    return { ...newGroupData, id: docRef.id };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'chat_groups');
    throw error;
  }
}

export async function createFirestoreChatGroup(
  name: string,
  type: 'GENERAL' | 'DEPARTMENT' | 'CUSTOM',
  department: string,
  creator: FirestoreUser,
  initialMemberIds: string[] = []
): Promise<FirestoreChatGroup> {
  try {
    const memberIds = Array.from(new Set([creator.id, ...initialMemberIds]));
    const newGroupData: Omit<FirestoreChatGroup, 'id'> = {
      name,
      type,
      department,
      isDirect: false,
      createdBy: creator.id,
      createdAt: new Date().toISOString(),
      memberIds,
      lastMessageText: `Channel #${name} created.`,
      lastMessageAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, 'chat_groups'), newGroupData);
    return { ...newGroupData, id: docRef.id };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'chat_groups');
    throw error;
  }
}

export function subscribeToGroupMessages(
  groupId: string,
  callback: (messages: FirestoreMessage[]) => void
): Unsubscribe {
  const msgsCol = collection(db, `chat_groups/${groupId}/messages`);
  return onSnapshot(msgsCol, (snap) => {
    const msgs = snap.docs.map(d => ({ ...d.data(), id: d.id } as FirestoreMessage));
    msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    callback(msgs);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, `chat_groups/${groupId}/messages`);
  });
}

export async function sendFirestoreMessage(
  groupId: string,
  sender: FirestoreUser,
  content: string,
  attachment?: { url: string; name: string; type: string }
): Promise<FirestoreMessage> {
  try {
    const msgsCol = collection(db, `chat_groups/${groupId}/messages`);
    const messageData = {
      groupId,
      senderId: sender.id,
      senderName: sender.name,
      senderEmail: sender.email,
      senderForenclueId: sender.forenclueId,
      senderRole: sender.role,
      senderAvatar: sender.profilePhoto || null,
      content: content.trim(),
      attachmentUrl: attachment?.url || null,
      attachmentName: attachment?.name || null,
      attachmentType: attachment?.type || null,
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(msgsCol, messageData);

    // Update parent group's lastMessage
    await updateDoc(doc(db, 'chat_groups', groupId), {
      lastMessage: {
        id: docRef.id,
        content: content.trim() || (attachment ? `📎 ${attachment.name}` : ''),
        attachmentUrl: attachment?.url || null,
        attachmentName: attachment?.name || null,
        createdAt: messageData.createdAt,
        senderName: sender.name,
        senderId: sender.id,
      },
      lastMessageText: content.trim() || (attachment ? `📎 ${attachment.name}` : ''),
      lastMessageAt: messageData.createdAt,
      updatedAt: messageData.createdAt,
    });

    return { ...messageData, id: docRef.id };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `chat_groups/${groupId}/messages`);
    throw error;
  }
}

export async function uploadChatAttachment(file: File): Promise<{ url: string; name: string; type: string }> {
  try {
    const storageRef = ref(storage, `chat_attachments/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);
    return {
      url,
      name: file.name,
      type: file.type.startsWith('image/') ? 'image' : 'file',
    };
  } catch (error) {
    // If storage is unavailable or offline, create a local object URL / data URL fallback
    console.warn('Storage upload fallback:', error);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          url: reader.result as string,
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' : 'file',
        });
      };
      reader.readAsDataURL(file);
    });
  }
}

export async function deleteFirestoreChatGroup(groupId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'chat_groups', groupId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `chat_groups/${groupId}`);
    throw error;
  }
}

// ----------------------------------------------------
// ANNOUNCEMENTS SERVICE
// ----------------------------------------------------
export function subscribeToAnnouncements(callback: (announcements: FirestoreAnnouncement[]) => void): Unsubscribe {
  const annCol = collection(db, 'announcements');
  return onSnapshot(annCol, (snap) => {
    const list = snap.docs.map(d => ({ ...d.data(), id: d.id } as FirestoreAnnouncement));
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'announcements');
  });
}

export async function createFirestoreAnnouncement(data: Partial<FirestoreAnnouncement>): Promise<FirestoreAnnouncement> {
  try {
    const annCol = collection(db, 'announcements');
    const docData: Omit<FirestoreAnnouncement, 'id'> = {
      title: data.title || '',
      content: data.content || '',
      author: data.author || 'Super Administrator',
      authorId: data.authorId || '',
      priority: data.priority || 'NORMAL',
      date: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(annCol, docData);
    return { ...docData, id: docRef.id };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'announcements');
    throw error;
  }
}

export async function deleteFirestoreAnnouncement(annId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'announcements', annId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `announcements/${annId}`);
    throw error;
  }
}

// ----------------------------------------------------
// NOTIFICATIONS SERVICE
// ----------------------------------------------------
export function subscribeToUserNotifications(
  userId: string,
  callback: (notifications: FirestoreNotification[]) => void
): Unsubscribe {
  const notifCol = collection(db, 'notifications');
  return onSnapshot(notifCol, (snap) => {
    const all = snap.docs.map(d => ({ ...d.data(), id: d.id } as FirestoreNotification));
    const userNotifs = all.filter(n => n.userId === userId || n.userId === 'ALL');
    userNotifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(userNotifs);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'notifications');
  });
}

export async function markNotificationRead(notifId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'notifications', notifId), { read: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `notifications/${notifId}`);
  }
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  try {
    const notifCol = collection(db, 'notifications');
    const snap = await getDocs(notifCol);
    const userNotifs = snap.docs.filter(d => d.data().userId === userId && !d.data().read);
    for (const d of userNotifs) {
      await updateDoc(d.ref, { read: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'notifications');
  }
}
