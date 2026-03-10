package library

import (
	"os"

	"github.com/dhowden/tag"
)

type TrackMeta struct {
	Title string
	Artist string
	Album string
	Year int
	TrackNo int
	DiscNo int
}

func ParseMeta(path string) (TrackMeta, os.FileInfo, error) {
	f, err := os.Open(path)
	if err != nil {
		return TrackMeta{}, nil, err
	}
	defer f.Close()

	fi, err := f.Stat()
	if err != nil {
		return TrackMeta{}, nil, err
	}

	m, err := tag.ReadFrom(f)
	if err != nil {
		// Also returning FileInfo to try to scan without metadata
		return TrackMeta{}, fi, nil
	}

	track, _ := m.Track()
	disc, _ := m.Disc()

	meta := TrackMeta{
		Title: m.Title(),
		Artist: m.Artist(),
		Album: m.Album(),
		Year: m.Year(),
		TrackNo: track,
		DiscNo: disc,
	}
	return meta, fi, nil
}
