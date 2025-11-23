package main

import (
	"flag"
	"log"
	"os"
	"strings"
	"time"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func main() {
	var (
		dsn           string
		migrationPath string
		command       string
	)

	flag.StringVar(&dsn, "dsn", os.Getenv("MIGRATE_DSN"), "Database DSN")
	flag.StringVar(&migrationPath, "path", os.Getenv("MIGRATE_PATH"), "Path to migrations")
	flag.Parse()

	args := flag.Args()
	if len(args) > 0 {
		command = args[0]
	} else {
		command = "up"
	}

	if dsn == "" || migrationPath == "" {
		log.Fatal("Error: -dsn and -path are required")
	}

	// 1. Обработка пути к файлам
	cleanPath := migrationPath
	if strings.HasPrefix(cleanPath, "file://") {
		cleanPath = strings.TrimPrefix(cleanPath, "file://")
	}

	// 2. Проверка: существует ли директория и есть ли в ней sql файлы
	if isEmptyOrNoSql(cleanPath) {
		log.Printf("Skipping migration: directory %s is empty or contains no SQL files", cleanPath)
		return
	}

	// 3. Хак для pgx
	if strings.HasPrefix(dsn, "postgres://") {
		dsn = "pgx5://" + strings.TrimPrefix(dsn, "postgres://")
	}
	if !strings.HasPrefix(migrationPath, "file://") {
		migrationPath = "file://" + migrationPath
	}

	log.Printf("Starting migration. Path: %s, Command: %s", migrationPath, command)

	m, err := migrate.New(migrationPath, dsn)
	if err != nil {
		log.Fatalf("Failed to create migrate instance: %v", err)
	}
	defer m.Close()

	m.LockTimeout = 1 * time.Minute

	switch command {
	case "up":
		if err := m.Up(); err != nil {
			if err == migrate.ErrNoChange {
				log.Println("No changes to apply.")
			} else {
				log.Fatalf("Migration UP failed: %v", err)
			}
		} else {
			log.Println("Migration UP finished successfully.")
		}
	case "down":
		if err := m.Down(); err != nil {
			if err == migrate.ErrNoChange {
				log.Println("No changes to apply.")
			} else {
				log.Fatalf("Migration DOWN failed: %v", err)
			}
		} else {
			log.Println("Migration DOWN finished successfully.")
		}
	default:
		log.Fatalf("Unknown command: %s", command)
	}
}

func isEmptyOrNoSql(path string) bool {
	entries, err := os.ReadDir(path)
	if os.IsNotExist(err) {
		return true
	}
	if err != nil {
		log.Fatalf("Failed to read migration directory: %v", err)
	}

	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".sql") {
			return false // Нашли хотя бы один SQL файл
		}
	}
	return true
}
