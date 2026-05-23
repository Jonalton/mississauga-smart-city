package models

// WardScore holds per-ward equity metrics computed by the pipeline.
type WardScore struct {
	WardID              int            `json:"ward_id"`
	WardName            string         `json:"ward_name"`
	Population          int            `json:"population"`
	AreaKm2             float64        `json:"area_km2"`
	AssetCount          int            `json:"asset_count"`
	AssetPerKm2         float64        `json:"asset_per_km2"`
	AssetPer1kResidents float64        `json:"asset_per_1k_residents"`
	EquityScore         float64        `json:"equity_score"`
	Rank                int            `json:"rank"`
	TypeBreakdown       map[string]int `json:"type_breakdown"`
	GapFlags            []string       `json:"gap_flags"`
}

// Metadata holds pipeline run metadata served by /api/meta.
type Metadata struct {
	LastUpdated     string         `json:"last_updated"`
	TotalAssets     int            `json:"total_assets"`
	WardsCovered    int            `json:"wards_covered"`
	AssetTypeCounts map[string]int `json:"asset_type_counts"`
	PipelineVersion string         `json:"pipeline_version"`
	Source          string         `json:"source"`
	PipelineError   *PipelineError `json:"pipeline_error,omitempty"`
}

// PipelineError surfaces a failed pipeline run to the frontend.
type PipelineError struct {
	Error     string `json:"error"`
	Stage     string `json:"stage"`
	Timestamp string `json:"timestamp"`
}
