package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
)

func (h *Handlers) ListArtists(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.QueryContext(r.Context(), `SELECT id, name FROM artists ORDER BY name ASC`)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	defer rows.Close()

	type Artist struct {
		ID   int64  `json:"id"`
		Name string `json:"name"`
	}
	var out []Artist
	for rows.Next() {
		var a Artist
		if err := rows.Scan(&a.ID, &a.Name); err != nil {
			continue
		}
		out = append(out, a)
	}
	writeJSON(w, http.StatusOK, map[string]any{"artists": out})
}

func (h *Handlers) ListArtistAlbums(w http.ResponseWriter, r *http.Request) {
	artistID := chi.URLParam(r, "artistId")

	rows, err := h.db.QueryContext(r.Context(), `
SELECT id, title, COALESCE(year, 0) FROM albums
WHERE artist_id = ?
ORDER BY title ASC
`, artistID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	defer rows.Close()

	type Album struct {
		ID    int64  `json:"id"`
		Title string `json:"title"`
		Year  int    `json:"year"`
	}
	var out []Album
	for rows.Next() {
		var a Album
		if err := rows.Scan(&a.ID, &a.Title, &a.Year); err != nil {
			continue
		}
		out = append(out, a)
	}
	writeJSON(w, http.StatusOK, map[string]any{"albums": out})
}

func (h *Handlers) GetAlbum(w http.ResponseWriter, r *http.Request) {
	albumID := chi.URLParam(r, "albumId")

	var out struct {
		ID       int64  `json:"id"`
		Title    string `json:"title"`
		Year     int    `json:"year"`
		ArtistID int64  `json:"artistId"`
		Artist   string `json:"artist"`
	}

	row := h.db.QueryRowContext(r.Context(), `
SELECT al.id, al.title, COALESCE(al.year, 0), ar.id, ar.name
FROM albums al
JOIN artists ar ON ar.id = al.artist_id
WHERE al.id = ?
`, albumID)

	if err := row.Scan(&out.ID, &out.Title, &out.Year, &out.ArtistID, &out.Artist); err != nil {
		writeJSON(w, http.StatusNotFound, map[string]any{"error": "album not found"})
		return
	}
	writeJSON(w, http.StatusOK, out)
}

func (h *Handlers) ListAlbumTracks(w http.ResponseWriter, r *http.Request) {
	albumID := chi.URLParam(r, "albumId")

	rows, err := h.db.QueryContext(r.Context(), `
SELECT id, title, COALESCE(track_no, 0), COALESCE(disc_no, 0)
FROM tracks
WHERE album_id = ?
ORDER BY COALESCE(disc_no, 0) ASC, COALESCE(track_no, 0) ASC, title ASC
`, albumID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	defer rows.Close()

	type Track struct {
		ID          int64  `json:"id"`
		Title       string `json:"title"`
		TrackNo     int    `json:"trackNo"`
		DiscNo      int    `json:"discNo"`
	}
	var out []Track
	for rows.Next() {
		var t Track
		if err := rows.Scan(&t.ID, &t.Title, &t.TrackNo, &t.DiscNo); err != nil {
			continue
		}
		out = append(out, t)
	}
	writeJSON(w, http.StatusOK, map[string]any{"tracks": out})
}

func (h *Handlers) GetTrack(w http.ResponseWriter, r *http.Request) {
	trackID := chi.URLParam(r, "trackId")
	row := h.db.QueryRowContext(r.Context(), `
SELECT t.id, t.title, t.path, COALESCE(t.track_no, 0), COALESCE(t.disc_no, 0)
FROM tracks t
WHERE t.id = ?
`, trackID)

	var out struct {
		ID      int64  `json:"id"`
		Title   string `json:"title"`
		Path    string `json:"-"`
		TrackNo int    `json:"trackNo"`
		DiscNo  int    `json:"discNo"`
	}
	if err := row.Scan(&out.ID, &out.Title, &out.Path, &out.TrackNo, &out.DiscNo); err != nil {
		writeJSON(w, http.StatusNotFound, map[string]any{"error": "track not found"})
		return
	}
	writeJSON(w, http.StatusOK, out)
}

func (h *Handlers) Search(w http.ResponseWriter, r *http.Request) {
	q := strings.TrimSpace(r.URL.Query().Get("q"))
	if q == "" {
		writeJSON(w, http.StatusOK, map[string]any{"tracks": []any{}})
		return
	}
	limit := 50
	if s := r.URL.Query().Get("limit"); s != "" {
		if n, err := strconv.Atoi(s); err == nil && n > 0 && n <= 200 {
			limit = n
		}
	}

	like := "%" + q + "%"
	rows, err := h.db.QueryContext(r.Context(), `
SELECT t.id, t.title
FROM tracks t
WHERE t.title LIKE ?
ORDER BY t.title ASC
LIMIT ?
`, like, limit)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
		return
	}
	defer rows.Close()

	type Track struct {
		ID    int64  `json:"id"`
		Title string `json:"title"`
	}
	var out []Track
	for rows.Next() {
		var t Track
		if err := rows.Scan(&t.ID, &t.Title); err != nil {
			continue
		}
		out = append(out, t)
	}
	writeJSON(w, http.StatusOK, map[string]any{"tracks": out})
}