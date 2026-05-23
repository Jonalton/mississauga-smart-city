package models

import "encoding/json"

// GeoFeature is a single GeoJSON Feature with a Point geometry.
type GeoFeature struct {
	Type       string          `json:"type"`
	Geometry   PointGeometry   `json:"geometry"`
	Properties json.RawMessage `json:"properties"`
}

// PointGeometry is a GeoJSON Point: coordinates are [lng, lat].
type PointGeometry struct {
	Type        string     `json:"type"`
	Coordinates [2]float64 `json:"coordinates"`
}

// FeatureCollection is a GeoJSON FeatureCollection.
type FeatureCollection struct {
	Type     string       `json:"type"`
	Features []GeoFeature `json:"features"`
}

// AssetProperties holds typed properties of a smart city asset feature.
type AssetProperties struct {
	AssetID     string  `json:"asset_id"`
	AssetName   string  `json:"asset_name"`
	AssetType   string  `json:"asset_type"`
	WardID      int     `json:"ward_id"`
	WardName    string  `json:"ward_name"`
	Status      string  `json:"status"`
	InstallDate *string `json:"install_date"`
	Operator    string  `json:"operator"`
	RawType     string  `json:"raw_type"`
}
