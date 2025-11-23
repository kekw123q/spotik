package main

import (
	"context"
	delivery "github.com/dkoshenkov/spotik-backend/internal/delivery/catalog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	openapi "github.com/dkoshenkov/spotik-backend/internal/gen/openapi/catalog"
	repo "github.com/dkoshenkov/spotik-backend/internal/repo/catalog"
	usecase "github.com/dkoshenkov/spotik-backend/internal/usecase/catalog"
	"github.com/dkoshenkov/spotik-backend/pkg/config"
	"github.com/dkoshenkov/spotik-backend/pkg/logger"
	"github.com/dkoshenkov/spotik-backend/pkg/postgres"
)

func main() {
	// 1. Config
	cfg, err := config.Load("./configs")
	if err != nil {
		panic(err)
	}

	// 2. Logger
	log := logger.Setup(cfg.Env)
	log.Info("Starting Catalog Service", "env", cfg.Env, "port", cfg.Catalog.HTTP.Port)

	// 3. Database
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	pgClient, err := postgres.New(ctx, cfg.Catalog.DB.DSN)
	if err != nil {
		log.Error("Failed to connect to DB", "error", err)
		os.Exit(1)
	}
	defer pgClient.Close()

	// 4. Layers Wiring
	// Repo -> Usecase -> Delivery
	repository := repo.NewRepository(pgClient)
	uc := usecase.New(repository)
	handler := delivery.NewHandler(uc)

	// 5. OpenApi Server
	srv, err := openapi.NewServer(handler)
	if err != nil {
		log.Error("Failed to create OpenApi server", "error", err)
		os.Exit(1)
	}

	// 6. HTTP Server
	httpServer := &http.Server{
		Addr:    ":" + cfg.Catalog.HTTP.Port,
		Handler: srv,
	}

	// Graceful Shutdown
	go func() {
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Error("HTTP Server error", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Info("Shutting down server...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()

	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		log.Error("Server forced to shutdown", "error", err)
	}

	log.Info("Server exited")
}
