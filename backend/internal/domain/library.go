package domain

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
)

var (
	ErrPlaylistNotFound = errors.New("playlist not found")
)

type Playlist struct {
	ID             uuid.UUID
	Name           string
	Description    string
	CoverURL       string
	OwnerID        uuid.UUID
	IsUserPlaylist bool
	IsPublic       bool
	CreatedAt      time.Time
	UpdatedAt      time.Time
	Tracks         []PlaylistTrack
}

type PlaylistTrack struct {
	TrackID  uuid.UUID
	Position int
	AddedAt  time.Time
}

type LibraryRepository interface {
	GetUserPlaylists(ctx context.Context, userID uuid.UUID) ([]Playlist, error)
	GetAuthorPlaylists(ctx context.Context) ([]Playlist, error)
	GetPlaylist(ctx context.Context, id uuid.UUID) (*Playlist, error)
	CreateDemoPlaylist(ctx context.Context, p *Playlist) error
}
