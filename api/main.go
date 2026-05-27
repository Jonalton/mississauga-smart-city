package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/Jonalton/mississauga-smart-city/api/handlers"
	mw "github.com/Jonalton/mississauga-smart-city/api/middleware"
	"github.com/Jonalton/mississauga-smart-city/api/storage"
)

func main() {
	ctx := context.Background()

	store, err := storage.New(ctx)
	if err != nil {
		log.Fatalf("FATAL failed to initialize GCS store: %v", err)
	}

	refreshMins := 60
	if v := os.Getenv("CACHE_REFRESH_MINUTES"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			refreshMins = n
		}
	}
	store.StartRefreshLoop(ctx, time.Duration(refreshMins)*time.Minute)

	assets := &handlers.AssetsHandler{Store: store}
	wards := &handlers.WardsHandler{Store: store}
	nearby := &handlers.NearbyHandler{Store: store}
	meta := &handlers.MetaHandler{Store: store}
	neighbourhoods := &handlers.NeighbourhoodsHandler{Store: store}

	r := chi.NewRouter()
	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)
	r.Use(mw.CORS)
	r.Use(mw.CacheControl(3600))

	r.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	r.Get("/api/assets", assets.ServeHTTP)
	r.Get("/api/wards/scores", wards.Scores)
	r.Get("/api/wards/boundaries", wards.Boundaries)
	r.Get("/api/wards/{id}", wards.ByID)
	r.Get("/api/nearby", nearby.ServeHTTP)
	r.Get("/api/meta", meta.ServeHTTP)
	r.Get("/api/neighbourhoods", neighbourhoods.ServeHTTP)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("API server listening on :%s (cache refresh every %dm)", port, refreshMins)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
