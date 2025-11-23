package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	delivery "github.com/dkoshenkov/spotik-backend/internal/delivery/library"
	openapi "github.com/dkoshenkov/spotik-backend/internal/gen/openapi/library"
	repo "github.com/dkoshenkov/spotik-backend/internal/repo/library"
	usecase "github.com/dkoshenkov/spotik-backend/internal/usecase/library"
	"github.com/dkoshenkov/spotik-backend/pkg/config"
	"github.com/dkoshenkov/spotik-backend/pkg/logger"
	"github.com/dkoshenkov/spotik-backend/pkg/postgres"
)

func main() {
	cfg, err := config.Load("./configs")
	if err != nil {
		panic(err)
	}

	log := logger.Setup(cfg.Env)
	log.Info("Starting Library Service", "port", cfg.Library.HTTP.Port)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	pgClient, err := postgres.New(ctx, cfg.Library.DB.DSN)
	if err != nil {
		log.Error("DB connection failed", "error", err)
		os.Exit(1)
	}
	defer pgClient.Close()

	repository := repo.NewRepository(pgClient)
	uc := usecase.New(repository)
	uc.InitDemoData(ctx) // Create demo playlist

	handler := delivery.NewHandler(uc)
	srv, err := openapi.NewServer(handler)
	if err != nil {
		log.Error("Failed to create OpenApi server", "error", err)
		os.Exit(1)
	}

	httpServer := &http.Server{
		Addr:    ":" + cfg.Library.HTTP.Port,
		Handler: srv,
	}

	go func() {
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Error("HTTP Server error", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()
	httpServer.Shutdown(shutdownCtx)
	log.Info("Library Service Stopped")
}
