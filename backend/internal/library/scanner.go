package library

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

type Scanner struct {
	db *sql.DB
	musicDir string
}

func NewScanner(db *sql.DB, musicDir string) *Scanner {
	return &Scanner{db: db, musicDir: musicDir}
}

type ScanResult struct {
	ScannedFiles int
	Imported int
	Skipped int
	Errors int
}

func (s *Scanner) Scan(ctx context.Context) (ScanResult, error) {
	res := ScanResult{}

	allowedExt := map[string]bool{
		".mp3": true, ".flac": true, ".m4p": true, ".mp4": true,
	}

	err := filepath.WalkDir(s.musicDir, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			res.Errors++
			return nil
		}
		if d.IsDir() {
			return nil
		}
		ext := strings.ToLower(filepath.Ext(path))
		if !allowedExt[ext] {
			return nil
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		res.ScannedFiles++

		meta, fi, err := ParseMeta(path)
		if err != nil {
			res.Errors++
			return nil
		}

		mtime := fi.ModTime().Unix()
		size := fi.Size()

		var existingMtime int64
		var existingSize int64
		q := `SELECT mtime_unix, size_bytes FROM tracks WHERE path = ?`
		row := s.db.QueryRowContext(ctx, q, path)
		switch err:= row.Scan(&existingMtime, &existingSize); {
		case err == nil:
			if existingMtime == mtime && existingSize == size {
				res.Skipped++
				return nil
			}
		case errors.Is(err, sql.ErrNoRows):
		default:
			res.Errors++
			return nil
		}

		title := strings.TrimSpace(meta.Title)
		artist := strings.TrimSpace(meta.Artist)
		album := strings.TrimSpace(meta.Album)

		if title == "" {
			title = strings.TrimSuffix(filepath.Base(path), filepath.Ext(path))
		}
		if artist == "" {
			artist = "Unknown Artist"
		}
		if album == "" {
			album = "Unknown Album"
		}

		if err := s.upsertTrack(ctx, artist, album, meta.Year, title, meta.TrackNo, meta.DiscNo, path, mtime, size); err != nil {
			res.Errors++
			return nil
		}
		res.Imported++
		return nil
	})
	
	if err != nil && !errors.Is(err, context.Canceled) {
		return res, fmt.Errorf("walk: %w", err)
	}
	return res, nil
}

func (s *Scanner) upsertTrack(
	ctx context.Context,
	artistName, albumTitle string,
	year int,
	trackTitle string,
	trackNo, discNo int,
	path string,
	mtimeUnix int64,
	sizeBytes int64,
) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	artistID, err := upsertArtist(ctx, tx, artistName)
	if err != nil {
		return err
	}

	albumID, err := upsertAlbum(ctx, tx, artistID, albumTitle, year)
	if err != nil {
		return err
	}

	_, err = tx.ExecContext(ctx, `
	INSERT INTO tracks (album_id, title, track_no, disc_no, path, mtime_unix, size_bytes)
	VALUES (?, ?, ?, ?, ?, ?, ?)
	ON CONFLICT(path) DO UPDATE SET
		album_id=excluded.album_id,
		title=excluded.title,
		track_no=excluded.track_no,
		disc_no=excluded.disc_no,
		mtime_unix=excluded.mtime_unix,
		size_bytes=excluded.size_bytes
	`, albumID, trackTitle, nullableInt(trackNo), nullableInt(discNo), path, mtimeUnix, sizeBytes)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func upsertArtist(ctx context.Context, tx *sql.Tx, name string) (int64, error) {
	_, err := tx.ExecContext(ctx, `INSERT INTO artists(name) VALUES(?) ON CONFLICT(name) DO NOTHING`, name)
	if err != nil {
		return 0, err
	}
	var id int64
	if err := tx.QueryRowContext(ctx, `SELECT id FROM artists WHERE name=?`, name).Scan(&id); err != nil {
		return 0, err
	}
	return id, nil
}

func upsertAlbum(ctx context.Context, tx *sql.Tx, artistID int64, title string, year int) (int64, error) {
	_, err := tx.ExecContext(ctx, `
	INSERT INTO albums(artist_id, title, year) VALUES(?, ?, ?)
	ON CONFLICT(artist_id, title) DO UPDATE SET year=COALESCE(excluded.year, albums.year)
	`, artistID, title, nullableInt(year))
	if err != nil {
		return 0, err
	}
	var id int64
	if err := tx.QueryRowContext(ctx, `SELECT id FROM albums WHERE artist_id=? and title=?`, artistID, title).Scan(&id); err != nil {
		return 0, err
	}
	return id, nil
}

func nullableInt(v int) any {
	if v <= 0 {
		return nil
	}
	return v
}
