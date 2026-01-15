package history

import (
	"context"

	"github.com/google/uuid"
	"github.com/kekw123q/spotik-backend/internal/domain"
)

type Usecase struct {
	repo domain.HistoryRepository
}

func New(repo domain.HistoryRepository) *Usecase {
	return &Usecase{repo: repo}
}

func (uc *Usecase) GetLastState(ctx context.Context, userID uuid.UUID) (*domain.PlayerState, error) {
	return uc.repo.GetLastState(ctx, userID)
}

func (uc *Usecase) GetHistory(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.HistoryEntry, error) {
	return uc.repo.GetHistory(ctx, userID, limit, offset)
}

func (uc *Usecase) ReportState(ctx context.Context, userID uuid.UUID, trackID uuid.UUID, contextID *uuid.UUID, ctxType string, ts int, status string) error {
	state := &domain.PlayerState{
		UserID:      userID,
		TrackID:     trackID,
		ContextID:   contextID,
		ContextType: ctxType,
		TimestampMs: ts,
		Status:      status,
	}
	if err := uc.repo.UpsertState(ctx, state); err != nil {
		return err
	}

	// 2. Логика сохранения в историю (Scrobbling)
	// В реальности здесь должна быть проверка: "слушал ли пользователь этот трек достаточно долго?"
	// Для теста просто сохраняем каждый "stopped" или конец трека
	if status == "stopped" || ts > 30 { // Пример условия
		entry := &domain.HistoryEntry{
			UserID:         userID,
			TrackID:        trackID,
			DurationPlayed: ts,
		}
		_ = uc.repo.AddHistoryEntry(ctx, entry)
	}

	return nil
}
