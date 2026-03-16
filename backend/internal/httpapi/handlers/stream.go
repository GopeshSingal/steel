package handlers

import (
	"mime"
	"net/http"
	"os"
	"path/filepath"

	"github.com/go-chi/chi/v5"
)

func (h *Handlers) StreamTrack(w http.ResponseWriter, r *http.Request) {
	trackID := chi.URLParam(r, "trackId")

	row := h.db.QueryRowContext(r.Context(), `SELECT path FROM tracks WHERE id = ?`, trackID)
	var path string
	if err := row.Scan(&path); err != nil {
		writeJSON(w, http.StatusNotFound, map[string]any{"error": "track not found"})
		return 
	}

	f, err := os.Open(path)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]any{"error": "file missing"})
		return
	}
	defer f.Close()

	fi, err := f.Stat()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "stat failure"})
		return
	}

	ext := filepath.Ext(path)
	ct := mime.TypeByExtension(ext)
	if ct == "" {
		ct = "application/octet-stream"
	}
	w.Header().Set("Content-Type", ct)
	w.Header().Set("Accept-Ranges", "bytes")

	http.ServeContent(w, r, filepath.Base(path), fi.ModTime(), f)
}
