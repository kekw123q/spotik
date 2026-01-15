package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/kekw123q/spotik-backend/pkg/logger"
	"github.com/kekw123q/spotik-backend/pkg/postgres"

	// Импортируем наши новые пакеты
	userDelivery "github.com/kekw123q/spotik-backend/internal/delivery/user"
	userRepo "github.com/kekw123q/spotik-backend/internal/repo/user"
	userUseCase "github.com/kekw123q/spotik-backend/internal/usecase/user"
)

func main() {
	// 1. Логгер
	log := logger.Setup("local")
	log.Info("Starting USER Service")

	// 2. Подключение к БД
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// ВАЖНО: Жестко прописываем подключение к нашему Docker контейнеру (порт 5432)
	dsn := "postgres://postgres:postgres@127.0.0.1:5432/spotik_db?sslmode=disable"

	pgClient, err := postgres.New(ctx, dsn)
	if err != nil {
		log.Error("Failed to connect to DB", "error", err)
		// Если тут ошибка, проверь, запущен ли Docker: docker ps
		os.Exit(1)
	}
	defer pgClient.Close()
	log.Info("Successfully connected to Database")

	// 3. Сборка слоев (Repo -> UseCase -> Handler)
	repository := userRepo.NewRepository(pgClient)
	useCase := userUseCase.NewUserUseCase(repository)
	handler := userDelivery.NewHandler(useCase)

	// 4. Роутер
	mux := http.NewServeMux()

	// Настраиваем маршруты
	mux.HandleFunc("/api/profile", func(w http.ResponseWriter, r *http.Request) {
		// CORS заголовки
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, PUT, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		if r.Method == http.MethodGet {
			handler.GetProfile(w, r)
		} else if r.Method == http.MethodPut {
			handler.UpdateProfile(w, r)
		} else {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// 5. Запуск сервера на порту 8085
	port := "8085"
	log.Info("Server listening on port " + port)

	httpServer := &http.Server{
		Addr:    ":" + port,
		Handler: mux,
	}

	go func() {
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Error("HTTP Server error", "error", err)
			os.Exit(1)
		}
	}()

	// Graceful Shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Info("Shutting down server...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()
	httpServer.Shutdown(shutdownCtx)
	log.Info("Server exited")
}
