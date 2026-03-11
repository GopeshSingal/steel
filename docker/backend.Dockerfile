FROM golang:1.23-alpine

ENV CGO_ENABLED=1

WORKDIR /app

RUN apk add --no-cache git build-base

COPY backend/go.mod backend/go.sum ./backend/
RUN cd backend && go mod download

COPY backend ./backend

ENV STEEL_HTTP_ADDR=":8080" \
    STEEL_MUSIC_DIR="/music" \
    STEEL_DATA_DIR="/data" \
    STEEL_DB_PATH="/data/steel.db" \
    STEEL_ADMIN_PASSWORD="123456" \
    STEEL_SESSION_AUTH_KEY="dev-secret-key"

EXPOSE 8080

WORKDIR /app/backend

CMD ["go", "run", "./cmd/server"]

