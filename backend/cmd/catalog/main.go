package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/kekw123q/spotik-backend/pkg/config"
	"github.com/kekw123q/spotik-backend/pkg/logger"
	"github.com/kekw123q/spotik-backend/pkg/postgres"

	// --- CATALOG (Старое) ---
	catalogDelivery "github.com/kekw123q/spotik-backend/internal/delivery/catalog"
	openapi "github.com/kekw123q/spotik-backend/internal/gen/openapi/catalog"
	catalogRepo "github.com/kekw123q/spotik-backend/internal/repo/catalog"
	catalogUseCase "github.com/kekw123q/spotik-backend/internal/usecase/catalog"

	// --- USER (Новое) ---
	userDelivery "github.com/kekw123q/spotik-backend/internal/delivery/user"
	userRepo "github.com/kekw123q/spotik-backend/internal/repo/user"
	userUseCase "github.com/kekw123q/spotik-backend/internal/usecase/user"
)

func main() {
	// 1. Config
	cfg, err := config.Load("./configs")
	if err != nil {
		panic(err)
	}

	// 2. Logger
	log := logger.Setup(cfg.Env)
	log.Info("Starting Service", "env", cfg.Env, "port", cfg.Catalog.HTTP.Port)

	// 3. Database
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	pgClient, err := postgres.New(ctx, cfg.Catalog.DB.DSN)
	if err != nil {
		log.Error("Failed to connect to DB", "error", err)
		os.Exit(1)
	}
	defer pgClient.Close()

	// ---------------------------------------------------------
	// 4. Wiring: CATALOG (Существующий функционал)
	// ---------------------------------------------------------
	cRepo := catalogRepo.NewRepository(pgClient)
	cUC := catalogUseCase.New(cRepo)
	cHandler := catalogDelivery.NewHandler(cUC)

	catalogServer, err := openapi.NewServer(cHandler)
	if err != nil {
		log.Error("Failed to create OpenApi server", "error", err)
		os.Exit(1)
	}

	// ---------------------------------------------------------
	// 5. Wiring: USER (Наш новый функционал)
	// ---------------------------------------------------------
	uRepo := userRepo.NewRepository(pgClient)
	uUC := userUseCase.NewUserUseCase(uRepo)
	uHandler := userDelivery.NewHandler(uUC)

	// ---------------------------------------------------------
	// 6. Routing (Объединяем старое и новое)
	// ---------------------------------------------------------
	mux := http.NewServeMux()

	// Ручное добавление маршрутов для Профиля
	mux.HandleFunc("/api/profile", func(w http.ResponseWriter, r *http.Request) {
		// CORS заголовки (если нужно для фронта сразу)
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, PUT, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			return
		}

		if r.Method == http.MethodGet {
			uHandler.GetProfile(w, r)
		} else if r.Method == http.MethodPut {
			uHandler.UpdateProfile(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// Все остальные запросы отдаем сгенерированному серверу Catalog
	mux.Handle("/", catalogServer)

	// ---------------------------------------------------------
	// 7. HTTP Server
	// ---------------------------------------------------------
	httpServer := &http.Server{
		Addr:    ":" + cfg.Catalog.HTTP.Port,
		Handler: mux, // Используем наш общий муплексор
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
