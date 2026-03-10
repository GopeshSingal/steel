package app

import (
	"net/http"
	"os"

	"github.com/gorilla/sessions"

	"steel/internal/httpapi"
	"steel/internal/store"
	"steel/internal/library"
)

type App struct {
	Router http.Handler
}

func New(cfg Config) (*App, error) {
	if err := os.MkdirAll(cfg.DataDir, 0o755); err != nil {
		return nil, err
	}

	db, err := store.OpenAndMigrate(cfg.DBPath)
	if err != nil {
		return nil, err
	}

	scanner := library.NewScanner(db, cfg.MusicDir)

	sessionStore := sessions.NewCookieStore([]byte(cfg.SessionAuthKey))

	// change later
	sessionStore.Options = &sessions.Options{
		Path: "/",
		MaxAge: 60 * 60 * 24,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	}

	r := httpapi.NewRouter(httpapi.Dependencies{
		DB: db,
		Scanner: scanner,
		AdminPass: cfg.AdminPassword,
		SessionStore: sessionStore,
	})

	return &App{Router: r}, nil
}
