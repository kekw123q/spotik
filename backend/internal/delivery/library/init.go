package library

import (
	"context"
	"errors"

	"github.com/dkoshenkov/spotik-backend/internal/domain"
	openapi "github.com/dkoshenkov/spotik-backend/internal/gen/openapi/library"
	usecase "github.com/dkoshenkov/spotik-backend/internal/usecase/library"
	"github.com/google/uuid"
)

type Handler struct {
	uc *usecase.Usecase
}

func NewHandler(uc *usecase.Usecase) *Handler {
	return &Handler{uc: uc}
}

func mapPlaylistToOpenAPI(p domain.Playlist) openapi.Playlist {
	tracks := make([]openapi.TrackSummary, len(p.Tracks))
	for i, t := range p.Tracks {
		tracks[i] = openapi.TrackSummary{
			ID:     t.TrackID,
			Title:  "Unknown Track (MVP)",
			Artist: "Unknown Artist",
		}
	}

	var descOpt, coverOpt openapi.OptString
	if p.Description != "" {
		descOpt = openapi.NewOptString(p.Description)
	}
	if p.CoverURL != "" {
		coverOpt = openapi.NewOptString(p.CoverURL)
	}

	return openapi.Playlist{
		ID:             p.ID,
		Name:           p.Name,
		Description:    descOpt,
		CoverUrl:       coverOpt,
		IsUserPlaylist: p.IsUserPlaylist,
		Tracks:         tracks,
	}
}

var demoUserID = uuid.MustParse("00000000-0000-0000-0000-000000000001")

func (h *Handler) GetUserPlaylists(ctx context.Context) (openapi.GetUserPlaylistsRes, error) {
	playlists, err := h.uc.GetUserPlaylists(ctx, demoUserID)
	if err != nil {
		return &openapi.Error{Code: 500, Message: err.Error()}, nil
	}
	resp := make(openapi.GetUserPlaylistsOKApplicationJSON, len(playlists))
	for i, p := range playlists {
		resp[i] = mapPlaylistToOpenAPI(p)
	}
	return &resp, nil
}

func (h *Handler) GetAuthorPlaylists(ctx context.Context) (openapi.GetAuthorPlaylistsRes, error) {
	playlists, err := h.uc.GetAuthorPlaylists(ctx)
	if err != nil {
		return &openapi.Error{Code: 500, Message: err.Error()}, nil
	}
	resp := make(openapi.GetAuthorPlaylistsOKApplicationJSON, len(playlists))
	for i, p := range playlists {
		resp[i] = mapPlaylistToOpenAPI(p)
	}
	return &resp, nil
}

func (h *Handler) GetPlaylistById(ctx context.Context, params openapi.GetPlaylistByIdParams) (openapi.GetPlaylistByIdRes, error) {
	playlist, err := h.uc.GetPlaylist(ctx, params.ID)
	if err != nil {
		if errors.Is(err, domain.ErrPlaylistNotFound) {
			return &openapi.GetPlaylistByIdNotFound{Code: 404, Message: "Not found"}, nil
		}
		return &openapi.GetPlaylistByIdInternalServerError{Code: 500, Message: err.Error()}, nil
	}
	res := mapPlaylistToOpenAPI(*playlist)
	return &res, nil
}
