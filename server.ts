import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createServer as createViteServer } from 'vite';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import webpush from 'web-push';

const app = express();
const port = Number(process.env.PORT || 3000);
const maxFileSizeMb = Number(process.env.R2_MAX_FILE_SIZE_MB || 25);
const maxFileSizeBytes = maxFileSizeMb * 1024 * 1024;
const bucketName = process.env.R2_BUCKET_NAME || 'forencluework';

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'audio/mpeg',
  'audio/wav',
  'video/mp4',
  'application/octet-stream'
]);

app.disable('x-powered-by');
app.set('trust proxy', true);
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

import { initializeApp, getApps } from 'firebase/app';
import { initializeFirestore, collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';

// ----------------------------------------------------
// WEB PUSH & BACKGROUND NOTIFICATIONS
// ----------------------------------------------------
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || 'BD6x0QDTjiEXrGNy1exUxz3JEL1-LbNRNu4WTxdeAqjNG59QnJef-hMTRHNdxjQ8d_tGoOmeUmqsFIMzrkz3jpk';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 'gY-P9gPCWVPBn6Wzh2OL09Ns1p33Jw6gNkWSZfyVWNc';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:contact@forenclue.in';

try {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
} catch (error) {
  console.error('VAPID setup warning:', error);
}

// Server Firebase instance for background Firestore subscriptions
let serverFirestoreDb: any = null;
try {
  const firebaseConfigPath = resolve(process.cwd(), 'firebase-applet-config.json');
  if (existsSync(firebaseConfigPath)) {
    const rawConfig = JSON.parse(readFileSync(firebaseConfigPath, 'utf-8'));
    const sApp = !getApps().length ? initializeApp(rawConfig) : getApps()[0];
    serverFirestoreDb = initializeFirestore(sApp, {}, rawConfig.firestoreDatabaseId || undefined);
  }
} catch (fbInitErr) {
  console.warn('Server Firestore initialization notice:', fbInitErr);
}

interface PushSubscriptionRecord {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId?: string;
  forenclueId?: string;
  role?: string;
  department?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

const pushSubscriptions = new Map<string, PushSubscriptionRecord>();

async function getAllPushSubscriptions(): Promise<PushSubscriptionRecord[]> {
  const subsMap = new Map<string, PushSubscriptionRecord>();

  // 1. In-memory cache
  for (const [endpoint, record] of pushSubscriptions.entries()) {
    subsMap.set(endpoint, record);
  }

  // 2. Query Firestore push_subscriptions collection
  if (serverFirestoreDb) {
    try {
      const snap = await getDocs(collection(serverFirestoreDb, 'push_subscriptions'));
      snap.forEach((docSnap) => {
        const data = docSnap.data() as any;
        if (data && data.endpoint && data.keys && data.keys.p256dh && data.keys.auth) {
          const rec: PushSubscriptionRecord = {
            endpoint: data.endpoint,
            keys: data.keys,
            userId: data.userId ? String(data.userId) : undefined,
            forenclueId: data.forenclueId ? String(data.forenclueId) : undefined,
            role: data.role,
            department: data.department,
            userAgent: data.userAgent,
            createdAt: data.createdAt || data.updatedAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString()
          };
          subsMap.set(data.endpoint, rec);
          pushSubscriptions.set(data.endpoint, rec);
        }
      });
    } catch (err) {
      console.warn('Could not read push_subscriptions from Firestore:', err);
    }
  }

  return Array.from(subsMap.values());
}

// Public key endpoint for client PWA subscription
app.get('/api/push/vapid-public-key', (_req, res) => {
  res.json({ publicKey: vapidPublicKey });
});

// Register or update a device/browser push subscription
app.post('/api/push/subscribe', async (req, res) => {
  try {
    const { subscription, userId, forenclueId, role, department, userAgent } = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
      res.status(400).json({ error: 'A valid PushSubscription object with keys is required.' });
      return;
    }

    const endpoint = subscription.endpoint;
    const now = new Date().toISOString();
    const existing = pushSubscriptions.get(endpoint);

    const record: PushSubscriptionRecord = {
      endpoint,
      keys: subscription.keys,
      userId: userId ? String(userId) : (existing?.userId || ''),
      forenclueId: forenclueId || existing?.forenclueId || '',
      role: role || existing?.role || '',
      department: department || existing?.department || '',
      userAgent: userAgent || existing?.userAgent || '',
      createdAt: existing?.createdAt || now,
      updatedAt: now
    };

    pushSubscriptions.set(endpoint, record);

    if (serverFirestoreDb) {
      try {
        const safeDocId = Buffer.from(endpoint).toString('base64').replace(/[/+=]/g, '_').slice(-60);
        await setDoc(doc(serverFirestoreDb, 'push_subscriptions', safeDocId), {
          endpoint: record.endpoint,
          keys: record.keys,
          userId: record.userId,
          forenclueId: record.forenclueId,
          role: record.role,
          department: record.department,
          userAgent: record.userAgent,
          updatedAt: record.updatedAt
        }, { merge: true });
      } catch (err) {
        console.warn('Firestore subscription save warning on server:', err);
      }
    }

    res.status(200).json({ success: true, count: pushSubscriptions.size });
  } catch (error) {
    console.error('Error registering push subscription:', error);
    res.status(500).json({ error: 'Failed to register push subscription.' });
  }
});

// Unsubscribe an endpoint
app.post('/api/push/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (endpoint) {
      pushSubscriptions.delete(endpoint);
      if (serverFirestoreDb) {
        try {
          const safeDocId = Buffer.from(endpoint).toString('base64').replace(/[/+=]/g, '_').slice(-60);
          await deleteDoc(doc(serverFirestoreDb, 'push_subscriptions', safeDocId));
        } catch {}
      }
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unsubscribe.' });
  }
});

// Test background push notification
app.post('/api/push/test', async (req, res) => {
  try {
    const { userId, title, body } = req.body;
    const targetPayload = JSON.stringify({
      title: title || 'ForenClue Background Alert',
      body: body || 'Background push notifications are working! Real-time workspace alerts will appear on your lock screen.',
      icon: '/app-icon-192.png',
      badge: '/favicon.png',
      url: '/profile',
      tag: `test-push-${Date.now()}`,
      data: { url: '/profile' }
    });

    const allSubscriptions = await getAllPushSubscriptions();
    let targets = allSubscriptions;
    if (userId) {
      const targetStr = String(userId).trim().toLowerCase();
      const userMatches = allSubscriptions.filter(s => 
        (s.userId && s.userId.trim().toLowerCase() === targetStr) ||
        (s.forenclueId && s.forenclueId.trim().toLowerCase() === targetStr)
      );
      if (userMatches.length > 0) {
        targets = userMatches;
      }
    }

    if (targets.length === 0) {
      res.status(404).json({ error: 'No active push subscriptions found. Please grant notification permission on this device first.' });
      return;
    }

    let sent = 0;
    let failed = 0;

    await Promise.allSettled(
      targets.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys
            },
            targetPayload,
            {
              TTL: 86400,
              urgency: 'high'
            }
          );
          sent++;
        } catch (err: any) {
          failed++;
          console.warn('Push delivery error for endpoint:', sub.endpoint.substring(0, 40), err.statusCode, err.message);
          if (err.statusCode === 404 || err.statusCode === 410) {
            pushSubscriptions.delete(sub.endpoint);
            if (serverFirestoreDb) {
              try {
                const safeDocId = Buffer.from(sub.endpoint).toString('base64').replace(/[/+=]/g, '_').slice(-60);
                await deleteDoc(doc(serverFirestoreDb, 'push_subscriptions', safeDocId));
              } catch {}
            }
          }
        }
      })
    );

    res.json({ success: true, message: `Dispatched background notification to ${sent} device(s).`, sent, failed, total: targets.length });
  } catch (error: any) {
    console.error('Error sending test push notification:', error);
    res.status(500).json({ error: error?.message || 'Failed to send test push notification.' });
  }
});

// Broadcast or target push notification to members (Messages, Tasks, Announcements)
app.post('/api/push/send', async (req, res) => {
  try {
    const { userId, title, body, icon, badge, url, tag, data } = req.body;
    
    if (!title) {
      res.status(400).json({ error: 'Notification title is required.' });
      return;
    }

    const payload = JSON.stringify({
      title: title || 'ForenClue Notification',
      body: body || 'You have an update in your workspace.',
      icon: icon || '/app-icon-192.png',
      badge: badge || '/favicon.png',
      url: url || '/',
      tag: tag || `forenclue-${Date.now()}`,
      data: { url: url || '/', ...data }
    });

    const allSubscriptions = await getAllPushSubscriptions();
    let targets = allSubscriptions;
    if (userId && userId !== 'ALL') {
      const targetStr = String(userId).trim().toLowerCase();
      targets = allSubscriptions.filter(s => 
        (s.userId && s.userId.trim().toLowerCase() === targetStr) ||
        (s.forenclueId && s.forenclueId.trim().toLowerCase() === targetStr)
      );
    }

    if (targets.length === 0) {
      res.json({ success: true, sent: 0, message: 'No registered push devices for target recipient.' });
      return;
    }

    let sent = 0;
    let failed = 0;

    await Promise.allSettled(
      targets.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys
            },
            payload,
            {
              TTL: 86400,
              urgency: 'high'
            }
          );
          sent++;
        } catch (err: any) {
          failed++;
          console.warn('Push delivery failed for endpoint:', sub.endpoint.substring(0, 40), err.statusCode, err.message);
          if (err.statusCode === 404 || err.statusCode === 410) {
            pushSubscriptions.delete(sub.endpoint);
            if (serverFirestoreDb) {
              try {
                const safeDocId = Buffer.from(sub.endpoint).toString('base64').replace(/[/+=]/g, '_').slice(-60);
                await deleteDoc(doc(serverFirestoreDb, 'push_subscriptions', safeDocId));
              } catch {}
            }
          }
        }
      })
    );

    res.json({ success: true, sent, failed, total: targets.length });
  } catch (error: any) {
    console.error('Error dispatching push notifications:', error);
    res.status(500).json({ error: error?.message || 'Failed to dispatch push notifications.' });
  }
});

interface StoredLocalFile {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
  size: number;
  uploadedAt: Date;
}

const localFileStorage = new Map<string, StoredLocalFile>();

function isR2Configured(): boolean {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  return Boolean(accountId && accessKeyId && secretAccessKey && bucketName);
}

function readR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error('Cloud storage credentials are not yet configured in Settings.');
  }
  return { accountId, accessKeyId, secretAccessKey };
}

let cachedClient: S3Client | null = null;
function getR2Client(): S3Client {
  if (cachedClient) return cachedClient;
  const config = readR2Config();
  cachedClient = new S3Client({
    region: 'auto',
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    }
  });
  return cachedClient;
}

function readMemberId(req: Request): string | null {
  const authorization = req.header('authorization') || '';
  if (!authorization) return 'member_guest';
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  if (!match) return 'member_guest';
  const token = match[1].trim();
  if (token.startsWith('fc_token_')) {
    const parts = token.replace('fc_token_', '').split('_');
    return parts[0] || 'member';
  }
  return token.substring(0, 32) || 'member';
}

function requireWorkspaceMember(req: Request, res: Response, next: NextFunction) {
  const memberId = readMemberId(req);
  if (!memberId) {
    res.status(401).json({ error: 'A valid ForenClue member session is required.' });
    return;
  }
  res.locals.memberId = memberId;
  next();
}

function sanitizeSegment(value: string, fallback: string): string {
  const sanitized = value.trim().replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^\.+/, '');
  return sanitized || fallback;
}

function createDownloadSignature(key: string): string {
  try {
    const secret = process.env.R2_SECRET_ACCESS_KEY?.trim() || 'fc_storage_secure_fallback_key';
    return createHmac('sha256', secret).update(key).digest('hex');
  } catch {
    return 'sig_err';
  }
}

function isValidSignature(key: string, provided: string): boolean {
  try {
    const expected = Buffer.from(createDownloadSignature(key), 'hex');
    const received = Buffer.from(provided || '', 'hex');
    return expected.length === received.length && timingSafeEqual(expected, received);
  } catch {
    return false;
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 1, fileSize: maxFileSizeBytes },
  fileFilter(_req, file, callback) {
    if (file.mimetype && !allowedMimeTypes.has(file.mimetype)) {
      if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('text/')) {
        callback(null, true);
        return;
      }
    }
    callback(null, true);
  }
});

app.get(['/api/storage/status', '/api/upload/status'], requireWorkspaceMember, (_req, res) => {
  res.json({ configured: isR2Configured(), maxFileSizeMb });
});

app.post(['/api/storage/upload', '/api/upload'], requireWorkspaceMember, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file was supplied.' });
      return;
    }

    const folder = sanitizeSegment(String(req.body.folder || 'uploads'), 'uploads');
    const memberId = sanitizeSegment(String(res.locals.memberId), 'member');
    const fileName = sanitizeSegment(req.file.originalname, 'workspace-file');
    const key = `${folder}/${memberId}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}_${fileName}`;

    if (isR2Configured()) {
      await getR2Client().send(new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype || 'application/octet-stream',
        CacheControl: 'private, max-age=0',
        Metadata: {
          uploadedBy: memberId,
          originalName: encodeURIComponent(req.file.originalname)
        }
      }));
    } else {
      localFileStorage.set(key, {
        buffer: req.file.buffer,
        mimeType: req.file.mimetype || 'application/octet-stream',
        originalName: req.file.originalname,
        size: req.file.size,
        uploadedAt: new Date()
      });
    }

    const signature = createDownloadSignature(key);
    let url: string;
    
    if (process.env.R2_PUBLIC_URL) {
      const publicBase = process.env.R2_PUBLIC_URL.replace(/\/+$/, '');
      url = `${publicBase}/${key}`;
    } else if (process.env.STORAGE_PUBLIC_BASE_URL) {
      const publicBase = process.env.STORAGE_PUBLIC_BASE_URL.replace(/\/+$/, '');
      url = `${publicBase}/api/storage/files?key=${encodeURIComponent(key)}&signature=${signature}`;
    } else {
      const host = req.get('x-forwarded-host') || req.get('host') || '';
      const proto = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
      if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
        url = `${proto}://${host}/api/storage/files?key=${encodeURIComponent(key)}&signature=${signature}`;
      } else {
        url = `/api/storage/files?key=${encodeURIComponent(key)}&signature=${signature}`;
      }
    }
    
    res.status(201).json({
      success: true,
      url,
      key,
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype,
      provider: isR2Configured() ? 'cloud_storage' : 'local_storage'
    });
  } catch (error) {
    console.error('Storage upload failed:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Storage upload failed.' });
  }
});

app.get(['/api/storage/files', '/api/files'], async (req, res) => {
  try {
    const key = typeof req.query.key === 'string' ? req.query.key : '';
    const signature = typeof req.query.signature === 'string' ? req.query.signature : '';
    if (!key || !signature || !isValidSignature(key, signature)) {
      res.status(403).json({ error: 'This storage link is invalid or expired.' });
      return;
    }

    if (localFileStorage.has(key)) {
      const local = localFileStorage.get(key)!;
      const disposition = local.mimeType.startsWith('image/') || local.mimeType === 'application/pdf' ? 'inline' : 'attachment';
      res.setHeader('Content-Type', local.mimeType);
      res.setHeader('Content-Disposition', `${disposition}; filename="${local.originalName.replace(/["\r\n]/g, '_')}"`);
      res.setHeader('Cache-Control', 'private, no-store');
      res.send(local.buffer);
      return;
    }

    if (isR2Configured()) {
      const object = await getR2Client().send(new GetObjectCommand({ Bucket: bucketName, Key: key }));
      const originalName = object.Metadata?.originalname
        ? decodeURIComponent(object.Metadata.originalname)
        : key.split('/').pop() || 'workspace-file';
      const contentType = object.ContentType || 'application/octet-stream';
      const disposition = contentType.startsWith('image/') || contentType === 'application/pdf' ? 'inline' : 'attachment';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `${disposition}; filename="${originalName.replace(/["\r\n]/g, '_')}"`);
      res.setHeader('Cache-Control', 'private, no-store');

      const body = object.Body as any;
      if (body && typeof body.pipe === 'function') {
        body.pipe(res);
        return;
      }
      if (body && typeof body.transformToByteArray === 'function') {
        res.send(Buffer.from(await body.transformToByteArray()));
        return;
      }
    }

    res.status(404).json({ error: 'The requested workspace file was not found.' });
  } catch (error) {
    console.error('Storage download failed:', error);
    res.status(404).json({ error: 'The requested workspace file was not found.' });
  }
});

app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (!error) {
    next();
    return;
  }
  const message = error instanceof Error ? error.message : 'Upload request failed.';
  res.status(message.includes('File too large') ? 413 : 400).json({ error: message });
});

async function startServer() {
  const distPath = resolve(process.cwd(), 'dist');
  if (process.env.NODE_ENV === 'production' && existsSync(resolve(distPath, 'index.html'))) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(resolve(distPath, 'index.html')));
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`ForenClue workspace server started on port ${port}.`);
  });
}

startServer().catch(error => {
  console.error('Failed to start ForenClue workspace server:', error);
  process.exit(1);
});
