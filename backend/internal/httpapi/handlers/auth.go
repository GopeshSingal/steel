package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/sessions"
)

const sessionName = "steel_session"
const sessionUserKey = "authed"

func (h *Handlers) getSession(r *http.Request) (*sessions.Session, error) {
	return h.sessionStore.Get(r, sessionName)
}

func (h *Handlers) isAuthed(r *http.Request) bool {
	sess, err := h.getSession(r)
	if err != nil {
		return false
	}
	v, ok := sess.Values[sessionUserKey].(bool)
	return ok && v
}

func (h *Handlers) RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !h.isAuthed(r) {
			writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (h *Handlers) Login(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid json"})
		return
	}
	if body.Password != h.adminPass {
		writeJSON(w, http.StatusUnauthorized, map[string]any{"error": "invalid credentials"})
		return
	}
	sess, err := h.getSession(r)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "session error"})
		return 
	}
	sess.Values[sessionUserKey] = true
	if err := sess.Save(r, w); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "session save failure"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

func (h *Handlers) Logout(w http.ResponseWriter, r *http.Request) {
	sess, err := h.getSession(r)
	if err != nil {
		writeJSON(w, http.StatusOK, map[string]any{"ok": true})
		return
	}
	sess.Options.MaxAge = -1
	_ = sess.Save(r, w)
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

func (h *Handlers) Me(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{"authed": h.isAuthed(r)})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
