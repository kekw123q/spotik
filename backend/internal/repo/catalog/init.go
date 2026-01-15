package catalog

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"

	"github.com/google/uuid"
	"github.com/kekw123q/spotik-backend/internal/domain"
	"github.com/kekw123q/spotik-backend/pkg/postgres"
)

type Repository struct {
	client *postgres.Client
}

func NewRepository(client *postgres.Client) *Repository {
	return &Repository{client: client}
}

func (r *Repository) CreateTrack(ctx context.Context, track *domain.Track) error {
	q := `
		INSERT INTO tracks (id, title, artist, album, duration, cover_media_id, audio_media_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`
	// Если ID не задан доменной логикой, можно генерировать здесь, но лучше в UseCase
	if track.ID == uuid.Nil {
		track.ID = uuid.New()
	}
	now := time.Now()
	track.CreatedAt = now
	track.UpdatedAt = now

	_, err := r.client.Pool.Exec(ctx, q,
		track.ID,
		track.Title,
		track.Artist,
		track.Album,
		track.Duration,
		track.CoverMediaID,
		track.AudioMediaID,
		track.CreatedAt,
		track.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("repo: failed to create track: %w", err)
	}
	return nil
}

func (r *Repository) SearchTracks(ctx context.Context, query string) ([]domain.Track, error) {
	q := `
		SELECT id, title, artist, album, duration, cover_media_id, audio_media_id
		FROM tracks
		WHERE title ILIKE '%' || $1 || '%' OR artist ILIKE '%' || $1 || '%'
		LIMIT 50
	`
	rows, err := r.client.Pool.Query(ctx, q, query)
	if err != nil {
		return nil, fmt.Errorf("repo: failed to search tracks: %w", err)
	}
	defer rows.Close()

	var tracks []domain.Track
	for rows.Next() {
		var t domain.Track
		err := rows.Scan(
			&t.ID,
			&t.Title,
			&t.Artist,
			&t.Album,
			&t.Duration,
			&t.CoverMediaID,
			&t.AudioMediaID,
		)
		if err != nil {
			return nil, fmt.Errorf("repo: failed to scan track: %w", err)
		}
		tracks = append(tracks, t)
	}
	return tracks, nil
}

func (r *Repository) GetTrack(ctx context.Context, id uuid.UUID) (*domain.Track, error) {
	q := `
		SELECT id, title, artist, album, duration, cover_media_id, audio_media_id, created_at, updated_at
		FROM tracks
		WHERE id = $1
	`
	var t domain.Track
	err := r.client.Pool.QueryRow(ctx, q, id).Scan(
		&t.ID,
		&t.Title,
		&t.Artist,
		&t.Album,
		&t.Duration,
		&t.CoverMediaID,
		&t.AudioMediaID,
		&t.CreatedAt,
		&t.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, domain.ErrTrackNotFound
		}
		return nil, fmt.Errorf("repo: failed to get track: %w", err)
	}
	return &t, nil
}
