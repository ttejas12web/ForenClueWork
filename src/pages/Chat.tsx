import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, 
  MessageSquare, 
  Send, 
  Users, 
  Plus, 
  X, 
  Check, 
  Info, 
  Trash2, 
  Sparkles,
  UserPlus,
  UserMinus,
  Edit3,
  Crown,
  Upload,
  ArrowLeft,
  ChevronRight,
  Shield,
  User,
  Mail,
  Briefcase,
  Paperclip,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface ChatMember {
  id: number;
  name: string;
  email: string;
  forenclueId: string;
  role: string;
  department?: string;
}

interface ChatGroup {
  id: number;
  name: string;
  displayName?: string;
  isDirect?: boolean;
  otherUser?: {
    id: number;
    name: string;
    email: string;
    forenclueId: string;
    role: string;
    department?: string;
  } | null;
  description: string | null;
  avatarUrl: string | null;
  createdBy: number;
  createdAt: string;
  memberCount: number;
  members: ChatMember[];
  lastMessage: {
    id: number;
    content: string;
    attachmentUrl?: string | null;
    attachmentName?: string | null;
    createdAt: string;
    senderName: string;
    senderId: string;
  } | null;
}

interface ChatMessage {
  id: number;
  groupId: number;
  senderId: number;
  content: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  isEncrypted?: boolean;
  createdAt: string;
  senderName: string;
  senderForenclueId: string;
  senderRole: string;
  senderEmail: string;
}

const PRESET_AVATARS = [
  { id: 'shield', icon: '🛡️', label: 'Security & Forensics', bg: 'bg-blue-600 text-white' },
  { id: 'dna', icon: '🧬', label: 'DNA & Biological', bg: 'bg-emerald-600 text-white' },
  { id: 'cyber', icon: '💻', label: 'Cyber Intelligence', bg: 'bg-indigo-600 text-white' },
  { id: 'investigation', icon: '🔍', label: 'Investigation Lead', bg: 'bg-cyan-600 text-white' },
  { id: 'lab', icon: '🧪', label: 'Toxicology & Chemistry', bg: 'bg-purple-600 text-white' },
  { id: 'ballistics', icon: '🎯', label: 'Ballistics & Physical', bg: 'bg-rose-600 text-white' },
  { id: 'legal', icon: '⚖️', label: 'Evidence & Legal', bg: 'bg-amber-600 text-white' },
  { id: 'command', icon: '⚡', label: 'Rapid Response Unit', bg: 'bg-slate-900 text-white' },
];

export const Chat = () => {
  const { user, token } = useAuthStore();
  const [searchParams] = useSearchParams();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const targetGroupName = searchParams.get('group');
  const targetGroupId = searchParams.get('groupId');
  const targetMention = searchParams.get('mention');
  const targetDirectUser = searchParams.get('directUser') || searchParams.get('mentor');

  // State
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [activeGroup, setActiveGroup] = useState<ChatGroup | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [allUsers, setAllUsers] = useState<ChatMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddMembersModalOpen, setIsAddMembersModalOpen] = useState(false);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Create Group Form State
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [avatarType, setAvatarType] = useState<'preset' | 'url' | 'upload'>('preset');
  const [selectedPreset, setSelectedPreset] = useState(PRESET_AVATARS[0].id);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [uploadedAvatarPreview, setUploadedAvatarPreview] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [memberFilterQuery, setMemberFilterQuery] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState<'ALL' | 'VOLUNTEER' | 'EMPLOYEE' | 'ADMIN'>('ALL');
  const [isSubmittingGroup, setIsSubmittingGroup] = useState(false);
  const [formError, setFormError] = useState('');

  // Add Members to Existing Group Form State
  const [newSelectedMemberIds, setNewSelectedMemberIds] = useState<number[]>([]);
  const [addMemberFilterQuery, setAddMemberFilterQuery] = useState('');
  const [addMemberRoleFilter, setAddMemberRoleFilter] = useState<'ALL' | 'VOLUNTEER' | 'EMPLOYEE' | 'ADMIN'>('ALL');
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [addMemberError, setAddMemberError] = useState('');

  // Edit Group Form State
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAvatarType, setEditAvatarType] = useState<'preset' | 'url' | 'upload'>('preset');
  const [editSelectedPreset, setEditSelectedPreset] = useState(PRESET_AVATARS[0].id);
  const [editCustomAvatarUrl, setEditCustomAvatarUrl] = useState('');
  const [editUploadedAvatarPreview, setEditUploadedAvatarPreview] = useState('');
  const [isUpdatingGroup, setIsUpdatingGroup] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageFileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFilePreview, setSelectedFilePreview] = useState<string | null>(null);

  const handleMessageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        alert('File size must be less than 25MB');
        return;
      }
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setSelectedFilePreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setSelectedFilePreview(null);
      }
    }
  };

  const canManageActiveGroup = isSuperAdmin || (activeGroup && activeGroup.createdBy === user?.id && !activeGroup.isDirect);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch groups and initialize direct chat if requested
  const fetchGroups = async (autoSelectFirstOnDesktop = false) => {
    try {
      const res = await fetch('/api/chat/groups', {
        headers: { Authorization: `Bearer ${token}` }
      });

      let loadedGroups: ChatGroup[] = [];
      if (res.ok) {
        loadedGroups = await res.json();
      }

      // If user requested direct chat with a mentor / member (via ?directUser=...)
      if (targetDirectUser) {
        try {
          const directRes = await fetch('/api/chat/direct', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ targetForenclueId: targetDirectUser })
          });

          if (directRes.ok) {
            const directGroup: ChatGroup = await directRes.json();
            const exists = loadedGroups.find(g => g.id === directGroup.id);
            if (exists) {
              loadedGroups = loadedGroups.map(g => g.id === directGroup.id ? directGroup : g);
            } else {
              loadedGroups = [directGroup, ...loadedGroups];
            }
            setGroups(loadedGroups);
            setActiveGroup(directGroup);
            setIsLoadingGroups(false);
            return;
          }
        } catch (err) {
          console.error('Failed to open direct mentor channel:', err);
        }
      }

      setGroups(loadedGroups);
      
      if (loadedGroups.length > 0) {
        // If URL params specify a group, prioritize that
        let target: ChatGroup | undefined;
        if (targetGroupId) {
          target = loadedGroups.find(g => g.id === Number(targetGroupId));
        } else if (targetGroupName) {
          target = loadedGroups.find(g => g.name.toLowerCase() === targetGroupName.toLowerCase());
        }

        if (target) {
          setActiveGroup(target);
        } else if (activeGroup) {
          const current = loadedGroups.find(g => g.id === activeGroup.id);
          if (current) setActiveGroup(current);
        } else if (autoSelectFirstOnDesktop && window.innerWidth >= 768) {
          setActiveGroup(loadedGroups[0]);
        }
      } else {
        setActiveGroup(null);
      }
    } catch (err) {
      console.error('Failed to load chat groups', err);
    } finally {
      setIsLoadingGroups(false);
    }
  };

  // Fetch all users for membership picker
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setAllUsers(data);
        }
      }
    } catch (err) {
      console.error('Failed to load users', err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchGroups(true);
    fetchUsers();
  }, [token]);

  // Pre-fill mention if provided in URL
  useEffect(() => {
    if (targetMention) {
      setMessageText(`@${targetMention} `);
    }
  }, [targetMention]);

  // Fetch messages for active group
  const fetchMessages = async (groupId: number) => {
    try {
      const res = await fetch(`/api/chat/groups/${groupId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  };

  // When active group changes, fetch messages and start polling
  useEffect(() => {
    if (!activeGroup) {
      setMessages([]);
      return;
    }
    fetchMessages(activeGroup.id);

    const interval = setInterval(() => {
      fetchMessages(activeGroup.id);
    }, 3000);

    return () => clearInterval(interval);
  }, [activeGroup?.id, token]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup || (!messageText.trim() && !selectedFile) || isSending) return;

    setIsSending(true);
    const content = messageText.trim();
    let attachmentUrl = null;
    let attachmentName = null;

    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          attachmentUrl = uploadData.url;
          attachmentName = uploadData.name;
        }
      }

      const res = await fetch(`/api/chat/groups/${activeGroup.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content, attachmentUrl, attachmentName })
      });

      if (res.ok) {
        const newMsg = await res.json();
        setMessages(prev => [...prev, newMsg]);
        setMessageText('');
        setSelectedFile(null);
        setSelectedFilePreview(null);
        if (messageFileInputRef.current) messageFileInputRef.current.value = '';
        fetchGroups(false);
      }
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setIsSending(false);
    }
  };

  // Handle avatar image file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        if (isEdit) {
          alert('Image file size must be less than 2MB');
        } else {
          setFormError('Image file size must be less than 2MB');
        }
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEdit) {
          setEditUploadedAvatarPreview(reader.result as string);
        } else {
          setUploadedAvatarPreview(reader.result as string);
          setFormError('');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Member selection handlers for Create Modal
  const toggleMemberSelection = (id: number) => {
    setSelectedMemberIds(prev => 
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (filteredIds: number[]) => {
    const allSelected = filteredIds.every(id => selectedMemberIds.includes(id));
    if (allSelected) {
      setSelectedMemberIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedMemberIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  // Member selection handlers for Add Members Modal
  const toggleNewMemberSelection = (id: number) => {
    setNewSelectedMemberIds(prev => 
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  const handleSelectAllNew = (filteredIds: number[]) => {
    const allSelected = filteredIds.every(id => newSelectedMemberIds.includes(id));
    if (allSelected) {
      setNewSelectedMemberIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setNewSelectedMemberIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setGroupName('');
    setGroupDescription('');
    setAvatarType('preset');
    setSelectedPreset(PRESET_AVATARS[0].id);
    setCustomAvatarUrl('');
    setUploadedAvatarPreview('');
    setSelectedMemberIds([]);
    setMemberFilterQuery('');
    setMemberRoleFilter('ALL');
    setFormError('');
    setIsCreateModalOpen(true);
  };

  // Open Add Members Modal
  const openAddMembersModal = () => {
    setNewSelectedMemberIds([]);
    setAddMemberFilterQuery('');
    setAddMemberRoleFilter('ALL');
    setAddMemberError('');
    setIsAddMembersModalOpen(true);
  };

  // Open Edit Profile Modal
  const openEditProfileModal = () => {
    if (!activeGroup) return;
    setEditName(activeGroup.name);
    setEditDescription(activeGroup.description || '');
    if (activeGroup.avatarUrl?.startsWith('preset:')) {
      setEditAvatarType('preset');
      setEditSelectedPreset(activeGroup.avatarUrl.replace('preset:', ''));
      setEditCustomAvatarUrl('');
      setEditUploadedAvatarPreview('');
    } else if (activeGroup.avatarUrl) {
      setEditAvatarType('url');
      setEditCustomAvatarUrl(activeGroup.avatarUrl);
      setEditUploadedAvatarPreview('');
    } else {
      setEditAvatarType('preset');
      setEditSelectedPreset(PRESET_AVATARS[0].id);
      setEditCustomAvatarUrl('');
      setEditUploadedAvatarPreview('');
    }
    setIsEditProfileOpen(true);
  };

  // Submit Create Group
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setFormError('Please enter a group title');
      return;
    }

    setIsSubmittingGroup(true);
    setFormError('');

    let finalAvatarUrl = `preset:${selectedPreset}`;
    if (avatarType === 'url' && customAvatarUrl.trim()) {
      finalAvatarUrl = customAvatarUrl.trim();
    } else if (avatarType === 'upload' && uploadedAvatarPreview) {
      finalAvatarUrl = uploadedAvatarPreview;
    }

    try {
      const res = await fetch('/api/chat/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: groupName.trim(),
          description: groupDescription.trim() || null,
          avatarUrl: finalAvatarUrl,
          memberIds: selectedMemberIds,
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create group');
      }

      const newGroup = await res.json();
      setIsCreateModalOpen(false);
      await fetchGroups(false);
      setActiveGroup(newGroup);
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while creating the group');
    } finally {
      setIsSubmittingGroup(false);
    }
  };

  // Submit Add Members to existing group
  const handleAddMembersToGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup || newSelectedMemberIds.length === 0) {
      setAddMemberError('Please select at least one member to add');
      return;
    }

    setIsAddingMembers(true);
    setAddMemberError('');

    try {
      const res = await fetch(`/api/chat/groups/${activeGroup.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          memberIds: newSelectedMemberIds,
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add members');
      }

      setIsAddMembersModalOpen(false);
      await fetchGroups(false);
      await fetchMessages(activeGroup.id);
    } catch (err: any) {
      setAddMemberError(err.message || 'An error occurred while adding members');
    } finally {
      setIsAddingMembers(false);
    }
  };

  // Remove a member from group
  const handleRemoveMember = async (targetUserId: number, targetName: string) => {
    if (!activeGroup) return;
    if (!confirm(`Are you sure you want to remove ${targetName} from "${activeGroup.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/chat/groups/${activeGroup.id}/members/${targetUserId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        await fetchGroups(false);
        await fetchMessages(activeGroup.id);
      }
    } catch (err) {
      console.error('Failed to remove member', err);
    }
  };

  // Submit Edit Group Profile
  const handleUpdateGroupProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup || !editName.trim()) return;

    setIsUpdatingGroup(true);

    let finalAvatarUrl = `preset:${editSelectedPreset}`;
    if (editAvatarType === 'url' && editCustomAvatarUrl.trim()) {
      finalAvatarUrl = editCustomAvatarUrl.trim();
    } else if (editAvatarType === 'upload' && editUploadedAvatarPreview) {
      finalAvatarUrl = editUploadedAvatarPreview;
    }

    try {
      const res = await fetch(`/api/chat/groups/${activeGroup.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || null,
          avatarUrl: finalAvatarUrl,
        })
      });

      if (res.ok) {
        setIsEditProfileOpen(false);
        await fetchGroups(false);
      }
    } catch (err) {
      console.error('Failed to update group profile', err);
    } finally {
      setIsUpdatingGroup(false);
    }
  };

  // Delete Group
  const handleDeleteGroup = async (groupId: number) => {
    if (!confirm('Are you sure you want to delete this group? All messages and membership records will be permanently removed.')) {
      return;
    }

    try {
      const res = await fetch(`/api/chat/groups/${groupId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setIsGroupInfoOpen(false);
        setActiveGroup(null);
        fetchGroups(true);
      }
    } catch (err) {
      console.error('Failed to delete group', err);
    }
  };

  // Filter members in create modal
  const filteredUsers = allUsers.filter(u => {
    if (u.id === user?.id) return false;
    const matchesSearch = 
      u.name.toLowerCase().includes(memberFilterQuery.toLowerCase()) ||
      u.forenclueId.toLowerCase().includes(memberFilterQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(memberFilterQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (memberRoleFilter === 'ALL') return true;
    if (memberRoleFilter === 'ADMIN') return u.role === 'SUPER_ADMIN' || u.role === 'ADMIN';
    return u.role === memberRoleFilter;
  });

  const filteredUserIds = filteredUsers.map(u => u.id);
  const isAllFilteredSelected = filteredUserIds.length > 0 && filteredUserIds.every(id => selectedMemberIds.includes(id));

  // Available users to ADD to active group (not already members)
  const currentMemberIds = new Set(activeGroup?.members?.map(m => m.id) || []);
  const availableUsersToAdd = allUsers.filter(u => {
    if (currentMemberIds.has(u.id)) return false;
    const matchesSearch = 
      u.name.toLowerCase().includes(addMemberFilterQuery.toLowerCase()) ||
      u.forenclueId.toLowerCase().includes(addMemberFilterQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(addMemberFilterQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (addMemberRoleFilter === 'ALL') return true;
    if (addMemberRoleFilter === 'ADMIN') return u.role === 'SUPER_ADMIN' || u.role === 'ADMIN';
    return u.role === addMemberRoleFilter;
  });

  const availableUserIds = availableUsersToAdd.map(u => u.id);
  const isAllAvailableSelected = availableUserIds.length > 0 && availableUserIds.every(id => newSelectedMemberIds.includes(id));

  // Render Avatar Helper
  const renderGroupAvatar = (avatarUrl: string | null, name: string, size = 'h-10 w-10 text-base', isDirect = false, otherName?: string) => {
    if (isDirect) {
      const initial = (otherName || name || 'M').charAt(0).toUpperCase();
      return (
        <div className={`${size} rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-xs flex-shrink-0 relative`}>
          <span>{initial}</span>
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-emerald-500 rounded-full border-2 border-white" />
        </div>
      );
    }

    if (!avatarUrl) {
      return (
        <div className={`${size} rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs flex-shrink-0`}>
          {name.charAt(0).toUpperCase()}
        </div>
      );
    }

    if (avatarUrl.startsWith('preset:')) {
      const presetId = avatarUrl.replace('preset:', '');
      const preset = PRESET_AVATARS.find(p => p.id === presetId) || PRESET_AVATARS[0];
      return (
        <div className={`${size} rounded-xl ${preset.bg} flex items-center justify-center shadow-xs flex-shrink-0`}>
          <span>{preset.icon}</span>
        </div>
      );
    }

    return (
      <img 
        src={avatarUrl} 
        alt={name} 
        className={`${size} rounded-xl object-cover border border-slate-200 shadow-xs flex-shrink-0`}
        onError={(e) => {
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
    );
  };

  // Filter groups in sidebar
  const filteredGroups = groups.filter(g => {
    const nameMatch = g.displayName 
      ? g.displayName.toLowerCase().includes(searchQuery.toLowerCase()) 
      : g.name.toLowerCase().includes(searchQuery.toLowerCase());
    const descMatch = g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase());
    const userMatch = g.otherUser && (
      g.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.otherUser.forenclueId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.otherUser.department && g.otherUser.department.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    return nameMatch || descMatch || userMatch;
  });

  return (
    <div className="h-[calc(100vh-8.5rem)] sm:h-[calc(100vh-7rem)] bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden flex flex-col md:flex-row relative">
      
      {/* ================= COLUMN 1: GROUPS SIDEBAR ================= */}
      {/* On mobile: Hidden when an active group is selected. Visible when no active group. */}
      {/* On desktop (md+): Always visible as the left pane. */}
      <div 
        className={`w-full md:w-80 lg:w-96 border-r border-slate-200/90 flex flex-col bg-slate-50/90 ${
          activeGroup ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header / Create Group Button */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Workspace Chat</h2>
              <p className="text-[11px] text-slate-500">{groups.length} active channels & direct chats</p>
            </div>
            {isSuperAdmin && (
              <button
                id="create-group-btn"
                onClick={openCreateModal}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all transform active:scale-95 cursor-pointer min-h-[36px]"
                title="Create a new Group with required members"
              >
                <Plus className="h-4 w-4" />
                <span>New Group</span>
              </button>
            )}
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search groups, mentors or members..."
              className="w-full pl-9 pr-3 py-2 bg-slate-100/90 border border-transparent rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Groups List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {isLoadingGroups ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading channels...</div>
          ) : filteredGroups.length === 0 ? (
            <div className="p-8 text-center">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="h-6 w-6" />
              </div>
              <p className="text-xs font-semibold text-slate-700">No chats found</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                {isSuperAdmin 
                  ? 'Click "New Group" above to create an operational workspace channel!'
                  : 'Select a mentor from Departments & Teams or join a project team to chat.'}
              </p>
              {isSuperAdmin && (
                <button
                  onClick={openCreateModal}
                  className="mt-3 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-xl shadow-sm hover:bg-blue-700 cursor-pointer"
                >
                  + Create Group
                </button>
              )}
            </div>
          ) : (
            filteredGroups.map((group) => {
              const isActive = activeGroup?.id === group.id;
              const isDirect = group.isDirect || group.name.startsWith('DM:');
              const displayTitle = group.displayName || group.otherUser?.name || group.name.replace(/^DM:\s*/, '');
              const displaySub = isDirect
                ? (group.otherUser?.department ? `${group.otherUser.department} Mentor` : (group.otherUser?.forenclueId || '1-on-1 Consultation'))
                : group.description;

              return (
                <button
                  key={group.id}
                  id={`chat-group-item-${group.id}`}
                  onClick={() => setActiveGroup(group)}
                  className={`w-full p-3 rounded-xl flex items-start space-x-3 text-left transition-all cursor-pointer min-h-[56px] ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'hover:bg-slate-200/60 bg-white md:bg-transparent text-slate-800 border border-slate-200/60 md:border-transparent mb-1 md:mb-0'
                  }`}
                >
                  {renderGroupAvatar(group.avatarUrl, group.name, 'h-10 w-10 text-sm', isDirect, displayTitle)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center space-x-1.5 truncate">
                        <h4 className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>
                          {displayTitle}
                        </h4>
                        {isDirect && (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                            isActive ? 'bg-blue-500 text-white' : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}>
                            1-on-1
                          </span>
                        )}
                      </div>
                      {!isDirect && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ml-2 flex-shrink-0 ${
                          isActive ? 'bg-blue-700 text-blue-100' : 'bg-slate-200/80 text-slate-600'
                        }`}>
                          {group.memberCount}
                        </span>
                      )}
                    </div>
                    {displaySub && (
                      <p className={`text-[11px] truncate ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                        {displaySub}
                      </p>
                    )}
                    {group.lastMessage && (
                      <p className={`text-[10px] truncate mt-1 ${isActive ? 'text-blue-200' : 'text-slate-400'}`}>
                        <span className="font-semibold">{group.lastMessage.senderName.split(' ')[0]}:</span> {group.lastMessage.content}
                      </p>
                    )}
                  </div>
                  <ChevronRight className={`h-4 w-4 md:hidden self-center flex-shrink-0 ${
                    isActive ? 'text-blue-200' : 'text-slate-300'
                  }`} />
                </button>
              );
            })
          )}
        </div>

        {/* Sidebar Footer User Badge */}
        <div className="p-3 border-t border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center space-x-2 truncate">
            <div className="h-7 w-7 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-800 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 font-mono truncate">{user?.forenclueId}</p>
            </div>
          </div>
          {isSuperAdmin && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full flex items-center flex-shrink-0">
              <Crown className="h-2.5 w-2.5 mr-1" />
              Admin
            </span>
          )}
        </div>
      </div>

      {/* ================= COLUMN 2: ACTIVE CONVERSATION ================= */}
      {/* On mobile: Hidden if no group selected, Full screen when a group is selected. */}
      {/* On desktop (md+): Takes remaining flex space. */}
      {activeGroup ? (
        <div 
          className={`flex-1 flex flex-col bg-white min-w-0 ${
            activeGroup ? 'flex' : 'hidden md:flex'
          }`}
        >
          {/* Active Group Top Bar */}
          <div className="h-16 border-b border-slate-200 px-3.5 sm:px-6 flex items-center justify-between bg-white z-10 shrink-0">
            {activeGroup.isDirect ? (
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                {/* Mobile Back Button */}
                <button
                  onClick={() => setActiveGroup(null)}
                  className="md:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center min-h-[40px] min-w-[40px]"
                  aria-label="Back to channels list"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>

                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs flex-shrink-0 relative">
                  {(activeGroup.otherUser?.name || activeGroup.displayName || activeGroup.name).charAt(0)}
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                </div>
                
                <div className="truncate">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                      {activeGroup.otherUser?.name || activeGroup.displayName || activeGroup.name.replace(/^DM:\s*/, '')}
                    </h3>
                    <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-bold">
                      {activeGroup.otherUser?.role ? activeGroup.otherUser.role.replace('_', ' ') : 'Mentor'}
                    </span>
                    {activeGroup.otherUser?.department && (
                      <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-semibold hidden sm:inline">
                        {activeGroup.otherUser.department}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate max-w-xs sm:max-w-md font-mono">
                    {activeGroup.otherUser?.forenclueId} {activeGroup.otherUser?.email ? `• ${activeGroup.otherUser.email}` : ''}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                {/* Mobile Back Button */}
                <button
                  onClick={() => setActiveGroup(null)}
                  className="md:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center min-h-[40px] min-w-[40px]"
                  aria-label="Back to channels list"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>

                {renderGroupAvatar(activeGroup.avatarUrl, activeGroup.name, 'h-9 w-9 text-xs')}
                
                <div className="truncate">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm truncate">{activeGroup.name}</h3>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium hidden sm:inline">
                      {activeGroup.memberCount} Members
                    </span>
                  </div>
                  {activeGroup.description && (
                    <p className="text-[11px] text-slate-500 truncate max-w-xs sm:max-w-md">{activeGroup.description}</p>
                  )}
                </div>
              </div>
            )}

            {/* Actions for Admins & Members */}
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              {canManageActiveGroup && !activeGroup.isDirect && (
                <button
                  id="add-members-to-group-header-btn"
                  onClick={openAddMembersModal}
                  className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition-colors border border-blue-200/80 cursor-pointer min-h-[36px]"
                  title="Add workspace members to this group"
                >
                  <UserPlus className="h-3.5 w-3.5 text-blue-600" />
                  <span className="hidden sm:inline">Add Members</span>
                </button>
              )}

              <button
                id="group-info-btn"
                onClick={() => setIsGroupInfoOpen(true)}
                className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors cursor-pointer min-h-[36px]"
                title={activeGroup.isDirect ? "View Mentor Profile Details" : "View Group Details and Members"}
              >
                {activeGroup.isDirect ? (
                  <>
                    <User className="h-3.5 w-3.5 text-slate-500" />
                    <span className="hidden sm:inline">Profile Info</span>
                  </>
                ) : (
                  <>
                    <Users className="h-3.5 w-3.5 text-slate-500" />
                    <span className="hidden sm:inline">Group Info</span>
                  </>
                )}
              </button>

              {canManageActiveGroup && !activeGroup.isDirect && (
                <button
                  onClick={() => handleDeleteGroup(activeGroup.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                  title="Delete Group"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
            {messages.length === 0 ? (
              activeGroup.isDirect ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl font-bold shadow-md mb-3">
                    {(activeGroup.otherUser?.name || activeGroup.displayName || activeGroup.name).charAt(0)}
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    1-on-1 Consultation Channel
                  </h4>
                  <p className="text-xs text-slate-700 font-semibold mt-1">
                    {activeGroup.otherUser?.name || activeGroup.displayName} ({activeGroup.otherUser?.forenclueId})
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm">
                    {activeGroup.otherUser?.department ? `${activeGroup.otherUser.department} Department • ` : ''}
                    {activeGroup.otherUser?.role.replace('_', ' ')}
                  </p>
                  <div className="mt-4 p-3 bg-blue-50/90 border border-blue-100 rounded-xl text-left max-w-md text-xs text-slate-600 space-y-1">
                    <p className="font-semibold text-blue-900">Official Mentor Direct Channel</p>
                    <p className="text-[11px] text-blue-800/80 leading-relaxed">
                      All messages in this channel are private between you and {activeGroup.otherUser?.name || 'this mentor'}. Use this space for personalized guidance, questions, and project mentorship.
                    </p>
                  </div>
                  <p className="text-[11px] text-blue-600 mt-4 font-medium">Type your message below to start your conversation!</p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                    <MessageSquare className="h-7 w-7" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Welcome to {activeGroup.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    {activeGroup.description || 'This is the private channel for your group members to communicate and collaborate.'}
                  </p>
                  {canManageActiveGroup && (
                    <button
                      onClick={openAddMembersModal}
                      className="mt-3.5 flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-sm transition-all cursor-pointer"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Add Members to Group</span>
                    </button>
                  )}
                  <p className="text-[11px] text-blue-600 mt-3 font-medium">Type a message below to start collaborating!</p>
                </div>
              )
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === user?.id;
                const isMsgSuperAdmin = msg.senderRole === 'SUPER_ADMIN';
                const isSystemNotice = msg.content.startsWith('👋') || msg.content.startsWith('➕') || msg.content.startsWith('➖') || msg.content.startsWith('🚪');

                if (isSystemNotice) {
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <div className="bg-slate-200/80 border border-slate-300/60 text-slate-700 text-[11px] font-medium px-3.5 py-1.5 rounded-full flex items-center space-x-1.5 shadow-2xs text-center max-w-lg">
                        <span>{msg.content}</span>
                        <span className="text-[10px] text-slate-400 ml-1 flex-shrink-0">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start space-x-2.5 ${isMe ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}
                  >
                    {/* Sender Initial Avatar */}
                    <div 
                      className={`h-7 w-7 sm:h-8 sm:w-8 rounded-xl flex items-center justify-center text-xs font-bold shadow-2xs flex-shrink-0 ${
                        isMe 
                          ? 'bg-blue-600 text-white' 
                          : isMsgSuperAdmin 
                            ? 'bg-amber-500 text-white' 
                            : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {msg.senderName.charAt(0)}
                    </div>

                    {/* Message Bubble */}
                    <div className={`max-w-[85%] sm:max-w-lg ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className="flex items-center space-x-1.5 sm:space-x-2 mb-1 px-1">
                        <span className="text-[11px] font-bold text-slate-800 truncate max-w-[120px] sm:max-w-none">
                          {isMe ? 'You' : msg.senderName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {msg.senderForenclueId}
                        </span>
                        {isMsgSuperAdmin && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                            ADMIN
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div
                        className={`p-3 sm:p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs break-words ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-none'
                        }`}
                      >
                        {msg.content}
                        {msg.attachmentUrl && !msg.isEncrypted && (
                          <div className="mt-2 pt-2 border-t border-white/20">
                            {msg.attachmentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                              <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="block">
                                <img 
                                  src={msg.attachmentUrl} 
                                  alt={msg.attachmentName || 'Attachment'} 
                                  className="max-h-48 rounded-xl object-cover border border-white/20 shadow-xs hover:opacity-95 transition-opacity"
                                />
                              </a>
                            ) : (
                              <a 
                                href={msg.attachmentUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={`flex items-center space-x-2 p-2 rounded-xl border transition-colors ${
                                  isMe ? 'bg-blue-700/80 border-blue-400 text-white hover:bg-blue-700' : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                                }`}
                              >
                                <Paperclip className="h-4 w-4 flex-shrink-0" />
                                <span className="text-xs font-semibold truncate">{msg.attachmentName || 'Download File'}</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Box */}
          <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
            {selectedFile && (
              <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
                <div className="flex items-center space-x-2 truncate">
                  {selectedFilePreview ? (
                    <img src={selectedFilePreview} alt="Preview" className="h-8 w-8 rounded-lg object-cover" />
                  ) : (
                    <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  )}
                  <div className="truncate">
                    <p className="font-semibold truncate">{selectedFile.name}</p>
                    <p className="text-[10px] text-blue-700">Ready to attach & send</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setSelectedFilePreview(null);
                    if (messageFileInputRef.current) messageFileInputRef.current.value = '';
                  }}
                  className="p-1 hover:bg-blue-100 rounded-lg text-blue-700 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
              <input 
                type="file" 
                ref={messageFileInputRef} 
                onChange={handleMessageFileSelect} 
                className="hidden" 
              />
              <button
                type="button"
                onClick={() => messageFileInputRef.current?.click()}
                className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer flex-shrink-0"
                title="Attach file or image to send to Super Admin / Group"
              >
                <Paperclip className="h-4 w-4" />
              </button>

              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={`Message #${activeGroup.name} or add file attachment...`}
                className="flex-1 px-3.5 sm:px-4 py-2.5 bg-slate-100 border border-transparent rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={(!messageText.trim() && !selectedFile) || isSending}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer min-h-[40px]"
              >
                <Send className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Empty State on Desktop when no group selected */
        <div className="hidden md:flex flex-1 flex-col items-center justify-center p-12 text-center bg-slate-50/50">
          <div className="h-16 w-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-sm">
            <MessageSquare className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Select or Create a Chat Group</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Collaborate in designated operational groups, share case findings, and connect with team members securely.
          </p>
          {isSuperAdmin && (
            <button
              onClick={openCreateModal}
              className="mt-4 flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Group</span>
            </button>
          )}
        </div>
      )}

      {/* ================= MODAL: ADD MEMBERS TO EXISTING GROUP ================= */}
      {isAddMembersModalOpen && activeGroup && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150"
            id="add-members-modal"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <UserPlus className="h-4 w-4 text-blue-600" />
                  <span>Add Workspace Members to "{activeGroup.name}"</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select team members to grant immediate access to this group chat.
                </p>
              </div>
              <button
                onClick={() => setIsAddMembersModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddMembersToGroup} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {addMemberError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
                  <Info className="h-4 w-4 flex-shrink-0" />
                  <span>{addMemberError}</span>
                </div>
              )}

              {/* Search & Filters */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={addMemberFilterQuery}
                    onChange={(e) => setAddMemberFilterQuery(e.target.value)}
                    placeholder="Search by name, ForenClue ID..."
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
                  {(['ALL', 'VOLUNTEER', 'EMPLOYEE', 'ADMIN'] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setAddMemberRoleFilter(role)}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                        addMemberRoleFilter === role ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Select All Toggle */}
              <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                <span className="font-semibold text-slate-700">
                  Available Members ({availableUsersToAdd.length})
                </span>
                {availableUsersToAdd.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleSelectAllNew(availableUserIds)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    {isAllAvailableSelected ? 'Deselect All' : 'Select All Filtered'}
                  </button>
                )}
              </div>

              {/* Members Selection List */}
              <div className="border border-slate-200 rounded-xl max-h-56 sm:max-h-64 overflow-y-auto divide-y divide-slate-100 bg-white">
                {availableUsersToAdd.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    {allUsers.length === currentMemberIds.size 
                      ? 'All workspace members are already in this group.' 
                      : 'No members match your search criteria.'}
                  </div>
                ) : (
                  availableUsersToAdd.map((u) => {
                    const isSelected = newSelectedMemberIds.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => toggleNewMemberSelection(u.id)}
                        className={`p-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3 truncate">
                          <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                            {u.name.charAt(0)}
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-semibold text-slate-800 truncate">{u.name}</p>
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-mono text-slate-400">{u.forenclueId}</span>
                              <span className="text-[9px] bg-slate-100 text-slate-600 font-medium px-1.5 py-0.2 rounded">
                                {u.role}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className={`h-5 w-5 rounded-md flex items-center justify-center transition-all ${
                          isSelected ? 'bg-blue-600 text-white' : 'border border-slate-300'
                        }`}>
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {newSelectedMemberIds.length} member{newSelectedMemberIds.length === 1 ? '' : 's'} selected
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsAddMembersModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAddingMembers || newSelectedMemberIds.length === 0}
                    className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow-sm transition-all cursor-pointer flex items-center space-x-1.5"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>{isAddingMembers ? 'Adding...' : `Add to Group`}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE GROUP ================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150"
            id="create-group-modal"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <span>Create Workspace Group</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set group title, description, custom profile avatar, and select required members.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleCreateGroup} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
              
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
                  <Info className="h-4 w-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Group Title & Description */}
              <div className="space-y-3 sm:space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">1. Group Details</h4>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Group Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="e.g. Forensic Cyber Taskforce, Evidence Analysis..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Description & Purpose
                  </label>
                  <textarea
                    rows={2}
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    placeholder="Brief description of responsibilities or guidelines for this group..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* 2. Group Profile / Avatar Customization */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">2. Group Profile Avatar</h4>
                  <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setAvatarType('preset')}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                        avatarType === 'preset' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Presets
                    </button>
                    <button
                      type="button"
                      onClick={() => setAvatarType('upload')}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                        avatarType === 'upload' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setAvatarType('url')}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                        avatarType === 'url' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      URL
                    </button>
                  </div>
                </div>

                {avatarType === 'preset' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {PRESET_AVATARS.map((preset) => {
                      const isSelected = selectedPreset === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setSelectedPreset(preset.id)}
                          className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center space-y-1 transition-all cursor-pointer ${
                            isSelected 
                              ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20' 
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className={`h-9 w-9 rounded-xl ${preset.bg} flex items-center justify-center text-base shadow-xs`}>
                            {preset.icon}
                          </div>
                          <span className="text-[10px] font-medium text-slate-700 truncate w-full">{preset.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {avatarType === 'upload' && (
                  <div className="pt-1">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={(e) => handleFileUpload(e, false)} 
                      accept="image/*" 
                      className="hidden" 
                    />
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-5 text-center cursor-pointer bg-slate-50/50 hover:bg-blue-50/20 transition-all"
                    >
                      {uploadedAvatarPreview ? (
                        <div className="flex flex-col items-center">
                          <img 
                            src={uploadedAvatarPreview} 
                            alt="Group Preview" 
                            className="h-14 w-14 rounded-xl object-cover border border-slate-200 shadow-sm mb-2"
                          />
                          <p className="text-xs text-blue-600 font-semibold">Click to choose a different image</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="h-7 w-7 text-slate-400 mb-1.5" />
                          <p className="text-xs font-semibold text-slate-700">Click to upload group image</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG up to 2MB</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {avatarType === 'url' && (
                  <div className="pt-1 space-y-2">
                    <input
                      type="url"
                      value={customAvatarUrl}
                      onChange={(e) => setCustomAvatarUrl(e.target.value)}
                      placeholder="https://example.com/group-badge.png"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                )}
              </div>

              {/* 3. Member Selection */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    3. Select Members ({selectedMemberIds.length} Selected)
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(filteredUserIds)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 self-start sm:self-auto cursor-pointer"
                  >
                    {isAllFilteredSelected ? 'Deselect All' : 'Select All Filtered'}
                  </button>
                </div>

                {/* Member Search & Role Filters */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={memberFilterQuery}
                      onChange={(e) => setMemberFilterQuery(e.target.value)}
                      placeholder="Search by name, ForenClue ID..."
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
                    {(['ALL', 'VOLUNTEER', 'EMPLOYEE', 'ADMIN'] as const).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setMemberRoleFilter(role)}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                          memberRoleFilter === role ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Member Checkbox List */}
                <div className="border border-slate-200 rounded-xl max-h-48 sm:max-h-56 overflow-y-auto divide-y divide-slate-100 bg-white">
                  {filteredUsers.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No members match your search criteria.
                    </div>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSelected = selectedMemberIds.includes(u.id);
                      return (
                        <div
                          key={u.id}
                          onClick={() => toggleMemberSelection(u.id)}
                          className={`p-2.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-50/40' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-3 truncate">
                            <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                              {u.name.charAt(0)}
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-semibold text-slate-800 truncate">{u.name}</p>
                              <div className="flex items-center space-x-2">
                                <span className="text-[10px] font-mono text-slate-400">{u.forenclueId}</span>
                                <span className="text-[9px] bg-slate-100 text-slate-600 font-medium px-1.5 py-0.2 rounded">
                                  {u.role}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className={`h-5 w-5 rounded-md flex items-center justify-center transition-all ${
                            isSelected ? 'bg-blue-600 text-white' : 'border border-slate-300'
                          }`}>
                            {isSelected && <Check className="h-3.5 w-3.5" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingGroup}
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  {isSubmittingGroup ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT GROUP PROFILE ================= */}
      {isEditProfileOpen && activeGroup && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Edit3 className="h-4 w-4 text-blue-600" />
                <span>Edit Group Profile</span>
              </h3>
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateGroupProfile} className="p-4 sm:p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Group Title</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Group Avatar Badge</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRESET_AVATARS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setEditAvatarType('preset');
                        setEditSelectedPreset(preset.id);
                      }}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center space-y-1 transition-all cursor-pointer ${
                        editAvatarType === 'preset' && editSelectedPreset === preset.id 
                          ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500/20' 
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className={`h-8 w-8 rounded-lg ${preset.bg} flex items-center justify-center text-sm`}>
                        {preset.icon}
                      </div>
                      <span className="text-[9px] font-medium text-slate-600 truncate w-full">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingGroup}
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm cursor-pointer"
                >
                  {isUpdatingGroup ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: GROUP INFO & MEMBERS DRAWER ================= */}
      {isGroupInfoOpen && activeGroup && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {activeGroup.isDirect ? 'Mentor Profile Details' : 'Group Information'}
              </h3>
              <button
                onClick={() => setIsGroupInfoOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
              {activeGroup.isDirect ? (
                <>
                  {/* Personal Mentor Profile Card */}
                  <div className="flex flex-col items-center text-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl font-bold shadow-md mb-2 relative">
                      {(activeGroup.otherUser?.name || activeGroup.displayName || activeGroup.name).charAt(0)}
                      <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-emerald-500 rounded-full border-2 border-white" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-base">
                      {activeGroup.otherUser?.name || activeGroup.displayName || activeGroup.name.replace(/^DM:\s*/, '')}
                    </h4>
                    <p className="text-xs font-mono text-blue-600 font-semibold mt-0.5">
                      {activeGroup.otherUser?.forenclueId}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full uppercase">
                        {activeGroup.otherUser?.role.replace('_', ' ')}
                      </span>
                      {activeGroup.otherUser?.department && (
                        <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
                          {activeGroup.otherUser.department}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Profile Details List */}
                  <div className="space-y-3 bg-white p-3 rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500 flex items-center space-x-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <span>Official Email</span>
                      </span>
                      <span className="font-medium text-slate-800 font-mono">
                        {activeGroup.otherUser?.email || 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500 flex items-center space-x-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                        <span>Department</span>
                      </span>
                      <span className="font-medium text-slate-800">
                        {activeGroup.otherUser?.department || 'Department Operations'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-slate-500 flex items-center space-x-1.5">
                        <Shield className="h-3.5 w-3.5 text-slate-400" />
                        <span>Channel Scope</span>
                      </span>
                      <span className="font-medium text-emerald-700 font-semibold">
                        Direct 1-on-1 Mentorship
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50/80 border border-blue-100 rounded-xl text-xs text-blue-900 leading-relaxed">
                    <p className="font-semibold text-blue-950 mb-0.5">Need assistance?</p>
                    <p className="text-[11px] text-blue-800">
                      Reach out directly using the chat input below or coordinate scheduled reviews with your assigned mentor.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* Profile Card */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {renderGroupAvatar(activeGroup.avatarUrl, activeGroup.name, 'h-12 w-12 text-lg')}
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{activeGroup.name}</h4>
                        <p className="text-[11px] text-slate-500">
                          Created {new Date(activeGroup.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {canManageActiveGroup && (
                      <button
                        onClick={openEditProfileModal}
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                        title="Edit group details"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {activeGroup.description && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[11px] font-semibold text-slate-700 mb-1">Purpose / Scope</p>
                      <p className="text-xs text-slate-600 leading-relaxed">{activeGroup.description}</p>
                    </div>
                  )}

                  {/* Members Section with Add Members CTA */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Group Members ({activeGroup.members?.length || activeGroup.memberCount})
                      </h5>
                      {canManageActiveGroup && (
                        <button
                          onClick={() => {
                            setIsGroupInfoOpen(false);
                            openAddMembersModal();
                          }}
                          className="flex items-center space-x-1 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          <span>Add Member</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto divide-y divide-slate-100">
                      {activeGroup.members && activeGroup.members.length > 0 ? (
                        activeGroup.members.map((member) => {
                          const isCreator = member.id === activeGroup.createdBy;
                          return (
                            <div key={member.id} className="pt-2 flex items-center justify-between">
                              <div className="flex items-center space-x-2.5">
                                <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs">
                                  {member.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-slate-800">{member.name}</p>
                                  <div className="flex items-center space-x-1.5">
                                    <span className="text-[10px] font-mono text-slate-400">{member.forenclueId}</span>
                                    {isCreator && (
                                      <span className="text-[9px] bg-blue-50 text-blue-700 font-bold px-1 rounded">
                                        Creator
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  member.role === 'SUPER_ADMIN' 
                                    ? 'bg-amber-100 text-amber-800' 
                                    : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {member.role}
                                </span>
                                {canManageActiveGroup && !isCreator && member.id !== user?.id && (
                                  <button
                                    onClick={() => handleRemoveMember(member.id, member.name)}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title={`Remove ${member.name} from group`}
                                  >
                                    <UserMinus className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-slate-400 py-2">No member details available</p>
                      )}
                    </div>
                  </div>

                  {/* Super Admin Danger Zone */}
                  {canManageActiveGroup && (
                    <div className="pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleDeleteGroup(activeGroup.id)}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete This Group</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
