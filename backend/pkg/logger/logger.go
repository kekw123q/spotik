package logger

import (
	"log/slog"
	"os"
)

func Setup(env string) *slog.Logger {
	var log *slog.Logger

	switch env {
	case "local":
		// Text format для удобства чтения в консоли
		log = slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
			Level: slog.LevelDebug,
		}))
	case "prod":
		// JSON format для Loki/ELK
		log = slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
			Level: slog.LevelInfo,
		}))
	default:
		log = slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
			Level: slog.LevelInfo,
		}))
	}

	return log
}
