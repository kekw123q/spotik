CREATE TABLE media_files (
                             id UUID PRIMARY KEY,
                             filename TEXT NOT NULL,
                             bucket_name TEXT NOT NULL,
                             object_key TEXT NOT NULL,
                             content_type TEXT NOT NULL,
                             size_bytes BIGINT NOT NULL,
                             created_at TIMESTAMP NOT NULL DEFAULT NOW()
);