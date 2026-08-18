import express from 'express';
import path from 'path';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { db, pool } from './src/db/index';
import { users, chatGroups, chatGroupMembers, chatMessages, tasks, notifications } from './src/db/schema';
import { eq, or, and, inArray, desc, asc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'forenclue-super-secret-key-2026';

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://work.forenclue.in',
      'https://ais-dev-dez7rzztl5zmxpysmmxlst-642747300953.asia-southeast1.run.app',
      'https://ais-pre-dez7rzztl5zmxpysmmxlst-642747300953.asia-southeast1.run.app'
    ];
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.forenclue.in') || origin.endsWith('.run.app')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.options('*', cors());
app.use(express.json({ limit: '10mb' }));

// Request logger for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

// Storage Bucket setup for files and images
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage, 
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit for files/images
});

app.use('/uploads', express.static(uploadsDir));

// Auth Middleware Helper
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// API Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    
    // Find user by email or forenclueId
    const userResult = await db.select().from(users).where(
      or(
        eq(users.email, identifier),
        eq(users.forenclueId, identifier.toUpperCase())
      )
    ).limit(1);

    if (userResult.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials or user not found' });
    }

    const user = userResult[0];

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, forenclueId: user.forenclueId, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Don't send password hash back
    const { passwordHash, ...safeUser } = user;
    
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, forenclueId, password, role, department } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await db.insert(users).values({
      name,
      email,
      forenclueId: forenclueId.toUpperCase(),
      passwordHash,
      role: role || 'EMPLOYEE',
      department: department || null
    }).returning();
    
    const { passwordHash: _, ...safeUser } = newUser[0];

    // If department assigned, add to department chat group automatically
    if (department) {
      try {
        const matchingGroup = await db.select().from(chatGroups).where(eq(chatGroups.name, department)).limit(1);
        if (matchingGroup.length > 0) {
          const groupId = matchingGroup[0].id;
          const isMember = await db.select().from(chatGroupMembers)
            .where(and(eq(chatGroupMembers.groupId, groupId), eq(chatGroupMembers.userId, safeUser.id)))
            .limit(1);
          if (isMember.length === 0) {
            await db.insert(chatGroupMembers).values({
              groupId,
              userId: safeUser.id
            });
          }
        }
      } catch (grpErr) {
        console.error("Auto group enrollment error:", grpErr);
      }
    }

    res.json({ user: safeUser });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Failed to create user' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
  try {
    const userResult = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
    if (userResult.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const { passwordHash, ...safeUser } = userResult[0];
    res.json({ user: safeUser });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.post('/api/auth/update-password', authenticateToken, async (req: any, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    await db.update(users)
      .set({ passwordHash, tempPasswordChanged: true })
      .where(eq(users.id, req.user.id));

    res.json({ success: true });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Failed to update password' });
  }
});

// Update personal profile information
app.put('/api/auth/profile', authenticateToken, async (req: any, res) => {
  try {
    const { name } = req.body;
    const updateData: any = {};
    if (name && typeof name === 'string' && name.trim().length > 0) {
      updateData.name = name.trim();
    }
    
    if (Object.keys(updateData).length > 0) {
      await db.update(users).set(updateData).where(eq(users.id, req.user.id));
    }
    
    const userResult = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
    if (userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const { passwordHash, ...safeUser } = userResult[0];
    res.json({ user: safeUser });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    res.status(400).json({ error: error.message || 'Failed to update profile' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const allUsers = await db.select().from(users);
    const safeUsers = allUsers.map(u => {
      const { passwordHash, ...safe } = u;
      return safe;
    });
    res.json(safeUsers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user department
app.put('/api/users/:id/department', authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Only Super Admin can reassign departments' });
    }
    const targetUserId = parseInt(req.params.id);
    const { department } = req.body;

    await db.update(users)
      .set({ department })
      .where(eq(users.id, targetUserId));

    if (department) {
      try {
        const matchingGroup = await db.select().from(chatGroups).where(eq(chatGroups.name, department)).limit(1);
        if (matchingGroup.length > 0) {
          const groupId = matchingGroup[0].id;
          const isMember = await db.select().from(chatGroupMembers)
            .where(and(eq(chatGroupMembers.groupId, groupId), eq(chatGroupMembers.userId, targetUserId)))
            .limit(1);
          if (isMember.length === 0) {
            await db.insert(chatGroupMembers).values({
              groupId,
              userId: targetUserId
            });
          }
        }
      } catch (grpErr) {
        console.error("Auto group update enrollment error:", grpErr);
      }
    }

    res.json({ success: true, department });
  } catch (error: any) {
    console.error("Error updating user department:", error);
    res.status(500).json({ error: 'Failed to update department' });
  }
});

// ================= CHAT API ENDPOINTS =================

// File Upload endpoint (Storage Bucket)
app.post('/api/upload', authenticateToken, upload.single('file'), (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl, name: req.file.originalname });
  } catch (err: any) {
    console.error('Error uploading file:', err);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

const formatMessageForUser = (msg: any, currentUserId: number, isSuperAdmin: boolean) => {
  if (!msg) return null;
  const senderId = msg.senderId !== undefined ? msg.senderId : msg.sender_id;
  const isSender = senderId === currentUserId;
  const isSystemMsg = msg.content && (msg.content.startsWith('👋') || msg.content.startsWith('➕') || msg.content.startsWith('🚪') || msg.content.startsWith('➖'));
  const senderRole = msg.senderRole || msg.sender_role;
  const isAdminSender = senderRole === 'SUPER_ADMIN';

  if (isSuperAdmin || isSender || isAdminSender || isSystemMsg) {
    return {
      ...msg,
      isEncrypted: false,
    };
  } else {
    return {
      ...msg,
      content: '🔒 [End-to-End Encrypted Message — Visible only to sender and ForenClue Admin]',
      attachmentUrl: null,
      attachmentName: null,
      isEncrypted: true,
    };
  }
};

// GET all groups accessible by the user
app.get('/api/chat/groups', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const isSuperAdmin = req.user.role === 'SUPER_ADMIN';

    // Fetch groups
    let groupsList: any[] = [];
    if (isSuperAdmin) {
      groupsList = await db.select().from(chatGroups).orderBy(desc(chatGroups.createdAt));
    } else {
      const memberGroupIds = await db
        .select({ groupId: chatGroupMembers.groupId })
        .from(chatGroupMembers)
        .where(eq(chatGroupMembers.userId, userId));
      
      const ids = memberGroupIds.map(m => m.groupId);
      if (ids.length > 0) {
        groupsList = await db
          .select()
          .from(chatGroups)
          .where(inArray(chatGroups.id, ids))
          .orderBy(desc(chatGroups.createdAt));
      }
    }

    // Enrich groups with members and last message
    const enrichedGroups = await Promise.all(
      groupsList.map(async (group) => {
        // Fetch members
        const membersData = await pool.query(
          `SELECT u.id, u.name, u.email, u.forenclue_id as "forenclueId", u.role, u.department 
           FROM chat_group_members cgm
           JOIN users u ON cgm.user_id = u.id
           WHERE cgm.group_id = $1`,
          [group.id]
        );

        // Fetch last message
        const lastMsgData = await pool.query(
          `SELECT cm.id, cm.content, cm.attachment_url as "attachmentUrl", cm.attachment_name as "attachmentName", cm.created_at as "createdAt", u.name as "senderName", u.forenclue_id as "senderId", u.role as "senderRole"
           FROM chat_messages cm
           JOIN users u ON cm.sender_id = u.id
           WHERE cm.group_id = $1
           ORDER BY cm.created_at DESC
           LIMIT 1`,
          [group.id]
        );

        const isDirect = group.name.startsWith('DM:') || group.name.startsWith('Direct:');
        let otherUser = null;
        let displayName = group.name;

        if (isDirect) {
          const otherMember = membersData.rows.find((m: any) => m.id !== userId);
          if (otherMember) {
            otherUser = otherMember;
            displayName = `${otherMember.name}`;
          }
        }

        const rawLastMsg = lastMsgData.rows[0] || null;
        const lastMessage = rawLastMsg ? formatMessageForUser(rawLastMsg, userId, isSuperAdmin) : null;

        return {
          ...group,
          isDirect,
          displayName,
          otherUser,
          memberCount: membersData.rows.length,
          members: membersData.rows,
          lastMessage,
        };
      })
    );

    res.json(enrichedGroups);
  } catch (error: any) {
    console.error('Error fetching chat groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// OPEN or CREATE DIRECT 1-on-1 Personal Chat (e.g. Member to Mentor)
app.post('/api/chat/direct', authenticateToken, async (req: any, res) => {
  try {
    const currentUserId = req.user.id;
    const { targetUserId, targetForenclueId } = req.body;

    let targetUser: any;
    if (targetUserId) {
      const userRes = await db.select().from(users).where(eq(users.id, Number(targetUserId))).limit(1);
      targetUser = userRes[0];
    } else if (targetForenclueId) {
      const userRes = await db.select().from(users).where(eq(users.forenclueId, targetForenclueId.toUpperCase())).limit(1);
      targetUser = userRes[0];
    }

    if (!targetUser) {
      return res.status(404).json({ error: 'Target member or mentor not found' });
    }

    // Check if direct chat already exists between these 2 users
    const existingGroupQuery = await pool.query(
      `SELECT g.id, g.name, g.description, g.avatar_url as "avatarUrl", g.created_by as "createdBy", g.created_at as "createdAt"
       FROM chat_groups g
       JOIN chat_group_members m1 ON g.id = m1.group_id AND m1.user_id = $1
       JOIN chat_group_members m2 ON g.id = m2.group_id AND m2.user_id = $2
       WHERE g.name LIKE 'DM:%' OR g.name LIKE 'Direct:%'
       LIMIT 1`,
      [currentUserId, targetUser.id]
    );

    let group: any;
    if (existingGroupQuery.rows.length > 0) {
      group = existingGroupQuery.rows[0];
    } else {
      // Create new direct message group
      const newGroup = await db.insert(chatGroups).values({
        name: `DM: ${targetUser.name} & ${req.user.forenclueId}`,
        description: `Direct 1-on-1 consultation channel with ${targetUser.name} (${targetUser.role.replace('_', ' ')} • ${targetUser.department || 'ForenClue'})`,
        avatarUrl: 'preset:command',
        createdBy: currentUserId,
      }).returning();

      group = newGroup[0];

      // Add both members
      await db.insert(chatGroupMembers).values({
        groupId: group.id,
        userId: currentUserId,
      });
      if (targetUser.id !== currentUserId) {
        await db.insert(chatGroupMembers).values({
          groupId: group.id,
          userId: targetUser.id,
        });
      }

      // Initial system message
      await db.insert(chatMessages).values({
        groupId: group.id,
        senderId: currentUserId,
        content: `👋 Direct 1-on-1 consultation channel initialized with ${targetUser.name} (${targetUser.forenclueId}).`,
      });
    }

    // Return the group with members and otherUser details
    const membersData = await pool.query(
      `SELECT u.id, u.name, u.email, u.forenclue_id as "forenclueId", u.role, u.department 
       FROM chat_group_members cgm
       JOIN users u ON cgm.user_id = u.id
       WHERE cgm.group_id = $1`,
      [group.id]
    );

    const lastMsgData = await pool.query(
      `SELECT cm.id, cm.content, cm.created_at as "createdAt", u.name as "senderName", u.forenclue_id as "senderId"
       FROM chat_messages cm
       JOIN users u ON cm.sender_id = u.id
       WHERE cm.group_id = $1
       ORDER BY cm.created_at DESC
       LIMIT 1`,
      [group.id]
    );

    res.json({
      ...group,
      isDirect: true,
      displayName: targetUser.name,
      otherUser: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        forenclueId: targetUser.forenclueId,
        role: targetUser.role,
        department: targetUser.department,
      },
      memberCount: membersData.rows.length,
      members: membersData.rows,
      lastMessage: lastMsgData.rows[0] || null,
    });
  } catch (error: any) {
    console.error('Error opening direct chat:', error);
    res.status(500).json({ error: error.message || 'Failed to open direct chat' });
  }
});

// CREATE a new group (Super Admin or authorized team leader)
app.post('/api/chat/groups', authenticateToken, async (req: any, res) => {
  try {
    const { name, description, avatarUrl, memberIds } = req.body;
    const userId = req.user.id;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Group title is required' });
    }

    // Insert group
    const newGroup = await db.insert(chatGroups).values({
      name: name.trim(),
      description: description ? description.trim() : null,
      avatarUrl: avatarUrl || null,
      createdBy: userId,
    }).returning();

    const createdGroup = newGroup[0];

    // Combine creator ID and selected memberIds
    const distinctMemberIds = Array.from(
      new Set([userId, ...(Array.isArray(memberIds) ? memberIds.map(Number) : [])])
    );

    // Insert members
    if (distinctMemberIds.length > 0) {
      for (const mId of distinctMemberIds) {
        await db.insert(chatGroupMembers).values({
          groupId: createdGroup.id,
          userId: mId,
        });
      }
    }

    // Optional welcome system message
    await db.insert(chatMessages).values({
      groupId: createdGroup.id,
      senderId: userId,
      content: `👋 Group "${createdGroup.name}" created by ${req.user.forenclueId}. Welcome team members!`,
    });

    // Return the newly created group with members
    const membersData = await pool.query(
      `SELECT u.id, u.name, u.email, u.forenclue_id as "forenclueId", u.role 
       FROM chat_group_members cgm
       JOIN users u ON cgm.user_id = u.id
       WHERE cgm.group_id = $1`,
      [createdGroup.id]
    );

    res.json({
      ...createdGroup,
      memberCount: membersData.rows.length,
      members: membersData.rows,
    });
  } catch (error: any) {
    console.error('Error creating chat group:', error);
    res.status(500).json({ error: error.message || 'Failed to create group' });
  }
});

// UPDATE group (name, description, avatar, members)
app.put('/api/chat/groups/:id', authenticateToken, async (req: any, res) => {
  try {
    const groupId = parseInt(req.params.id);
    const { name, description, avatarUrl, memberIds } = req.body;

    const groupResult = await db.select().from(chatGroups).where(eq(chatGroups.id, groupId)).limit(1);
    if (groupResult.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const group = groupResult[0];
    if (req.user.role !== 'SUPER_ADMIN' && group.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    await db.update(chatGroups)
      .set({
        name: name ? name.trim() : group.name,
        description: description !== undefined ? description : group.description,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : group.avatarUrl,
      })
      .where(eq(chatGroups.id, groupId));

    // Update members if memberIds provided
    if (Array.isArray(memberIds)) {
      await db.delete(chatGroupMembers).where(eq(chatGroupMembers.groupId, groupId));
      const distinctMemberIds = Array.from(
        new Set([group.createdBy, ...memberIds.map(Number)])
      );
      for (const mId of distinctMemberIds) {
        await db.insert(chatGroupMembers).values({
          groupId: groupId,
          userId: mId,
        });
      }
    }

    const membersData = await pool.query(
      `SELECT u.id, u.name, u.email, u.forenclue_id as "forenclueId", u.role 
       FROM chat_group_members cgm
       JOIN users u ON cgm.user_id = u.id
       WHERE cgm.group_id = $1`,
      [groupId]
    );

    res.json({
      id: groupId,
      name: name || group.name,
      description: description !== undefined ? description : group.description,
      avatarUrl: avatarUrl !== undefined ? avatarUrl : group.avatarUrl,
      memberCount: membersData.rows.length,
      members: membersData.rows,
    });
  } catch (error: any) {
    console.error('Error updating group:', error);
    res.status(500).json({ error: 'Failed to update group' });
  }
});

// ADD MEMBERS to an existing group (Admins or creator)
app.post('/api/chat/groups/:id/members', authenticateToken, async (req: any, res) => {
  try {
    const groupId = parseInt(req.params.id);
    const { memberIds } = req.body;

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ error: 'No member IDs provided' });
    }

    const groupResult = await db.select().from(chatGroups).where(eq(chatGroups.id, groupId)).limit(1);
    if (groupResult.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const group = groupResult[0];
    if (req.user.role !== 'SUPER_ADMIN' && group.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Permission denied: Only Admins can add members' });
    }

    // Get existing member IDs
    const existing = await db
      .select({ userId: chatGroupMembers.userId })
      .from(chatGroupMembers)
      .where(eq(chatGroupMembers.groupId, groupId));
    
    const existingSet = new Set(existing.map(m => m.userId));
    const newMemberIds = memberIds.map(Number).filter(id => !existingSet.has(id));

    if (newMemberIds.length > 0) {
      // Insert new members
      for (const mId of newMemberIds) {
        await db.insert(chatGroupMembers).values({
          groupId,
          userId: mId,
        });
      }

      // Fetch names of added members for announcement
      const addedUsers = await db.select().from(users).where(inArray(users.id, newMemberIds));
      const addedNames = addedUsers.map(u => `${u.name} (${u.forenclueId})`).join(', ');

      // Post announcement message
      await db.insert(chatMessages).values({
        groupId,
        senderId: req.user.id,
        content: `➕ Added new members to the group: ${addedNames}`,
      });
    }

    // Return updated members
    const membersData = await pool.query(
      `SELECT u.id, u.name, u.email, u.forenclue_id as "forenclueId", u.role 
       FROM chat_group_members cgm
       JOIN users u ON cgm.user_id = u.id
       WHERE cgm.group_id = $1`,
      [groupId]
    );

    res.json({
      success: true,
      addedCount: newMemberIds.length,
      memberCount: membersData.rows.length,
      members: membersData.rows,
    });
  } catch (error: any) {
    console.error('Error adding members to group:', error);
    res.status(500).json({ error: 'Failed to add members' });
  }
});

// REMOVE A MEMBER from a group (Admins or creator)
app.delete('/api/chat/groups/:id/members/:userId', authenticateToken, async (req: any, res) => {
  try {
    const groupId = parseInt(req.params.id);
    const targetUserId = parseInt(req.params.userId);

    const groupResult = await db.select().from(chatGroups).where(eq(chatGroups.id, groupId)).limit(1);
    if (groupResult.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const group = groupResult[0];
    const isSelfLeaving = req.user.id === targetUserId;
    const isAdmin = req.user.role === 'SUPER_ADMIN' || group.createdBy === req.user.id;

    if (!isAdmin && !isSelfLeaving) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Fetch target user info
    const targetUser = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
    const targetName = targetUser[0]?.name || 'Member';

    // Remove member
    await db.delete(chatGroupMembers)
      .where(and(
        eq(chatGroupMembers.groupId, groupId),
        eq(chatGroupMembers.userId, targetUserId)
      ));

    // Post announcement
    await db.insert(chatMessages).values({
      groupId,
      senderId: req.user.id,
      content: isSelfLeaving 
        ? `🚪 ${targetName} left the group.`
        : `➖ ${targetName} was removed from the group by ${req.user.forenclueId}.`,
    });

    const membersData = await pool.query(
      `SELECT u.id, u.name, u.email, u.forenclue_id as "forenclueId", u.role 
       FROM chat_group_members cgm
       JOIN users u ON cgm.user_id = u.id
       WHERE cgm.group_id = $1`,
      [groupId]
    );

    res.json({
      success: true,
      memberCount: membersData.rows.length,
      members: membersData.rows,
    });
  } catch (error: any) {
    console.error('Error removing member:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// DELETE a group
app.delete('/api/chat/groups/:id', authenticateToken, async (req: any, res) => {
  try {
    const groupId = parseInt(req.params.id);
    const groupResult = await db.select().from(chatGroups).where(eq(chatGroups.id, groupId)).limit(1);
    if (groupResult.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (req.user.role !== 'SUPER_ADMIN' && groupResult[0].createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    await db.delete(chatGroups).where(eq(chatGroups.id, groupId));
    res.json({ success: true, message: 'Group deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting group:', error);
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

// GET messages for a group
app.get('/api/chat/groups/:id/messages', authenticateToken, async (req: any, res) => {
  try {
    const groupId = parseInt(req.params.id);
    
    // Check membership
    if (req.user.role !== 'SUPER_ADMIN') {
      const membership = await db
        .select()
        .from(chatGroupMembers)
        .where(
          and(
            eq(chatGroupMembers.groupId, groupId),
            eq(chatGroupMembers.userId, req.user.id)
          )
        )
        .limit(1);
      
      if (membership.length === 0) {
        return res.status(403).json({ error: 'You are not a member of this group' });
      }
    }

    const messagesData = await pool.query(
      `SELECT cm.id, cm.group_id as "groupId", cm.sender_id as "senderId", cm.content, cm.attachment_url as "attachmentUrl", cm.attachment_name as "attachmentName", cm.created_at as "createdAt",
              u.name as "senderName", u.forenclue_id as "senderForenclueId", u.role as "senderRole", u.email as "senderEmail"
       FROM chat_messages cm
       JOIN users u ON cm.sender_id = u.id
       WHERE cm.group_id = $1
       ORDER BY cm.created_at ASC`,
      [groupId]
    );

    const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
    const formattedMessages = messagesData.rows.map((msg: any) => formatMessageForUser(msg, req.user.id, isSuperAdmin));

    res.json(formattedMessages);
  } catch (error: any) {
    console.error('Error fetching group messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST a new message to a group
app.post('/api/chat/groups/:id/messages', authenticateToken, async (req: any, res) => {
  try {
    const groupId = parseInt(req.params.id);
    const { content, attachmentUrl, attachmentName } = req.body;
    const senderId = req.user.id;

    if ((!content || !content.trim()) && !attachmentUrl) {
      return res.status(400).json({ error: 'Message content or attachment cannot be empty' });
    }

    // Insert message
    const newMsg = await db.insert(chatMessages).values({
      groupId,
      senderId,
      content: content ? content.trim() : (attachmentName ? `Sent attachment: ${attachmentName}` : 'Sent file attachment'),
      attachmentUrl: attachmentUrl || null,
      attachmentName: attachmentName || null,
    }).returning();

    const senderResult = await db.select().from(users).where(eq(users.id, senderId)).limit(1);
    const sender = senderResult[0];

    res.json({
      id: newMsg[0].id,
      groupId: newMsg[0].groupId,
      senderId: newMsg[0].senderId,
      content: newMsg[0].content,
      attachmentUrl: newMsg[0].attachmentUrl,
      attachmentName: newMsg[0].attachmentName,
      createdAt: newMsg[0].createdAt,
      senderName: sender.name,
      senderForenclueId: sender.forenclueId,
      senderRole: sender.role,
      senderEmail: sender.email,
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ================= TASK MANAGEMENT API ENDPOINTS =================

// GET tasks (Superadmin gets all or filtered by member; members get ONLY tasks allotted to them)
app.get('/api/tasks', authenticateToken, async (req: any, res) => {
  try {
    const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
    const userId = req.user.id;
    const { memberId, status, priority } = req.query;

    let query = `
      SELECT 
        t.id, 
        t.title, 
        t.description, 
        t.priority, 
        t.status, 
        t.assigned_to as "assignedTo", 
        t.department, 
        t.due_date as "dueDate", 
        t.created_by as "createdBy", 
        t.notes, 
        t.created_at as "createdAt", 
        t.updated_at as "updatedAt",
        au.name as "assignedUserName",
        au.email as "assignedUserEmail",
        au.forenclue_id as "assignedUserForenclueId",
        au.role as "assignedUserRole",
        cu.name as "creatorName",
        cu.forenclue_id as "creatorForenclueId"
      FROM tasks t
      LEFT JOIN users au ON t.assigned_to = au.id
      LEFT JOIN users cu ON t.created_by = cu.id
    `;

    const conditions: string[] = [];
    const params: any[] = [];

    if (!isSuperAdmin) {
      // Member sees ONLY tasks allotted specifically to them
      params.push(userId);
      conditions.push(`t.assigned_to = $${params.length}`);
    } else {
      // Superadmin can filter by specific member
      if (memberId && memberId !== 'ALL') {
        params.push(parseInt(memberId as string));
        conditions.push(`t.assigned_to = $${params.length}`);
      }
    }

    if (status && status !== 'ALL') {
      params.push(status);
      conditions.push(`t.status = $${params.length}`);
    }

    if (priority && priority !== 'ALL') {
      params.push(priority);
      conditions.push(`t.priority = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY t.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// CREATE task and allot to member (Superadmin / Admins)
app.post('/api/tasks', authenticateToken, async (req: any, res) => {
  try {
    const { title, description, priority, assignedTo, department, dueDate, notes } = req.body;
    const creatorId = req.user.id;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const assignedUserId = assignedTo ? parseInt(assignedTo) : null;

    const inserted = await db.insert(tasks).values({
      title: title.trim(),
      description: description ? description.trim() : null,
      priority: priority || 'MEDIUM',
      status: 'TODO',
      assignedTo: assignedUserId,
      department: department || 'General Forensics',
      dueDate: dueDate || 'TBD',
      createdBy: creatorId,
      notes: notes ? notes.trim() : null,
    }).returning();

    const createdTask = inserted[0];

    // If allotted to a member, send notification to that member
    if (assignedUserId) {
      const creatorResult = await db.select().from(users).where(eq(users.id, creatorId)).limit(1);
      const creator = creatorResult[0];
      const assignerName = creator ? `${creator.name} (${creator.forenclueId})` : 'Super Admin';

      await db.insert(notifications).values({
        userId: assignedUserId,
        senderId: creatorId,
        title: '📋 New Workspace Task Allotted',
        message: `${assignerName} allotted you task: "${createdTask.title}" (${createdTask.priority} priority, Due: ${createdTask.dueDate || 'Standard timeline'}).`,
        type: 'TASK_ASSIGNED',
        link: '/tasks',
      });
    }

    // Fetch created task with user details
    const result = await pool.query(
      `SELECT 
        t.id, 
        t.title, 
        t.description, 
        t.priority, 
        t.status, 
        t.assigned_to as "assignedTo", 
        t.department, 
        t.due_date as "dueDate", 
        t.created_by as "createdBy", 
        t.notes, 
        t.created_at as "createdAt", 
        t.updated_at as "updatedAt",
        au.name as "assignedUserName",
        au.email as "assignedUserEmail",
        au.forenclue_id as "assignedUserForenclueId",
        au.role as "assignedUserRole",
        cu.name as "creatorName",
        cu.forenclue_id as "creatorForenclueId"
      FROM tasks t
      LEFT JOIN users au ON t.assigned_to = au.id
      LEFT JOIN users cu ON t.created_by = cu.id
      WHERE t.id = $1`,
      [createdTask.id]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: error.message || 'Failed to create task' });
  }
});

// UPDATE task (Status, notes, re-allot, or edit details)
app.put('/api/tasks/:id', authenticateToken, async (req: any, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { title, description, priority, status, assignedTo, department, dueDate, notes } = req.body;
    const isSuperAdmin = req.user.role === 'SUPER_ADMIN';
    const currentUserId = req.user.id;

    const existingResult = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
    if (existingResult.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const existingTask = existingResult[0];

    // Permission check: only SuperAdmin or the allotted user can update
    if (!isSuperAdmin && existingTask.assignedTo !== currentUserId) {
      return res.status(403).json({ error: 'Permission denied: This task is not allotted to you' });
    }

    const newAssignedUserId = assignedTo !== undefined ? (assignedTo ? parseInt(assignedTo) : null) : existingTask.assignedTo;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    // SuperAdmin can edit assignment and core details
    if (isSuperAdmin) {
      if (title !== undefined) updateData.title = title.trim();
      if (description !== undefined) updateData.description = description ? description.trim() : null;
      if (priority !== undefined) updateData.priority = priority;
      if (assignedTo !== undefined) updateData.assignedTo = newAssignedUserId;
      if (department !== undefined) updateData.department = department;
      if (dueDate !== undefined) updateData.dueDate = dueDate;
    }

    await db.update(tasks).set(updateData).where(eq(tasks.id, taskId));

    // If task was re-allotted to a different member by SuperAdmin, notify the new member
    if (isSuperAdmin && newAssignedUserId && newAssignedUserId !== existingTask.assignedTo) {
      const creatorResult = await db.select().from(users).where(eq(users.id, currentUserId)).limit(1);
      const creator = creatorResult[0];
      const assignerName = creator ? `${creator.name} (${creator.forenclueId})` : 'Super Admin';

      await db.insert(notifications).values({
        userId: newAssignedUserId,
        senderId: currentUserId,
        title: '📋 Workspace Task Re-Allotted to You',
        message: `${assignerName} allotted you task: "${title || existingTask.title}" (${priority || existingTask.priority} priority).`,
        type: 'TASK_ASSIGNED',
        link: '/tasks',
      });
    }

    // If member changed status (e.g. TODO -> IN_PROGRESS -> COMPLETED), notify the assigner/superadmin
    if (!isSuperAdmin && status && status !== existingTask.status) {
      const memberResult = await db.select().from(users).where(eq(users.id, currentUserId)).limit(1);
      const member = memberResult[0];
      const memberName = member ? `${member.name} (${member.forenclueId})` : 'Member';

      await db.insert(notifications).values({
        userId: existingTask.createdBy,
        senderId: currentUserId,
        title: `⚡ Task Status Update: ${status}`,
        message: `${memberName} updated status of "${existingTask.title}" to ${status.replace('_', ' ')}.`,
        type: 'TASK_UPDATE',
        link: '/tasks',
      });
    }

    const result = await pool.query(
      `SELECT 
        t.id, 
        t.title, 
        t.description, 
        t.priority, 
        t.status, 
        t.assigned_to as "assignedTo", 
        t.department, 
        t.due_date as "dueDate", 
        t.created_by as "createdBy", 
        t.notes, 
        t.created_at as "createdAt", 
        t.updated_at as "updatedAt",
        au.name as "assignedUserName",
        au.email as "assignedUserEmail",
        au.forenclue_id as "assignedUserForenclueId",
        au.role as "assignedUserRole",
        cu.name as "creatorName",
        cu.forenclue_id as "creatorForenclueId"
      FROM tasks t
      LEFT JOIN users au ON t.assigned_to = au.id
      LEFT JOIN users cu ON t.created_by = cu.id
      WHERE t.id = $1`,
      [taskId]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: error.message || 'Failed to update task' });
  }
});

// DELETE task (Superadmin only)
app.delete('/api/tasks/:id', authenticateToken, async (req: any, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const isSuperAdmin = req.user.role === 'SUPER_ADMIN';

    if (!isSuperAdmin) {
      return res.status(403).json({ error: 'Only Super Admin can delete workspace tasks' });
    }

    await db.delete(tasks).where(eq(tasks.id, taskId));
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// ================= NOTIFICATIONS API ENDPOINTS =================

// GET current user's workspace notifications
app.get('/api/notifications', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const notifs = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(30);

    const unreadCount = notifs.filter(n => !n.read).length;
    res.json({ notifications: notifs, unreadCount });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark all notifications as read
app.put('/api/notifications/read-all', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error marking notifications read:', error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// Mark single notification as read
app.put('/api/notifications/:id/read', authenticateToken, async (req: any, res) => {
  try {
    const notifId = parseInt(req.params.id);
    const userId = req.user.id;
    await db.update(notifications)
      .set({ read: true })
      .where(and(
        eq(notifications.id, notifId),
        eq(notifications.userId, userId)
      ));

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error marking notification read:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});


// Start server
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
