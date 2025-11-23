package domain

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
)

var (
	ErrTrackNotFound = errors.New("track not found")
)

type Track struct {
	ID           uuid.UUID
	Title        string
	Artist       string
	Album        *string // Pointer для nullable полей
	Duration     int     // Seconds
	CoverMediaID uuid.UUID
	AudioMediaID uuid.UUID
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

type CatalogRepository interface {
	CreateTrack(ctx context.Context, track *Track) error
	GetTrack(ctx context.Context, id uuid.UUID) (*Track, error)
	SearchTracks(ctx context.Context, query string) ([]Track, error)
}
