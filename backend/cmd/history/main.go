package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	delivery "github.com/dkoshenkov/spotik-backend/internal/delivery/history"
	openapi "github.com/dkoshenkov/spotik-backend/internal/gen/openapi/history"
	repo "github.com/dkoshenkov/spotik-backend/internal/repo/history"
	usecase "github.com/dkoshenkov/spotik-backend/internal/usecase/history"
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
	log.Info("Starting History Service", "port", cfg.History.HTTP.Port)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	pgClient, err := postgres.New(ctx, cfg.History.DB.DSN)
	if err != nil {
		log.Error("DB connection failed", "error", err)
		os.Exit(1)
	}
	defer pgClient.Close()

	repository := repo.NewRepository(pgClient)
	uc := usecase.New(repository)
	handler := delivery.NewHandler(uc)

	srv, err := openapi.NewServer(handler)
	if err != nil {
		log.Error("Failed to create OpenApi server", "error", err)
		os.Exit(1)
	}

	httpServer := &http.Server{
		Addr:    ":" + cfg.History.HTTP.Port,
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
	log.Info("History Service Stopped")
}
