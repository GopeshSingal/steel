package store

import (
	"database/sql"
	_ "embed"
	"fmt"

	_ "github.com/mattn/go-sqlite3"
)

//go:embed migrations/001_init.sql
var migration001 string

func OpenAndMigrate(dbPath string) (*sql.DB, error) {
	db, err := sql.Open("sqlite3", fmt.Sprintf("file:%s?_foreign_keys=on&_busy_timeout=5000", dbPath))
	if err!= nil {
		return nil, err
	}

	if _, err := db.Exec(migration001); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("Apply migrations: %w", err)
	}

	return db, nil
}
