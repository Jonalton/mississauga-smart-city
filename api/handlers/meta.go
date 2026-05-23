package handlers

import (
	"net/http"

	"github.com/Jonalton/mississauga-smart-city/api/storage"
)

type MetaHandler struct {
	Store *storage.Store
}

func (h *MetaHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	data, ok := h.Store.Get("metadata.json")
	if !ok {
		writeError(w, http.StatusServiceUnavailable, "metadata not available")
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(data) //nolint:errcheck
}
