interface WorkerEnv {
  ASSETS: { fetch(request: Request): Promise<Response> };
  UPLOADS: {
    put(key: string, value: ReadableStream | ArrayBuffer | Blob, options?: Record<string, unknown>): Promise<unknown>;
    get(key: string): Promise<any>;
  };
}

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_FILE_SIZE_MB = 25;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function getUploaderId(request: Request): string | null {
  const authorization = request.headers.get('Authorization') || '';
  const match = authorization.match(/^Bearer\s+fc_token_(.+)_\d+$/);
  if (!match) return null;
  return match[1].replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80) || null;
}

function safeSegment(value: string, fallback: string, maxLength = 100): string {
  return value
    .normalize('NFKC')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^\.+/, '')
    .slice(0, maxLength) || fallback;
}

function contentDisposition(fileName: string, contentType: string): string {
  const safeName = encodeURIComponent(fileName).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  );
  const canDisplayInline =
    /^image\/(jpeg|png|gif|webp|avif|bmp)$/i.test(contentType) ||
    /^(audio|video)\//i.test(contentType) ||
    contentType === 'application/pdf';
  return `${canDisplayInline ? 'inline' : 'attachment'}; filename*=UTF-8''${safeName}`;
}

async function upload(request: Request, env: WorkerEnv): Promise<Response> {
  const uploaderId = getUploaderId(request);
  if (!uploaderId) return json({ error: 'Sign in to upload workspace files.' }, 401);

  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (contentLength > MAX_FILE_SIZE + 1024 * 1024) {
    return json({ error: `Files must be ${MAX_FILE_SIZE_MB} MB or smaller.` }, 413);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ error: 'Upload must use multipart form data.' }, 400);
  }

  const fileValue = formData.get('file');
  if (!(fileValue instanceof File) || fileValue.size === 0) {
    return json({ error: 'Choose a non-empty file to upload.' }, 400);
  }
  if (fileValue.size > MAX_FILE_SIZE) {
    return json({ error: `Files must be ${MAX_FILE_SIZE_MB} MB or smaller.` }, 413);
  }

  const folder = safeSegment(String(formData.get('folder') || 'uploads'), 'uploads', 60);
  const originalName = fileValue.name || `file_${Date.now()}`;
  const storedName = safeSegment(originalName, `file_${Date.now()}`, 180);
  const contentType = fileValue.type || 'application/octet-stream';
  const date = new Date().toISOString().slice(0, 10);
  const key = `${folder}/${uploaderId}/${date}/${crypto.randomUUID()}_${storedName}`;

  await env.UPLOADS.put(key, fileValue, {
    httpMetadata: {
      contentType,
      contentDisposition: contentDisposition(originalName, contentType),
      cacheControl: 'private, max-age=3600',
    },
    customMetadata: {
      originalName: originalName.slice(0, 500),
      uploaderId,
      uploadedAt: new Date().toISOString(),
    },
  });

  const requestUrl = new URL(request.url);
  const fileUrl = new URL('/api/storage/files', requestUrl.origin);
  fileUrl.searchParams.set('key', key);

  return json({
    url: fileUrl.toString(),
    key,
    name: originalName,
    size: fileValue.size,
    type: contentType,
    provider: 'cloudflare_r2',
  }, 201);
}

async function download(request: Request, env: WorkerEnv): Promise<Response> {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  if (!key || key.length > 700 || key.includes('..')) {
    return json({ error: 'Invalid file key.' }, 400);
  }

  const object = await env.UPLOADS.get(key);
  if (!object) return json({ error: 'File not found.' }, 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('ETag', object.httpEtag);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Content-Security-Policy', "sandbox; default-src 'none'");
  headers.set('Referrer-Policy', 'no-referrer');
  if (!headers.has('Cache-Control')) headers.set('Cache-Control', 'private, max-age=3600');

  return new Response(request.method === 'HEAD' ? null : object.body, { headers });
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/storage/status' && request.method === 'GET') {
      return json({ configured: true, maxFileSizeMb: MAX_FILE_SIZE_MB, provider: 'cloudflare_r2' });
    }
    if (url.pathname === '/api/storage/upload' && request.method === 'POST') {
      return upload(request, env);
    }
    if (url.pathname === '/api/storage/files' && (request.method === 'GET' || request.method === 'HEAD')) {
      return download(request, env);
    }
    if (url.pathname.startsWith('/api/storage/')) {
      return json({ error: 'Storage route not found.' }, 404);
    }

    return env.ASSETS.fetch(request);
  },
};
