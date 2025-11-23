package catalog

import (
	"context"
	"fmt"

	"github.com/dkoshenkov/spotik-backend/internal/domain"
	"github.com/google/uuid"
)

// Добавляем GetTrack в интерфейс зависимостей
type repository interface {
	CreateTrack(ctx context.Context, track *domain.Track) error
	SearchTracks(ctx context.Context, query string) ([]domain.Track, error)
	GetTrack(ctx context.Context, id uuid.UUID) (*domain.Track, error) // Новый метод
}

type Usecase struct {
	repo repository
}

func New(repo repository) *Usecase {
	return &Usecase{
		repo: repo,
	}
}

func (uc *Usecase) Search(ctx context.Context, query string) ([]domain.Track, error) {
	if query == "" {
		return []domain.Track{}, nil
	}
	return uc.repo.SearchTracks(ctx, query)
}

func (uc *Usecase) CreateTrack(ctx context.Context, title, artist string, duration int, mediaID, coverMediaID uuid.UUID) (*domain.Track, error) {
	track := &domain.Track{
		ID:           uuid.New(),
		Title:        title,
		Artist:       artist,
		Duration:     duration,
		AudioMediaID: mediaID,
		CoverMediaID: coverMediaID,
	}

	if err := uc.repo.CreateTrack(ctx, track); err != nil {
		return nil, fmt.Errorf("usecase: failed to create track: %w", err)
	}

	return track, nil
}

// Реализация получения трека
func (uc *Usecase) GetTrack(ctx context.Context, id uuid.UUID) (*domain.Track, error) {
	track, err := uc.repo.GetTrack(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("usecase: failed to get track: %w", err)
	}
	return track, nil
}
