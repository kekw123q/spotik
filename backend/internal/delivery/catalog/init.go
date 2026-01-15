package catalog

import (
	"context"
	"errors"
	"fmt"
	"net/url"

	"github.com/google/uuid"
	"github.com/kekw123q/spotik-backend/internal/domain"
	openapi "github.com/kekw123q/spotik-backend/internal/gen/openapi/catalog"
	usecase "github.com/kekw123q/spotik-backend/internal/usecase/catalog"
)

const mediaService = "http://api.spotik.com/media/stream"

type Handler struct {
	uc *usecase.Usecase
}

func NewHandler(uc *usecase.Usecase) *Handler {
	return &Handler{uc: uc}
}

func mustParseURI(uri string) url.URL {
	u, err := url.Parse(uri)
	if err != nil {
		return url.URL{}
	}
	return *u
}

// mapTrackToOpenAPI возвращает базовую структуру openapi.Track
func mapTrackToOpenAPI(t *domain.Track) *openapi.Track {
	var albumOpt openapi.OptNilString
	if t.Album != nil {
		albumOpt = openapi.NewOptNilString(*t.Album)
	} else {
		albumOpt = openapi.OptNilString{
			Null: true,
			Set:  true,
		}
	}

	var coverOpt openapi.OptURI
	if t.CoverMediaID != uuid.Nil {
		coverOpt = openapi.NewOptURI(mustParseURI(fmt.Sprintf("%s/%s", mediaService, t.CoverMediaID)))
	}

	return &openapi.Track{
		ID:       t.ID,
		Title:    t.Title,
		Artist:   t.Artist,
		Album:    albumOpt,
		Duration: t.Duration,
		AudioUrl: mustParseURI(fmt.Sprintf("%s/%s", mediaService, t.CoverMediaID)),
		CoverUrl: coverOpt,
	}
}

func (h *Handler) SearchTracks(ctx context.Context, params openapi.SearchTracksParams) (openapi.SearchTracksRes, error) {
	tracks, err := h.uc.Search(ctx, params.Q)
	if err != nil {
		return &openapi.SearchTracksInternalServerError{
			Code:    500,
			Message: err.Error(),
		}, nil
	}

	responseItems := make([]openapi.Track, len(tracks))
	for i, t := range tracks {
		responseItems[i] = *mapTrackToOpenAPI(&t)
	}

	// FIX: Используем точное имя типа из oas_schemas_gen.go
	resp := openapi.SearchTracksOKApplicationJSON(responseItems)
	return &resp, nil
}

func (h *Handler) CreateTrackMetadata(ctx context.Context, req *openapi.CreateTrackRequest) (openapi.CreateTrackMetadataRes, error) {
	mediaUUID := req.MediaId

	var coverUUID uuid.UUID
	if req.CoverMediaId.IsSet() {
		coverUUID = req.CoverMediaId.Value
	}

	track, err := h.uc.CreateTrack(ctx, req.Title, req.Artist, req.Duration, mediaUUID, coverUUID)
	if err != nil {
		return &openapi.CreateTrackMetadataInternalServerError{
			Code:    500,
			Message: err.Error(),
		}, nil
	}

	return mapTrackToOpenAPI(track), nil
}

func (h *Handler) GetTrack(ctx context.Context, params openapi.GetTrackParams) (openapi.GetTrackRes, error) {
	track, err := h.uc.GetTrack(ctx, params.ID)
	if err != nil {
		if errors.Is(err, domain.ErrTrackNotFound) {
			return &openapi.GetTrackNotFound{
				Code:    404,
				Message: "Track not found",
			}, nil
		}
		return &openapi.GetTrackInternalServerError{
			Code:    500,
			Message: err.Error(),
		}, nil
	}

	return mapTrackToOpenAPI(track), nil
}
