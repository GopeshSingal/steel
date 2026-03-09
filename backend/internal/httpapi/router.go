package httpapi

import (
	"database/sql"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/gorilla/sessions"

	"steel/internal/library"
	"steel/internal/httpapi/handlers"
)

type Dependencies struct {
	DB *sql.DB
	Scanner *library.Scanner
	AdminPass string
	SessionStore *sessions.CookieStore
}

func NewRouter(d Dependencies) http.Handler {
	r := chi.NewRouter()

	r.Use(RequestID)
	r.Use(Logger)
	r.Use(CORS)

	h := handlers.New(handlers.Dependencies{
		DB: d.DB,
		Scanner: d.Scanner,
		AdminPass: d.AdminPass,
		SessionStore: d.SessionStore,
	})

	r.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	r.Route("/api", func(api chi.Router) {
		api.Post("/auth/login", h.Login)
		api.Post("/auth/logout", h.Logout)
		api.Get("/me", h.Me)

		api.Group(func(protected chi.Router) {
			protected.Use(h.RequireAuth)

			protected.Get("/artists", h.ListArtists)
			protected.Get("/artists/{artistId}/albums", h.ListArtistAlbums)
			protected.Get("/albums/{albumId}", h.GetAlbum)
			protected.Get("/albums/{albumId}/tracks", h.ListAlbumTracks)
			protected.Get("/tracks/{trackId}", h.GetTrack)

			protected.Get("/search", h.Search)
			
			protected.Get("/stream/{trackId}", h.StreamTrack)

			protected.Post("/admin/scan", h.AdminScan)
		})
	})

	return r
}
