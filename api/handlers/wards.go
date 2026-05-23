package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/owner/mississauga-smart-city/api/models"
	"github.com/owner/mississauga-smart-city/api/storage"
)

type WardsHandler struct {
	Store *storage.Store
}

func (h *WardsHandler) Scores(w http.ResponseWriter, r *http.Request) {
	data, ok := h.Store.Get("ward_scores.json")
	if !ok {
		writeError(w, http.StatusServiceUnavailable, "ward scores not available")
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(data) //nolint:errcheck
}

func (h *WardsHandler) ByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid ward id")
		return
	}

	data, ok := h.Store.Get("ward_scores.json")
	if !ok {
		writeError(w, http.StatusServiceUnavailable, "ward scores not available")
		return
	}

	var scores []models.WardScore
	if err := json.Unmarshal(data, &scores); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to parse ward scores")
		return
	}

	for _, s := range scores {
		if s.WardID == id {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(s) //nolint:errcheck
			return
		}
	}
	writeError(w, http.StatusNotFound, "ward not found")
}

// Boundaries serves ward polygon GeoJSON for choropleth rendering.
func (h *WardsHandler) Boundaries(w http.ResponseWriter, r *http.Request) {
	data, ok := h.Store.Get("ward_boundaries.geojson")
	if !ok {
		writeError(w, http.StatusServiceUnavailable, "ward boundaries not available")
		return
	}
	w.Header().Set("Content-Type", "application/geo+json")
	w.Write(data) //nolint:errcheck
}
