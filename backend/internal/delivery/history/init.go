package history

import (
	"context"
	"errors"

	"github.com/dkoshenkov/spotik-backend/internal/domain"
	openapi "github.com/dkoshenkov/spotik-backend/internal/gen/openapi/history"
	usecase "github.com/dkoshenkov/spotik-backend/internal/usecase/history"
	"github.com/google/uuid"
)

type Handler struct {
	uc *usecase.Usecase
}

func NewHandler(uc *usecase.Usecase) *Handler {
	return &Handler{uc: uc}
}

// Demo User ID
var demoUserID = uuid.MustParse("00000000-0000-0000-0000-000000000001")

func (h *Handler) ReportState(ctx context.Context, req *openapi.ReportStateRequest) error {
	trackID, err := uuid.Parse(req.TrackId)
	if err != nil {
		return err
	}

	var contextID *uuid.UUID
	if req.ContextId.IsSet() {
		if id, err := uuid.Parse(req.ContextId.Value); err == nil {
			contextID = &id
		}
	}

	contextType := ""
	if req.ContextType.IsSet() {
		contextType = req.ContextType.Value
	}

	return h.uc.ReportState(ctx, demoUserID, trackID, contextID, contextType, req.Timestamp, string(req.Status))
}

func (h *Handler) GetLastState(ctx context.Context) (openapi.GetLastStateRes, error) {
	state, err := h.uc.GetLastState(ctx, demoUserID)
	if err != nil {
		if errors.Is(err, domain.ErrStateNotFound) {
			return &openapi.GetLastStateNoContent{}, nil
		}
		return nil, err // 500
	}

	var ctxID openapi.OptNilUUID
	if state.ContextID != nil {
		ctxID.SetTo(*state.ContextID)
	} else {
		ctxID.SetToNull()
	}

	// Mapping string to enum
	var cType openapi.OptPlayerStateContextType
	if state.ContextType != "" {
		// В продакшене нужна валидация, что строка соответствует enum
		val := openapi.PlayerStateContextType(state.ContextType)
		cType = openapi.NewOptPlayerStateContextType(val)
	}

	return &openapi.PlayerState{
		TrackId:     state.TrackID,
		ContextId:   ctxID,
		ContextType: cType,
		Timestamp:   state.TimestampMs,
		UpdatedAt:   openapi.NewOptDateTime(state.UpdatedAt),
	}, nil
}

func (h *Handler) GetHistory(ctx context.Context, params openapi.GetHistoryParams) ([]openapi.HistoryEntry, error) {
	limit := params.Limit.Or(20)
	offset := params.Offset.Or(0)

	entries, err := h.uc.GetHistory(ctx, demoUserID, limit, offset)
	if err != nil {
		return nil, err
	}

	resp := make([]openapi.HistoryEntry, len(entries))
	for i, e := range entries {
		resp[i] = openapi.HistoryEntry{
			TrackId:        openapi.NewOptString(e.TrackID.String()),
			PlayedAt:       openapi.NewOptDateTime(e.PlayedAt),
			DurationPlayed: openapi.NewOptInt(e.DurationPlayed),
		}
	}
	return resp, nil
}
