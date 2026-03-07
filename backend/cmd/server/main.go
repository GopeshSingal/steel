package main

import (
	"log"
	"net/http"

	"steel/internal/app"
)

func main() {
	cfg := app.LoadConfig()
	a, err := app.New(cfg)
	if err != nil {
		log.Fatalf("Initialization error: %v", err)
	}

	srv := &http.Server{
		Addr: cfg.HTTPAddr,
		Handler: a.Router,
	}

	log.Printf("steel listening on %s", cfg.HTTPAddr)
	log.Printf("MUSIC_DIR=%s", cfg.MusicDir)
	log.Fatal(srv.ListenAndServe())
}
