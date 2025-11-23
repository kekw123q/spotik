PROJECT_NAME := spotik-backend
GO_GEN := go run -mod=mod github.com/ogen-go/ogen/cmd/ogen
MIGRATE_CMD := go run ./cmd/migrator/main.go

KIND_CONFIG := deploy/kind-config.yaml
KIND_CLUSTER_NAME := spotik
KUBE_CONTEXT := kind-$(KIND_CLUSTER_NAME)

# --- Ports & DSNs ---
CATALOG_DB_PORT := 55432
LIBRARY_DB_PORT := 55433
MEDIA_DB_PORT   := 55434
HISTORY_DB_PORT := 55435

CATALOG_DSN := "postgres://user:pass@localhost:$(CATALOG_DB_PORT)/catalog_db?sslmode=disable"
LIBRARY_DSN := "postgres://user:pass@localhost:$(LIBRARY_DB_PORT)/library_db?sslmode=disable"
MEDIA_DSN   := "postgres://user:pass@localhost:$(MEDIA_DB_PORT)/media_db?sslmode=disable"
HISTORY_DSN := "postgres://user:pass@localhost:$(HISTORY_DB_PORT)/history_db?sslmode=disable"

MINIO_PORT := 9000
MINIO_CONSOLE_PORT := 9001

.PHONY: init gen-api tidy lint build \
	infra-up infra-down k8s-cluster-create k8s-cluster-delete k8s-db-up k8s-db-down \
	db-tunnel migrate-new migrate-up migrate-down migrate-all ingress-install

# --- Basic Go Commands ---
init:
	go get github.com/ogen-go/ogen@latest
	go get github.com/spf13/viper
	go get github.com/jackc/pgx/v5
	go get go.opentelemetry.io/otel
	go get -u github.com/golang-migrate/migrate/v4

gen-api:
	@echo "Scanning docs/ for openapi.yaml files..."
	@find docs -name "openapi.yaml" | while read file; do \
		dir=$$(dirname $$file); \
		service=$$(basename $$dir); \
		target_dir="internal/gen/openapi/$$service"; \
		mkdir -p $$target_dir; \
		$(GO_GEN) --target $$target_dir --package openapi --clean $$file; \
	done

tidy:
	go mod tidy

lint:
	golangci-lint run ./...

build:
	go build -o bin/catalog ./cmd/catalog
	go build -o bin/library ./cmd/library
	go build -o bin/media ./cmd/media
	go build -o bin/history ./cmd/history
	go build -o bin/migrator ./cmd/migrator

# --- Infrastructure ---

infra-up: k8s-cluster-create k8s-db-up ingress-install
	@echo "Waiting for deployments..."
	@kubectl wait --for=condition=available deployment/catalog-db --timeout=120s --context $(KUBE_CONTEXT)
	@kubectl wait --for=condition=available deployment/library-db --timeout=120s --context $(KUBE_CONTEXT)
	@kubectl wait --for=condition=available deployment/media-db --timeout=120s --context $(KUBE_CONTEXT)
	@kubectl wait --for=condition=available deployment/history-db --timeout=120s --context $(KUBE_CONTEXT)
	@kubectl wait --for=condition=available deployment/minio --timeout=120s --context $(KUBE_CONTEXT)
	@echo "✅ Infrastructure ready."

infra-down: k8s-cluster-delete

k8s-cluster-create:
	@echo "Creating Kind cluster..."
	@kind get clusters | grep -q "^$(KIND_CLUSTER_NAME)$$" || kind create cluster --name $(KIND_CLUSTER_NAME) --config $(KIND_CONFIG)

k8s-cluster-delete:
	kind delete cluster --name $(KIND_CLUSTER_NAME)

k8s-db-up:
	@kubectl config use-context $(KUBE_CONTEXT)
	kubectl apply -f deploy/k8s/local/databases.yaml
	kubectl apply -f deploy/k8s/local/minio.yaml

k8s-db-down:
	@kubectl config use-context $(KUBE_CONTEXT)
	kubectl delete -f deploy/k8s/local/databases.yaml
	kubectl delete -f deploy/k8s/local/minio.yaml

ingress-install:
	@echo "Installing NGINX Ingress Controller..."
	kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
	@echo "Waiting for Ingress Controller to be ready..."
	@kubectl wait --namespace ingress-nginx \
	  --for=condition=ready pod \
	  --selector=app.kubernetes.io/component=controller \
	  --timeout=180s --context $(KUBE_CONTEXT)

db-tunnel:
	@echo "Starting port-forwarding..."
	@kubectl port-forward svc/catalog-db $(CATALOG_DB_PORT):5432 > /dev/null 2>&1 &
	@kubectl port-forward svc/library-db $(LIBRARY_DB_PORT):5432 > /dev/null 2>&1 &
	@kubectl port-forward svc/media-db $(MEDIA_DB_PORT):5432 > /dev/null 2>&1 &
	@kubectl port-forward svc/history-db $(HISTORY_DB_PORT):5432 > /dev/null 2>&1 &
	@echo "Tunnels established."

minio-tunnel:
	@kubectl port-forward svc/minio $(MINIO_CONSOLE_PORT):9001 > /dev/null 2>&1 &
	@echo "MinIO Console: http://localhost:$(MINIO_CONSOLE_PORT)"

# --- Migrations ---

migrate-new:
	@if [ -z "$(SERVICE)" ] || [ -z "$(NAME)" ]; then echo "Usage: make migrate-new SERVICE=<service> NAME=<name>"; exit 1; fi
	migrate create -ext sql -dir migrations/$(SERVICE) -seq $(NAME)

migrate-up:
	@if [ -z "$(SERVICE)" ]; then echo "Usage: make migrate-up SERVICE=<service>"; exit 1; fi
	@DSN=""; \
	if [ "$(SERVICE)" = "catalog" ]; then DSN=$(CATALOG_DSN); fi; \
	if [ "$(SERVICE)" = "library" ]; then DSN=$(LIBRARY_DSN); fi; \
	if [ "$(SERVICE)" = "media" ]; then DSN=$(MEDIA_DSN); fi; \
	if [ "$(SERVICE)" = "history" ]; then DSN=$(HISTORY_DSN); fi; \
	if [ -z "$$DSN" ]; then echo "Error: Unknown service '$(SERVICE)'"; exit 1; fi; \
	$(MIGRATE_CMD) -path migrations/$(SERVICE) -dsn $$DSN up

migrate-down:
	@if [ -z "$(SERVICE)" ]; then echo "Usage: make migrate-down SERVICE=<service>"; exit 1; fi
	@DSN=""; \
	if [ "$(SERVICE)" = "catalog" ]; then DSN=$(CATALOG_DSN); fi; \
	if [ "$(SERVICE)" = "library" ]; then DSN=$(LIBRARY_DSN); fi; \
	if [ "$(SERVICE)" = "media" ]; then DSN=$(MEDIA_DSN); fi; \
	if [ "$(SERVICE)" = "history" ]; then DSN=$(HISTORY_DSN); fi; \
	if [ -z "$$DSN" ]; then echo "Error: Unknown service '$(SERVICE)'"; exit 1; fi; \
	$(MIGRATE_CMD) -path migrations/$(SERVICE) -dsn $$DSN down

migrate-all:
	@echo "--- Migrating Catalog ---"
	@$(MIGRATE_CMD) -path migrations/catalog -dsn $(CATALOG_DSN) up
	@echo "--- Migrating Library ---"
	@$(MIGRATE_CMD) -path migrations/library -dsn $(LIBRARY_DSN) up
	@echo "--- Migrating Media ---"
	@$(MIGRATE_CMD) -path migrations/media -dsn $(MEDIA_DSN) up
	@echo "--- Migrating History ---"
	@$(MIGRATE_CMD) -path migrations/history -dsn $(HISTORY_DSN) up