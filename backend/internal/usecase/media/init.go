package media

import (
	"context"
	"fmt"
	"io"
	"path/filepath"
	"time"

	"github.com/google/uuid"
	"github.com/kekw123q/spotik-backend/internal/domain"
	"github.com/kekw123q/spotik-backend/pkg/config"
)

// Интерфейс репозитория метаданных (определен там, где используется)
type metadataRepo interface {
	Save(ctx context.Context, m *domain.MediaFile) error
	Get(ctx context.Context, id uuid.UUID) (*domain.MediaFile, error)
}

// Интерфейс объектного хранилища (MinIO wrapper)
type blobStorage interface {
	PutFile(ctx context.Context, bucket, objectName, contentType string, fileSize int64, reader io.Reader) error
	GetPresignedURL(ctx context.Context, bucket, objectName string, expiry time.Duration) (string, error)
	EnsureBucket(ctx context.Context, bucketName string) error
}

type Usecase struct {
	repo    metadataRepo
	storage blobStorage
	buckets config.MinioBucketsConfig
}

func New(repo metadataRepo, storage blobStorage, buckets config.MinioBucketsConfig) *Usecase {
	return &Usecase{
		repo:    repo,
		storage: storage,
		buckets: buckets,
	}
}

// InitBuckets вызывается при старте для создания бакетов
func (uc *Usecase) InitBuckets(ctx context.Context) error {
	if err := uc.storage.EnsureBucket(ctx, uc.buckets.Audio); err != nil {
		return err
	}
	if err := uc.storage.EnsureBucket(ctx, uc.buckets.Images); err != nil {
		return err
	}
	return nil
}

func (uc *Usecase) UploadFile(ctx context.Context, fileReader io.Reader, fileSize int64, fileName, contentType string, mediaType domain.MediaType) (*domain.MediaFile, error) {
	// 1. Определяем бакет
	var bucket string
	switch mediaType {
	case domain.MediaTypeAudio:
		bucket = uc.buckets.Audio
	case domain.MediaTypeImage:
		bucket = uc.buckets.Images
	default:
		return nil, fmt.Errorf("unsupported media type: %s", mediaType)
	}

	// 2. Генерируем ID и путь
	id := uuid.New()
	ext := filepath.Ext(fileName)
	objectKey := fmt.Sprintf("%s%s", id.String(), ext)

	// 3. Загружаем в MinIO
	if err := uc.storage.PutFile(ctx, bucket, objectKey, contentType, fileSize, fileReader); err != nil {
		return nil, fmt.Errorf("usecase: upload failed: %w", err)
	}

	// 4. Сохраняем метаданные
	mediaFile := &domain.MediaFile{
		ID:          id,
		Filename:    fileName,
		BucketName:  bucket,
		ObjectKey:   objectKey,
		ContentType: contentType,
		SizeBytes:   fileSize,
		CreatedAt:   time.Now(),
	}

	if err := uc.repo.Save(ctx, mediaFile); err != nil {
		return nil, fmt.Errorf("usecase: db save failed: %w", err)
	}

	return mediaFile, nil
}

func (uc *Usecase) GetStreamURL(ctx context.Context, id uuid.UUID) (string, error) {
	// 1. Получаем метаданные
	meta, err := uc.repo.Get(ctx, id)
	if err != nil {
		return "", fmt.Errorf("usecase: meta get failed: %w", err)
	}

	// 2. Генерируем ссылку (действительна 1 час)
	url, err := uc.storage.GetPresignedURL(ctx, meta.BucketName, meta.ObjectKey, time.Hour)
	if err != nil {
		return "", fmt.Errorf("usecase: sign url failed: %w", err)
	}

	return url, nil
}
