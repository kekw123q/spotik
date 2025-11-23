package domain

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

var (
	ErrMediaNotFound = errors.New("media file not found")
)

type MediaType string

const (
	MediaTypeAudio MediaType = "audio"
	MediaTypeImage MediaType = "image"
	MediaTypeVideo MediaType = "video"
)

type MediaFile struct {
	ID          uuid.UUID
	Filename    string
	BucketName  string
	ObjectKey   string
	ContentType string
	SizeBytes   int64
	CreatedAt   time.Time
}
