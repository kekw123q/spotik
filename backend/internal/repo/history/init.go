package history

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/kekw123q/spotik-backend/internal/domain"
	"github.com/kekw123q/spotik-backend/pkg/postgres"
)

type Repository struct {
	client *postgres.Client
}

func NewRepository(client *postgres.Client) *Repository {
	return &Repository{client: client}
}

func (r *Repository) UpsertState(ctx context.Context, s *domain.PlayerState) error {
	q := `
		INSERT INTO player_states (user_id, track_id, context_id, context_type, timestamp_ms, status, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (user_id) DO UPDATE SET
			track_id = EXCLUDED.track_id,
			context_id = EXCLUDED.context_id,
			context_type = EXCLUDED.context_type,
			timestamp_ms = EXCLUDED.timestamp_ms,
			status = EXCLUDED.status,
			updated_at = EXCLUDED.updated_at
	`
	s.UpdatedAt = time.Now()
	_, err := r.client.Pool.Exec(ctx, q,
		s.UserID, s.TrackID, s.ContextID, s.ContextType, s.TimestampMs, s.Status, s.UpdatedAt,
	)
	return err
}

func (r *Repository) GetLastState(ctx context.Context, userID uuid.UUID) (*domain.PlayerState, error) {
	q := `
		SELECT track_id, context_id, context_type, timestamp_ms, status, updated_at
		FROM player_states
		WHERE user_id = $1
	`
	var s domain.PlayerState
	s.UserID = userID
	err := r.client.Pool.QueryRow(ctx, q, userID).Scan(
		&s.TrackID, &s.ContextID, &s.ContextType, &s.TimestampMs, &s.Status, &s.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, domain.ErrStateNotFound
		}
		return nil, fmt.Errorf("repo history: get state: %w", err)
	}
	return &s, nil
}

func (r *Repository) AddHistoryEntry(ctx context.Context, entry *domain.HistoryEntry) error {
	q := `
		INSERT INTO history_log (id, user_id, track_id, played_at, duration_played_sec)
		VALUES ($1, $2, $3, $4, $5)
	`
	if entry.ID == uuid.Nil {
		entry.ID = uuid.New()
	}
	entry.PlayedAt = time.Now()
	_, err := r.client.Pool.Exec(ctx, q,
		entry.ID, entry.UserID, entry.TrackID, entry.PlayedAt, entry.DurationPlayed,
	)
	return err
}

func (r *Repository) GetHistory(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.HistoryEntry, error) {
	q := `
		SELECT id, track_id, played_at, duration_played_sec
		FROM history_log
		WHERE user_id = $1
		ORDER BY played_at DESC
		LIMIT $2 OFFSET $3
	`
	rows, err := r.client.Pool.Query(ctx, q, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []domain.HistoryEntry
	for rows.Next() {
		var h domain.HistoryEntry
		h.UserID = userID
		if err := rows.Scan(&h.ID, &h.TrackID, &h.PlayedAt, &h.DurationPlayed); err != nil {
			return nil, err
		}
		result = append(result, h)
	}
	return result, nil
}
