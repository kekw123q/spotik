FROM golang:1.25.3-alpine AS builder

ARG SERVICE
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/app ./cmd/${SERVICE}

FROM alpine:latest
WORKDIR /app

COPY --from=builder /bin/app .
COPY configs ./configs

# Запуск
CMD ["./app"]