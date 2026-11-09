.PHONY: dev-backend dev-frontend test test-backend test-frontend lint typecheck build-frontend

dev-backend:
	cd backend && python manage.py runserver

dev-frontend:
	cd frontend && npm run dev

test: test-backend test-frontend

test-backend:
	cd backend && pytest

test-frontend:
	cd frontend && npm test

lint:
	cd backend && ruff check .
	cd frontend && npm run lint

typecheck:
	cd frontend && npm run typecheck

build-frontend:
	cd frontend && npm run build
