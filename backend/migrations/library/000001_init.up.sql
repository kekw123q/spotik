CREATE TABLE playlists (
                           id UUID PRIMARY KEY,
                           name TEXT NOT NULL,
                           description TEXT,
                           cover_url TEXT,
                           owner_id UUID NOT NULL,
                           is_user_playlist BOOLEAN NOT NULL DEFAULT TRUE,
                           is_public BOOLEAN NOT NULL DEFAULT FALSE,
                           created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                           updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE playlist_tracks (
                                 playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
                                 track_id UUID NOT NULL,
                                 position INT NOT NULL,
                                 added_at TIMESTAMP NOT NULL DEFAULT NOW(),
                                 PRIMARY KEY (playlist_id, track_id)
);