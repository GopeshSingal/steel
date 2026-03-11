package handlers

import (
	"context"
	"net/http"
	"time"

	"steel/internal/library"
)

func (h *Handlers) AdminScan(w http.ResponseWriter, r *http.Request) {
	scanner, ok := h.scanner.(*library.Scanner)
	if !ok {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": "scanner not configured"})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Minute)
	defer cancel()

	res, err := scanner.Scan(ctx)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error(), "result": res})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "result": res})
}
