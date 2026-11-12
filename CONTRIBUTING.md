# Contributing to KrishiSetu AI

Thank you for helping improve **KrishiSetu AI**!

## Development Setup
See the [Quickstart in README.md](./README.md#-development-quickstart) to run the Django backend (`backend/`), React frontend (`frontend/`), and ML package (`ml/`) locally.

## Ground Rules
1. **Never commit secrets.** Put API keys and database URLs in `.env` / `.env.local` (never in tracked files).
2. **Preserve verified data integrity.** Do not invent crop counts, scheme claims, nutritional values, or accuracy numbers. Every agricultural or nutrition fact must trace to an official source.
3. **Multilingual UI.** Every farmer-facing string in `frontend/src/` must use `i18next` keys across all 23 locales. Verify parity with:
   ```bash
   node scripts/i18n-check.mjs
   ```
4. **Design tokens.** Use brand colors and tokens from `frontend/src/design/tokens.ts` / `tokens.css` (verify with `npm --prefix frontend run check:css-vars`).
5. **Agricultural safety.** Disease or pesticide guidance must never prescribe exact chemical dosages and must include a recommendation to consult an agronomist, KVK, or Kisan Call Centre (`1800-180-1551`).

## Running Checks Before Opening a PR
```bash
# Backend & ML tests + lint
backend/.venv/bin/python -m pytest backend/ ml/tests
backend/.venv/bin/python -m ruff check backend ml
backend/.venv/bin/python -m ruff format --check backend ml

# Frontend tests, lint, typecheck, i18n & CSS tokens
npm --prefix frontend run lint
npm --prefix frontend run typecheck
npm --prefix frontend run check:css-vars
npm --prefix frontend test
node scripts/i18n-check.mjs
```

## Commit Convention
Use [Conventional Commits](https://www.conventionalcommits.org/):
- `feat: <description>`
- `fix: <description>`
- `docs: <description>`
- `style: <description>`
- `refactor: <description>`
- `test: <description>`
- `chore: <description>`
