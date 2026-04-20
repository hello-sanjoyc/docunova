import { FastifyInstance } from 'fastify';
import {
  upload,
  list,
  listTrash,
  getOne,
  update,
  remove,
  restore,
  download,
  preview,
  presignedUrl,
  summaryPdf,
} from '../controllers/document.controller';
import { authenticate } from '../middlewares/authenticate';
import { validateDocumentUpload } from '../middlewares/validateDocumentUpload';
import {
  listDocumentsSchema,
  updateDocumentSchema,
  documentIdParamSchema,
} from '../models/document.model';

export default async function documentRoutes(fastify: FastifyInstance) {
  // Public summary PDF link for sharing
  fastify.get('/summary/:id', { schema: documentIdParamSchema, handler: summaryPdf });

  // POST /documents — multipart file upload (validated before S3 + DB write)
  fastify.post('/', { preHandler: [authenticate, validateDocumentUpload], handler: upload });

  // GET /documents — list with pagination & filters
  fastify.get('/', { preHandler: authenticate, schema: listDocumentsSchema, handler: list });

  // GET /documents/trash — list soft-deleted documents
  fastify.get('/trash', { preHandler: authenticate, schema: listDocumentsSchema, handler: listTrash });

  // GET /documents/:id — get document details
  fastify.get('/:id', { preHandler: authenticate, schema: documentIdParamSchema, handler: getOne });

  // PATCH /documents/:id — update metadata
  fastify.patch('/:id', { preHandler: authenticate, schema: updateDocumentSchema, handler: update });

  // DELETE /documents/:id — soft-delete document
  fastify.delete('/:id', { preHandler: authenticate, schema: documentIdParamSchema, handler: remove });

  // POST /documents/:id/restore — restore from trash
  fastify.post('/:id/restore', { preHandler: authenticate, schema: documentIdParamSchema, handler: restore });

  // GET /documents/:id/download — download the original file
  fastify.get('/:id/download', { preHandler: authenticate, schema: documentIdParamSchema, handler: download });

  // GET /documents/:id/preview — inline preview / thumbnail
  fastify.get('/:id/preview', { preHandler: authenticate, schema: documentIdParamSchema, handler: preview });

  // GET /documents/:id/presigned — short-lived direct S3 download URL
  fastify.get('/:id/presigned', { preHandler: authenticate, schema: documentIdParamSchema, handler: presignedUrl });
}
