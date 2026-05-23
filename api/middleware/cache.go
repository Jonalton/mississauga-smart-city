package middleware

import (
	"fmt"
	"net/http"
)

// CacheControl sets a Cache-Control: public, max-age=N header on all responses.
func CacheControl(maxAgeSeconds int) func(http.Handler) http.Handler {
	header := fmt.Sprintf("public, max-age=%d", maxAgeSeconds)
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Cache-Control", header)
			next.ServeHTTP(w, r)
		})
	}
}
