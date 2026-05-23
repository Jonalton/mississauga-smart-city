package storage

import (
	"context"
	"fmt"
	"io"
	"log"
	"os"
	"sync"
	"time"

	"cloud.google.com/go/storage"
)

// Store holds GCS blobs in memory and refreshes them on a background timer.
// All API handlers read from the in-memory cache — zero GCS reads per request.
type Store struct {
	mu     sync.RWMutex
	blobs  map[string][]byte
	bucket string
	client *storage.Client
}

var blobNames = []string{
	"assets.geojson",
	"ward_scores.json",
	"joined_data.geojson",
	"ward_boundaries.geojson",
	"metadata.json",
}

func New(ctx context.Context) (*Store, error) {
	client, err := storage.NewClient(ctx)
	if err != nil {
		return nil, fmt.Errorf("storage.NewClient: %w", err)
	}
	s := &Store{
		blobs:  make(map[string][]byte),
		bucket: os.Getenv("GCS_BUCKET_NAME"),
		client: client,
	}
	if err := s.refresh(ctx); err != nil {
		return nil, fmt.Errorf("initial GCS cache load failed: %w", err)
	}
	return s, nil
}

// StartRefreshLoop runs a background goroutine that reloads all blobs on the given interval.
// On failure it logs a warning and continues serving stale data rather than crashing.
func (s *Store) StartRefreshLoop(ctx context.Context, interval time.Duration) {
	go func() {
		t := time.NewTicker(interval)
		defer t.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-t.C:
				if err := s.refresh(ctx); err != nil {
					log.Printf("WARN GCS cache refresh failed (serving stale data): %v", err)
				}
			}
		}
	}()
}

// Get returns a cached blob by name. Returns (nil, false) if not loaded.
func (s *Store) Get(name string) ([]byte, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	b, ok := s.blobs[name]
	return b, ok
}

func (s *Store) refresh(ctx context.Context) error {
	bkt := s.client.Bucket(s.bucket)
	next := make(map[string][]byte, len(blobNames))
	for _, name := range blobNames {
		b, err := readBlob(ctx, bkt, name)
		if err != nil {
			return fmt.Errorf("read %s: %w", name, err)
		}
		next[name] = b
	}
	s.mu.Lock()
	s.blobs = next
	s.mu.Unlock()
	log.Printf("GCS cache refreshed: %d blobs loaded", len(next))
	return nil
}

func readBlob(ctx context.Context, bkt *storage.BucketHandle, name string) ([]byte, error) {
	r, err := bkt.Object(name).NewReader(ctx)
	if err != nil {
		return nil, err
	}
	defer r.Close()
	return io.ReadAll(r)
}
