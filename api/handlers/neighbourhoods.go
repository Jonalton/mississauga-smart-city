package handlers

import (
	"net/http"

	"github.com/Jonalton/mississauga-smart-city/api/storage"
)

type NeighbourhoodsHandler struct {
	Store *storage.Store
}

func (h *NeighbourhoodsHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	data, ok := h.Store.Get("neighbourhood_census.geojson")
	if !ok {
		writeError(w, http.StatusServiceUnavailable, "neighbourhood data not available")
		return
	}
	w.Header().Set("Content-Type", "application/geo+json")
	w.Write(data) //nolint:errcheck
}
