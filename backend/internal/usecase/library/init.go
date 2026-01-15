package library

import (
	"context"

	"github.com/google/uuid"
	"github.com/kekw123q/spotik-backend/internal/domain"
)

type repository interface {
	GetUserPlaylists(ctx context.Context, userID uuid.UUID) ([]domain.Playlist, error)
	GetAuthorPlaylists(ctx context.Context) ([]domain.Playlist, error)
	GetPlaylist(ctx context.Context, id uuid.UUID) (*domain.Playlist, error)
	CreateDemoPlaylist(ctx context.Context, p *domain.Playlist) error
}

type Usecase struct {
	repo repository
}

func New(repo repository) *Usecase {
	return &Usecase{repo: repo}
}

func (uc *Usecase) GetUserPlaylists(ctx context.Context, userID uuid.UUID) ([]domain.Playlist, error) {
	return uc.repo.GetUserPlaylists(ctx, userID)
}

func (uc *Usecase) GetAuthorPlaylists(ctx context.Context) ([]domain.Playlist, error) {
	return uc.repo.GetAuthorPlaylists(ctx)
}

func (uc *Usecase) GetPlaylist(ctx context.Context, id uuid.UUID) (*domain.Playlist, error) {
	return uc.repo.GetPlaylist(ctx, id)
}

// InitDemoData создает стартовые плейлисты, если их нет
func (uc *Usecase) InitDemoData(ctx context.Context) {
	demoUserID := uuid.MustParse("00000000-0000-0000-0000-000000000001")
	playlists, _ := uc.repo.GetUserPlaylists(ctx, demoUserID)
	if len(playlists) == 0 {
		_ = uc.repo.CreateDemoPlaylist(ctx, &domain.Playlist{
			ID:             uuid.New(),
			Name:           "Favorites",
			Description:    "My top tracks",
			OwnerID:        demoUserID,
			IsUserPlaylist: true,
			IsPublic:       false,
		})
	}
}
