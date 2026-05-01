import crypto from 'crypto';
import { FastifyReply, FastifyRequest } from 'fastify';
import env from '../config/env';
import { createLogger } from '../config/logger';

export interface ValidatedAvatarUpload {
  buffer: Buffer;
  mimeType: string;
  fileSizeBytes: number;
  checksumSha256: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    avatarUpload?: ValidatedAvatarUpload;
  }
}

const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_AVATAR_BYTES = 10 * 1024 * 1024; // 10 MB

function reject(reply: FastifyReply, statusCode: number, message: string) {
  return reply.status(statusCode).send({ statusCode, success: false, message });
}

function detectImageKindByMagicBytes(buffer: Buffer): 'jpeg' | 'png' | 'webp' | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'png';
  }

  // WEBP: RIFF....WEBP
  const riff = buffer.slice(0, 4).toString('ascii');
  const webp = buffer.slice(8, 12).toString('ascii');
  if (riff === 'RIFF' && webp === 'WEBP') {
    return 'webp';
  }

  return null;
}

export async function validateAvatarUpload(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const logger = createLogger({
    context: 'avatar-upload-validator',
    requestId: request.id,
    userId: request.user?.userId,
  });

  const parts = request.parts();
  let fileMime = '';
  const chunks: Buffer[] = [];
  let fileSeen = false;

  for await (const part of parts) {
    if (part.type === 'file') {
      if (fileSeen) {
        for await (const _ of part.file) {
          // drain
        }
        continue;
      }

      fileSeen = true;
      fileMime = part.mimetype || '';

      for await (const chunk of part.file) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }

      continue;
    }

    // Ignore text fields for avatar upload.
  }

  if (!fileSeen) {
    return reject(reply, 400, 'No avatar image uploaded');
  }

  const buffer = Buffer.concat(chunks);
  if (buffer.length === 0) {
    return reject(reply, 400, 'Uploaded avatar image is empty');
  }

  if (buffer.length > Math.min(env.MAX_FILE_SIZE, MAX_AVATAR_BYTES)) {
    return reject(reply, 413, 'Avatar image exceeds allowed size (10 MB)');
  }

  if (!ALLOWED_MIMES.has(fileMime)) {
    logger.warn('Avatar upload rejected: MIME type not allowed', { fileMime });
    return reject(reply, 415, 'Only JPEG, PNG, and WEBP images are allowed');
  }

  const detected = detectImageKindByMagicBytes(buffer);
  if (!detected) {
    return reject(reply, 415, 'File content is not a valid image');
  }

  const checksumSha256 = crypto
    .createHash('sha256')
    .update(buffer)
    .digest('hex');

  request.avatarUpload = {
    buffer,
    mimeType: fileMime,
    fileSizeBytes: buffer.length,
    checksumSha256,
  };
}
