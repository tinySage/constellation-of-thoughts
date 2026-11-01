# Neon Database Setup

## Provisioned project

The Phase 2 development database is provisioned in the Muktanan Neon organization.

| Setting | Value |
|---|---|
| Project | `constellation-of-thoughts` |
| Project ID | `dawn-boat-40204880` |
| Region | `aws-ap-southeast-1` (Singapore) |
| PostgreSQL | 17 |
| Database | `neondb` |
| Default branch | `main` |
| Plan | Free |

The project is an infrastructure foundation only. No application tables, authentication, journal data, or migrations have been created.

## Secret handling

The database URL is a credential. Never put it in source code, documentation, commits, screenshots, issue comments, or frontend environment variables.

For GitHub Codespaces, add a repository Codespaces secret named `DATABASE_URL`:

1. Open the repository's **Settings → Secrets and variables → Codespaces**.
2. Create a new secret named `DATABASE_URL`.
3. Paste the **pooled** connection string copied from the Neon Console for the `main` branch and `neondb` database. The hostname should contain `-pooler`.
4. Grant the secret to this repository, then restart the Codespace so it is injected into the environment.

For local development, copy `.env.example` to `.env` inside `backend/` and put the same pooled URL there. The backend `.gitignore` excludes both files; only the example is tracked.

Do not use a direct, unpooled connection for normal application traffic. Do not expose `DATABASE_URL` through a `VITE_*` variable or any browser bundle.

## Verify the connection from a Codespace

The backend currently has no database driver or persistence layer. Add the PostgreSQL driver in the backend workspace when beginning the database implementation:

```bash
cd backend
uv add "psycopg[binary]"
```

Then run a connection smoke test without printing the URL:

```bash
uv run python - <<'PY'
import os
import psycopg

url = os.environ["DATABASE_URL"]
with psycopg.connect(url, connect_timeout=10) as connection:
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT current_database(), current_user, "
            "current_setting('server_version')"
        )
        print(cursor.fetchone())
PY
```

Expected result: database `neondb`, the project owner role, and PostgreSQL 17.x. This confirms connectivity; it does not create or modify application data.

## Next implementation boundary

The approved roadmap defines Phase 2 as the database foundation. Before creating application tables, implement and review:

- SQLAlchemy/SQLModel choice and Alembic migration workflow.
- The approved conceptual entities and ownership constraints in `DATA_MODEL.md`.
- pgvector extension availability and vector dimension/model decision.
- A database readiness check separate from the liveness endpoint.
- Two-user isolation tests before any real journal workflow.

Do not enable Neon Auth, Data API, Object Storage, Functions, or AI Gateway as part of this bare PostgreSQL setup. The application architecture uses a FastAPI backend and keeps journal content and inference in controlled infrastructure by default.

## Re-check

From the backend workspace, after the driver is installed and `DATABASE_URL` is injected:

```bash
uv run python -c 'import os, psycopg; c=psycopg.connect(os.environ["DATABASE_URL"]); print(c.execute("SELECT 1").fetchone()); c.close()'
```
