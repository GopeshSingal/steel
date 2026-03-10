dev:
	(cd backend && go run ./cmd/server) & (cd web && npm run dev)
