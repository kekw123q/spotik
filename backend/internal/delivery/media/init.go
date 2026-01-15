package media

import (
	"context"
	"errors"
	"io"
	"net/url"

	"github.com/google/uuid"
	"github.com/kekw123q/spotik-backend/internal/domain"
	openapi "github.com/kekw123q/spotik-backend/internal/gen/openapi/media-delivery"
)

// Интерфейс UseCase (определен в delivery, так как delivery его использует)
type mediaUsecase interface {
	UploadFile(ctx context.Context, fileReader io.Reader, fileSize int64, fileName, contentType string, mediaType domain.MediaType) (*domain.MediaFile, error)
	GetStreamURL(ctx context.Context, id uuid.UUID) (string, error)
}

type Handler struct {
	uc mediaUsecase
}

func NewHandler(uc mediaUsecase) *Handler {
	return &Handler{uc: uc}
}

func (h *Handler) UploadFile(ctx context.Context, req *openapi.UploadFileReq) (openapi.UploadFileRes, error) {
	file := req.File
	// Определяем тип из Enum OpenAPI
	var mType domain.MediaType
	switch req.Type {
	case openapi.UploadFileReqTypeAudio:
		mType = domain.MediaTypeAudio
	case openapi.UploadFileReqTypeImage:
		mType = domain.MediaTypeImage
	case openapi.UploadFileReqTypeVideo:
		mType = domain.MediaTypeVideo
	}

	res, err := h.uc.UploadFile(ctx, file.File, file.Size, file.Name, file.Header.Get("Content-Type"), mType)
	if err != nil {
		return &openapi.UploadFileInternalServerError{
			Code:    500,
			Message: err.Error(),
		}, nil
	}

	return &openapi.UploadFileCreated{
		MediaId: openapi.NewOptUUID(res.ID),
		// Публичный URL для простоты пока не формируем, так как используем Presigned
		PublicUrl: openapi.OptString{},
	}, nil
}

func (h *Handler) GetStreamUrl(ctx context.Context, params openapi.GetStreamUrlParams) (openapi.GetStreamUrlRes, error) {
	uriStr, err := h.uc.GetStreamURL(ctx, params.ResourceId)
	if err != nil {
		if errors.Is(err, domain.ErrMediaNotFound) {
			return &openapi.GetStreamUrlNotFound{Code: 404, Message: "Media not found"}, nil
		}
		return &openapi.GetStreamUrlInternalServerError{Code: 500, Message: err.Error()}, nil
	}

	u, _ := url.Parse(uriStr)

	return &openapi.GetStreamUrlOK{
		URL: openapi.NewOptURI(*u),
	}, nil
}
