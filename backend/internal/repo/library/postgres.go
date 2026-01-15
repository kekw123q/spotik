package library

import (
	"context"
	"fmt"

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

func (r *Repository) GetUserPlaylists(ctx context.Context, userID uuid.UUID) ([]domain.Playlist, error) {
	q := `
		SELECT id, name, description, cover_url, owner_id, is_user_playlist, is_public, created_at, updated_at
		FROM playlists
		WHERE owner_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.client.Pool.Query(ctx, q, userID)
	if err != nil {
		return nil, fmt.Errorf("repo: failed to get user playlists: %w", err)
	}
	defer rows.Close()

	var playlists []domain.Playlist
	for rows.Next() {
		var p domain.Playlist
		var desc, cover *string
		err := rows.Scan(
			&p.ID, &p.Name, &desc, &cover, &p.OwnerID, &p.IsUserPlaylist, &p.IsPublic, &p.CreatedAt, &p.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("repo: scan failed: %w", err)
		}
		if desc != nil {
			p.Description = *desc
		}
		if cover != nil {
			p.CoverURL = *cover
		}
		playlists = append(playlists, p)
	}
	return playlists, nil
}

func (r *Repository) GetAuthorPlaylists(ctx context.Context) ([]domain.Playlist, error) {
	q := `
		SELECT id, name, description, cover_url, owner_id, is_user_playlist, is_public, created_at, updated_at
		FROM playlists
		WHERE is_user_playlist = false
		LIMIT 20
	`
	rows, err := r.client.Pool.Query(ctx, q)
	if err != nil {
		return nil, fmt.Errorf("repo: failed to get author playlists: %w", err)
	}
	defer rows.Close()

	var playlists []domain.Playlist
	for rows.Next() {
		var p domain.Playlist
		var desc, cover *string
		err := rows.Scan(
			&p.ID, &p.Name, &desc, &cover, &p.OwnerID, &p.IsUserPlaylist, &p.IsPublic, &p.CreatedAt, &p.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("repo: scan failed: %w", err)
		}
		if desc != nil {
			p.Description = *desc
		}
		if cover != nil {
			p.CoverURL = *cover
		}
		playlists = append(playlists, p)
	}
	return playlists, nil
}

func (r *Repository) GetPlaylist(ctx context.Context, id uuid.UUID) (*domain.Playlist, error) {
	qMeta := `
		SELECT id, name, description, cover_url, owner_id, is_user_playlist, is_public, created_at, updated_at
		FROM playlists
		WHERE id = $1
	`
	var p domain.Playlist
	var desc, cover *string
	err := r.client.Pool.QueryRow(ctx, qMeta, id).Scan(
		&p.ID, &p.Name, &desc, &cover, &p.OwnerID, &p.IsUserPlaylist, &p.IsPublic, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, domain.ErrPlaylistNotFound
		}
		return nil, fmt.Errorf("repo: failed to get playlist meta: %w", err)
	}
	if desc != nil {
		p.Description = *desc
	}
	if cover != nil {
		p.CoverURL = *cover
	}

	qTracks := `
		SELECT track_id, position, added_at
		FROM playlist_tracks
		WHERE playlist_id = $1
		ORDER BY position ASC
	`
	rows, err := r.client.Pool.Query(ctx, qTracks, id)
	if err != nil {
		return nil, fmt.Errorf("repo: failed to get playlist tracks: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var t domain.PlaylistTrack
		if err := rows.Scan(&t.TrackID, &t.Position, &t.AddedAt); err != nil {
			return nil, err
		}
		p.Tracks = append(p.Tracks, t)
	}

	return &p, nil
}

func (r *Repository) CreateDemoPlaylist(ctx context.Context, p *domain.Playlist) error {
	q := `INSERT INTO playlists (id, name, description, owner_id, is_user_playlist, is_public) VALUES ($1, $2, $3, $4, $5, $6)`
	_, err := r.client.Pool.Exec(ctx, q, p.ID, p.Name, p.Description, p.OwnerID, p.IsUserPlaylist, p.IsPublic)
	return err
}
