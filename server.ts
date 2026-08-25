import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createServer as createViteServer } from 'vite';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

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
