CREATE TABLE tracks (
                        id UUID PRIMARY KEY,
                        title TEXT NOT NULL,
                        artist TEXT NOT NULL,
                        album TEXT,
                        duration INT NOT NULL,
                        cover_media_id UUID,
                        audio_media_id UUID NOT NULL,
                        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
-- Индекс для поиска (простой B-tree для начала, потом можно GIN для full-text)
CREATE INDEX idx_tracks_search ON tracks (title, artist);