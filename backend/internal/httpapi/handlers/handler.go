package handlers

import (
	"database/sql"
	
	"github.com/gorilla/sessions"
)

type Dependencies struct {
	DB *sql.DB
	Scanner any
	AdminPass string
	SessionStore *sessions.CookieStore
}

type Handlers struct {
	db *sql.DB
	scanner any
	adminPass string
	sessionStore *sessions.CookieStore
}

func New(d Dependencies) *Handlers {
	return &Handlers {
		db: d.DB,
		scanner: d.Scanner,
		adminPass: d.AdminPass,
		sessionStore: d.SessionStore,
	}
}
