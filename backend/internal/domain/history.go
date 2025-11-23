package domain

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
)

var (
	ErrStateNotFound = errors.New("player state not found")
)

type PlayerState struct {
	UserID      uuid.UUID
	TrackID     uuid.UUID
	ContextID   *uuid.UUID
	ContextType string
	TimestampMs int
	Status      string
	UpdatedAt   time.Time
}

type HistoryEntry struct {
	ID             uuid.UUID
	UserID         uuid.UUID
	TrackID        uuid.UUID
	PlayedAt       time.Time
	DurationPlayed int
}

type HistoryRepository interface {
	UpsertState(ctx context.Context, state *PlayerState) error
	GetLastState(ctx context.Context, userID uuid.UUID) (*PlayerState, error)
	AddHistoryEntry(ctx context.Context, entry *HistoryEntry) error
	GetHistory(ctx context.Context, userID uuid.UUID, limit, offset int) ([]HistoryEntry, error)
}
