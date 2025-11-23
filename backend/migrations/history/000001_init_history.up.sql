-- Таблица для хранения текущего состояния плеера (последний трек, позиция)
-- Primary Key = user_id, так как у одного юзера только одно состояние "сейчас"
CREATE TABLE player_states (
                               user_id UUID PRIMARY KEY,
                               track_id UUID NOT NULL,
                               context_id UUID,              -- ID альбома или плейлиста
                               context_type VARCHAR(50),     -- 'album', 'playlist', 'search'
                               timestamp_ms INT NOT NULL DEFAULT 0,
                               status VARCHAR(20) NOT NULL,  -- 'playing', 'paused', 'stopped'
                               updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Лог прослушиваний (история)
CREATE TABLE history_log (
                             id UUID PRIMARY KEY,
                             user_id UUID NOT NULL,
                             track_id UUID NOT NULL,
                             played_at TIMESTAMP NOT NULL DEFAULT NOW(),
                             duration_played_sec INT NOT NULL -- сколько секунд реально слушал
);

-- Индекс для быстрого получения истории пользователя
CREATE INDEX idx_history_user_date ON history_log(user_id, played_at DESC);