-- Run this against your database to add the document chunking and chat tables.
-- Alternatively: cd backend && npx prisma db push

CREATE TABLE IF NOT EXISTS document_chunks (
    id           BIGSERIAL PRIMARY KEY,
    document_id  BIGINT       NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index  INTEGER      NOT NULL,
    content      TEXT         NOT NULL,
    page_number  INTEGER,
    start_char   INTEGER      NOT NULL,
    end_char     INTEGER      NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_chunks_doc_index ON document_chunks (document_id, chunk_index);

CREATE TABLE IF NOT EXISTS document_chat_messages (
    id          BIGSERIAL PRIMARY KEY,
    uuid        UUID         NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    document_id BIGINT       NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id     BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role        VARCHAR(20)  NOT NULL,
    content     TEXT         NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_doc_user
    ON document_chat_messages (document_id, user_id, created_at DESC);
