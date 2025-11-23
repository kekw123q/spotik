package media

import (
	"context"
	"fmt"
	"time"

	"github.com/dkoshenkov/spotik-backend/internal/domain"
	"github.com/dkoshenkov/spotik-backend/pkg/postgres"
	"github.com/google/uuid"
)

type Repository struct {
	client *postgres.Client
}

func NewRepository(client *postgres.Client) *Repository {
	return &Repository{client: client}
}

func (r *Repository) Save(ctx context.Context, m *domain.MediaFile) error {
	q := `
		INSERT INTO media_files (id, filename, bucket_name, object_key, content_type, size_bytes, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	if m.CreatedAt.IsZero() {
		m.CreatedAt = time.Now()
	}

	_, err := r.client.Pool.Exec(ctx, q,
		m.ID,
		m.Filename,
		m.BucketName,
		m.ObjectKey,
		m.ContentType,
		m.SizeBytes,
		m.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("media repo: save failed: %w", err)
	}
	return nil
}

func (r *Repository) Get(ctx context.Context, id uuid.UUID) (*domain.MediaFile, error) {
	q := `
		SELECT id, filename, bucket_name, object_key, content_type, size_bytes, created_at
		FROM media_files
		WHERE id = $1
	`
	var m domain.MediaFile
	err := r.client.Pool.QueryRow(ctx, q, id).Scan(
		&m.ID,
		&m.Filename,
		&m.BucketName,
		&m.ObjectKey,
		&m.ContentType,
		&m.SizeBytes,
		&m.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("media repo: get failed: %w", err)
	}
	return &m, nil
}
