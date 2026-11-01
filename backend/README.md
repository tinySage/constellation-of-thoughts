# Backend

The backend is a minimal FastAPI application shell for Constellation of
Thoughts. It currently exposes only an independent health endpoint; it does not
implement authentication, persistence, journaling, semantic processing, or
graph functionality.

## Requirements

- Python 3.14
- uv

## Setup

From `backend/`:

```bash
uv sync --all-groups
```

## Development

Start the local development server with:

```bash
uv run uvicorn app.main:app --reload
```

The health endpoint is available at `http://127.0.0.1:8000/health`.

## Quality checks

Run these commands from `backend/`:

```bash
uv run ruff check .
uv run ruff format --check .
uv run pyright
uv run pytest
```
