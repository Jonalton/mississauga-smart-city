package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/owner/mississauga-smart-city/api/models"
	"github.com/owner/mississauga-smart-city/api/storage"
)

type AssetsHandler struct {
	Store *storage.Store
}

func (h *AssetsHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	data, ok := h.Store.Get("assets.geojson")
	if !ok {
		writeError(w, http.StatusServiceUnavailable, "assets data not available")
		return
	}

	typeFilter := r.URL.Query().Get("type")
	wardFilter := r.URL.Query().Get("ward")
	bboxFilter := r.URL.Query().Get("bbox")

	// Serve raw blob when no filters requested — avoids a full JSON parse/re-encode
	if typeFilter == "" && wardFilter == "" && bboxFilter == "" {
		w.Header().Set("Content-Type", "application/geo+json")
		w.Write(data) //nolint:errcheck
		return
	}

	var fc models.FeatureCollection
	if err := json.Unmarshal(data, &fc); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to parse assets")
		return
	}

	var wardID int
	if wardFilter != "" {
		wardID, _ = strconv.Atoi(wardFilter)
	}

	var bbox [4]float64
	hasBBox := false
	if bboxFilter != "" {
		parts := strings.Split(bboxFilter, ",")
		if len(parts) == 4 {
			ok := true
			for i, p := range parts {
				v, err := strconv.ParseFloat(strings.TrimSpace(p), 64)
				if err != nil {
					ok = false
					break
				}
				bbox[i] = v
			}
			hasBBox = ok
		}
	}

	filtered := make([]models.GeoFeature, 0, len(fc.Features))
	for _, f := range fc.Features {
		if typeFilter != "" || wardFilter != "" {
			var props models.AssetProperties
			if err := json.Unmarshal(f.Properties, &props); err != nil {
				continue
			}
			if typeFilter != "" && props.AssetType != typeFilter {
				continue
			}
			if wardFilter != "" && props.WardID != wardID {
				continue
			}
		}
		if hasBBox {
			lng, lat := f.Geometry.Coordinates[0], f.Geometry.Coordinates[1]
			if lng < bbox[0] || lat < bbox[1] || lng > bbox[2] || lat > bbox[3] {
				continue
			}
		}
		filtered = append(filtered, f)
	}

	out := models.FeatureCollection{Type: "FeatureCollection", Features: filtered}
	w.Header().Set("Content-Type", "application/geo+json")
	json.NewEncoder(w).Encode(out) //nolint:errcheck
}
