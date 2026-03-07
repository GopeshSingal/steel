package app

import (
	"os"
)

type Config struct {
	HTTPAddr string
	MusicDir string
	DataDir string
	DBPath string
	AdminPassword string
	SessionAuthKey string
}

func LoadConfig() Config {
	httpAddr := getenv("STEEL_HTTP_ADDR", ":8080")
	musicDir := getenv("STEEL_MUSIC_DIR", "./music")
	dataDir := getenv("STEEL_DATA_DIR", "./data")
	dbPath := getenv("STEEL_DB_PATH", dataDir+"/steel.db")
	adminPass := getenv("STEEL_ADMIN_PASSWORD", "123456")
	sessionKey := getenv("STEEL_SESSION_AUTH_KEY", "key")

	return Config{
		HTTPAddr: httpAddr,
		MusicDir: musicDir,
		DataDir: dataDir,
		DBPath: dbPath,
		AdminPassword: adminPass,
		SessionAuthKey: sessionKey,
	}
}

func getenv(k, def string) string {
	v := os.Getenv(k)
	if v == "" {
		return def
	}
	return v
}
