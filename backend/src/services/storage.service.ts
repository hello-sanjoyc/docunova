import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import crypto from 'crypto';
import env from '../config/env';
import { createLogger } from '../config/logger';

// ── S3 client (compatible with any S3-like endpoint) ─────────────────────────

// S3-compatible endpoints often have non-standard region strings (hostnames, etc.).
// The AWS SDK requires a valid region identifier, so we fall back to "us-east-1" when
// the configured value contains a dot (i.e. looks like a hostname, not a region code).
const s3Region = env.S3_REGION.includes('.') ? 'us-east-1' : env.S3_REGION;

const s3 = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: s3Region,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true, // required for non-AWS S3-compatible endpoints
});
const logger = createLogger({ context: 'storage-service' });

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildObjectKey(relativePath: string): string {
  // Normalise: strip leading slash, prefix with DOCUMENT_STORAGE_PATH
  const clean = relativePath.replace(/^\/+/, '');
  return `${env.DOCUMENT_STORAGE_PATH}/${clean}`;
}

// ── Upload ────────────────────────────────────────────────────────────────────

export interface UploadResult {
  storageKey: string;   // key stored in DB (relative, without bucket prefix)
  checksumSha256: string;
  fileSizeBytes: number;
  etag?: string;
  buffer: Buffer;       // the buffered file content — reuse for post-processing (e.g. PDF parsing)
}

/**
 * Stream a readable into S3.
 * Returns the storage key, SHA-256 checksum, and byte count.
 */
export async function uploadToStorage(
  fileStream: Readable,
  relativePath: string,
  mimeType: string,
): Promise<UploadResult> {
  const objectKey = buildObjectKey(relativePath);
  const startedAt = Date.now();
  logger.info('Storage upload started', { objectKey, mimeType });

  // Buffer the stream so we can compute checksum and get content-length
  const chunks: Buffer[] = [];
  for await (const chunk of fileStream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const body = Buffer.concat(chunks);
  const fileSizeBytes = body.length;
  const checksumSha256 = crypto.createHash('sha256').update(body).digest('hex');

  const cmd = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: objectKey,
    Body: body,
    ContentType: mimeType,
    ContentLength: fileSizeBytes,
    Metadata: {
      checksumSha256,
    },
  });

  const result = await s3.send(cmd);
  logger.info('Storage upload completed', {
    objectKey,
    fileSizeBytes,
    durationMs: Date.now() - startedAt,
    etag: result.ETag,
  });

  return {
    storageKey: objectKey,
    checksumSha256,
    fileSizeBytes,
    etag: result.ETag,
    buffer: body,
  };
}

// ── Download (stream) ─────────────────────────────────────────────────────────

/**
 * Returns a readable stream for the object identified by storageKey (as stored in DB).
 * storageKey may already be the full object key or a relative path — this is
 * handled transparently by normalisation.
 */
export async function downloadFromStorage(storageKey: string): Promise<{
  stream: Readable;
  contentLength?: number;
  contentType?: string;
}> {
  // storageKey stored in DB already includes the DOCUMENT_STORAGE_PATH prefix
  // so we use it directly; only build the full key if it looks like a raw path.
  const objectKey = storageKey.startsWith(env.DOCUMENT_STORAGE_PATH)
    ? storageKey
    : buildObjectKey(storageKey);
  logger.info('Storage download requested', { storageKey, objectKey });

  const cmd = new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: objectKey,
  });

  const response = await s3.send(cmd);

  if (!response.Body) {
    throw Object.assign(new Error('File not found in storage'), { statusCode: 404 });
  }

  return {
    stream: response.Body as Readable,
    contentLength: response.ContentLength,
    contentType: response.ContentType,
  };
}

// ── Read (full buffer) ────────────────────────────────────────────────────────

/**
 * Fetches the full file content into a Buffer.
 * Useful for small files or further processing (e.g. thumbnail generation).
 */
export async function readFromStorage(storageKey: string): Promise<Buffer> {
  const startedAt = Date.now();
  const { stream } = await downloadFromStorage(storageKey);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const buffer = Buffer.concat(chunks);
  logger.info('Storage full read completed', {
    storageKey,
    bytes: buffer.length,
    durationMs: Date.now() - startedAt,
  });
  return buffer;
}

// ── Presigned URL (temporary read access) ────────────────────────────────────

/**
 * Generates a time-limited presigned URL so clients can download directly
 * without proxying through the API server.
 */
export async function getPresignedDownloadUrl(
  storageKey: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const objectKey = storageKey.startsWith(env.DOCUMENT_STORAGE_PATH)
    ? storageKey
    : buildObjectKey(storageKey);

  const cmd = new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: objectKey,
  });

  const url = await getSignedUrl(s3, cmd, { expiresIn: expiresInSeconds });
  logger.info('Presigned download URL generated', {
    storageKey,
    objectKey,
    expiresInSeconds,
  });
  return url;
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteFromStorage(storageKey: string): Promise<void> {
  const objectKey = storageKey.startsWith(env.DOCUMENT_STORAGE_PATH)
    ? storageKey
    : buildObjectKey(storageKey);
  logger.info('Storage delete requested', { storageKey, objectKey });

  await s3.send(
    new DeleteObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: objectKey,
    }),
  );
  logger.info('Storage delete completed', { storageKey, objectKey });
}

// ── Existence check ───────────────────────────────────────────────────────────

export async function objectExists(storageKey: string): Promise<boolean> {
  const objectKey = storageKey.startsWith(env.DOCUMENT_STORAGE_PATH)
    ? storageKey
    : buildObjectKey(storageKey);

  try {
    await s3.send(new HeadObjectCommand({ Bucket: env.S3_BUCKET, Key: objectKey }));
    logger.info('Storage existence check passed', { storageKey, objectKey });
    return true;
  } catch {
    logger.warn('Storage existence check failed', { storageKey, objectKey });
    return false;
  }
}
