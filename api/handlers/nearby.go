package handlers

import (
	"encoding/json"
	"math"
	"net/http"
	"strconv"

	"github.com/Jonalton/mississauga-smart-city/api/models"
	"github.com/Jonalton/mississauga-smart-city/api/storage"
)

const earthRadiusM = 6_371_000.0
const maxRadiusM = 5000.0

type NearbyHandler struct {
	Store *storage.Store
}

func (h *NearbyHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	lat, errLat := strconv.ParseFloat(q.Get("lat"), 64)
	lng, errLng := strconv.ParseFloat(q.Get("lng"), 64)
	radius, errR := strconv.ParseFloat(q.Get("radius"), 64)

	if errLat != nil || errLng != nil || errR != nil {
		writeError(w, http.StatusBadRequest, "lat, lng, and radius (meters) are required")
		return
	}
	if radius > maxRadiusM {
		radius = maxRadiusM
	}

	data, ok := h.Store.Get("assets.geojson")
	if !ok {
		writeError(w, http.StatusServiceUnavailable, "assets data not available")
		return
	}

	var fc models.FeatureCollection
	if err := json.Unmarshal(data, &fc); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to parse assets")
		return
	}

	nearby := make([]models.GeoFeature, 0)
	for _, f := range fc.Features {
		if f.Geometry.Type != "Point" {
			continue
		}
		fLng, fLat := f.Geometry.Coordinates[0], f.Geometry.Coordinates[1]
		if haversine(lat, lng, fLat, fLng) <= radius {
			nearby = append(nearby, f)
		}
	}

	out := models.FeatureCollection{Type: "FeatureCollection", Features: nearby}
	w.Header().Set("Content-Type", "application/geo+json")
	json.NewEncoder(w).Encode(out) //nolint:errcheck
}

// haversine returns distance in metres between two WGS84 points.
func haversine(lat1, lng1, lat2, lng2 float64) float64 {
	dLat := (lat2 - lat1) * math.Pi / 180
	dLng := (lng2 - lng1) * math.Pi / 180
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*math.Pi/180)*math.Cos(lat2*math.Pi/180)*
			math.Sin(dLng/2)*math.Sin(dLng/2)
	return earthRadiusM * 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
}
