package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	delivery "github.com/dkoshenkov/spotik-backend/internal/delivery/media"
	openapi "github.com/dkoshenkov/spotik-backend/internal/gen/openapi/media-delivery"
	repo "github.com/dkoshenkov/spotik-backend/internal/repo/media"
	usecase "github.com/dkoshenkov/spotik-backend/internal/usecase/media"
	"github.com/dkoshenkov/spotik-backend/pkg/config"
	"github.com/dkoshenkov/spotik-backend/pkg/logger"
	"github.com/dkoshenkov/spotik-backend/pkg/postgres"
	"github.com/dkoshenkov/spotik-backend/pkg/storage"
)

func main() {
	cfg, err := config.Load("./configs")
	if err != nil {
		panic(err)
	}

	log := logger.Setup(cfg.Env)
	log.Info("Starting Media Service", "port", cfg.Media.HTTP.Port)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// 1. Postgres
	pgClient, err := postgres.New(ctx, cfg.Media.DB.DSN)
	if err != nil {
		log.Error("DB connection failed", "error", err)
		os.Exit(1)
	}
	defer pgClient.Close()

	// 2. MinIO
	minioClient, err := storage.New(
		cfg.Minio.Endpoint,
		cfg.Minio.AccessKey,
		cfg.Minio.SecretKey,
		cfg.Minio.UseSSL,
	)
	if err != nil {
		log.Error("MinIO init failed", "error", err)
		os.Exit(1)
	}

	// 3. Wiring
	repository := repo.NewRepository(pgClient)
	uc := usecase.New(repository, minioClient, cfg.Minio.Buckets)

	// Создаем бакеты при старте (лучше вынести в init container/terraform, но для dev сойдет)
	if err := uc.InitBuckets(ctx); err != nil {
		log.Error("Failed to init buckets", "error", err)
		// Не падаем, возможно бакеты есть, а прав на создание нет
	}

	handler := delivery.NewHandler(uc)

	// 4. Server
	srv, err := openapi.NewServer(handler,
		// Увеличиваем лимит для загрузки файлов
		openapi.WithMaxMultipartMemory(32<<20), // 32 MB ram cache
	)
	if err != nil {
		log.Error("Failed to create server", "error", err)
		os.Exit(1)
	}

	httpServer := &http.Server{
		Addr:    ":" + cfg.Media.HTTP.Port,
		Handler: srv,
	}

	go func() {
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Error("Server error", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()
	httpServer.Shutdown(shutdownCtx)
	log.Info("Media Service Stopped")
}
