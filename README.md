# ✦ Constellation of Thoughts

Constellation of Thoughts is an intended intelligent visual journaling
application. Journal entries become stars or nodes, related thoughts form
constellations, and users can explore how their thinking evolves over time.

The product vision combines private journaling, semantic relationships, natural
language processing, and interactive graph exploration. Most of that product
vision is planned rather than implemented in the current repository.

## Project status

- **Phase 0 — Product Planning:** Completed.
- **Phase 1 — Development Environment and Repository Setup:** Implementation
  completed; pending merge of PR #2.
- **Phase 2 — Database Foundation:** Not started.

The current implementation contains only a minimal frontend shell, a minimal
backend health endpoint, and continuous integration. Authentication, journal
CRUD, persistence, embeddings, graph visualization, and user-facing
constellation features are not implemented.

## Technology stack

### Current tooling

- React and TypeScript
- Vite
- Python and FastAPI
- Node.js 26 LTS and npm
- Python 3.14 and uv
- Vitest and React Testing Library
- Ruff, Pytest, HTTPX, and Pyright
- GitHub Actions

### Planned future technologies

The approved architecture plans for PostgreSQL with pgvector, infrastructure-
local Sentence Transformers and PyTorch processing, and D3.js visualization.
These are future implementation choices and are not dependencies of the
current application shells.

## Repository structure

```text
.
├── .github/
│   └── workflows/
│       └── ci.yml
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   └── config.py
│   │   └── main.py
│   ├── tests/
│   │   └── test_health.py
│   ├── pyproject.toml
│   ├── README.md
│   └── uv.lock
├── docs/
├── frontend/
│   ├── src/
│   │   ├── App.test.tsx
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── styles.css
│   ├── package.json
│   ├── package-lock.json
│   └── README.md
└── README.md
```

`database/seeds/synthetic/` and `CONTRIBUTING.md` do not yet exist.

## Local development

### Frontend

From `frontend/`:

```bash
npm ci
npm run dev
```

The frontend is available at `http://127.0.0.1:5173`.

Frontend quality and verification commands are:

```bash
npm run lint
npm run format:check
npm run typecheck
npm run test
npm run build
```

Use `npm run format` to format frontend files.

### Backend

From `backend/`:

```bash
uv sync --all-groups --locked
uv run uvicorn app.main:app --reload
```

The backend is available at `http://127.0.0.1:8000`.

The backend quality and verification commands are:

```bash
uv run ruff check .
uv run ruff format --check .
uv run pyright
uv run pytest
```

The backend currently exposes `GET /health` at
`http://127.0.0.1:8000/health`. It reports application availability only; it
does not verify database or external-service connectivity.

## Continuous integration

GitHub Actions runs independent frontend and backend jobs for:

- Pull requests targeting `main`
- Pushes to `main`

The frontend job installs dependencies with `npm ci`, then runs linting,
formatting checks, TypeScript typechecking, tests, and the production build.
The backend job synchronizes the locked uv environment, then runs Ruff linting
and formatting checks, Pyright, and Pytest.

## Architecture and privacy principles

The planned system follows a modular monolith architecture with a React/Vite
frontend and Python/FastAPI backend. User data is intended to remain private,
with ownership and tenant isolation enforced across APIs, persistence, search,
derived data, and graph projections.

The architecture is privacy-first and does not depend on external AI services
by default. Future embedding and graph workers are intended to create
owner-scoped, versioned graph projections with stable graph-node identity,
staged validation, and atomic activation. Manual connections remain distinct
from semantic graph edges. These systems are planned and are not implemented
in the current shells.

## Planning documentation

- [Product Requirements](docs/PRD.md)
- [User Journeys](docs/USER_JOURNEYS.md)
- [Feature Prioritization](docs/FEATURE_PRIORITIZATION.md)
- [Technical Architecture](docs/TECHNICAL_ARCHITECTURE.md)
- [Security and Privacy](docs/SECURITY_AND_PRIVACY.md)
- [Data Model](docs/DATA_MODEL.md)
- [Project Roadmap](docs/PROJECT_ROADMAP.md)
- [Risks and Decisions](docs/RISKS_AND_DECISIONS.md)
- [Phase 0 Architecture Review](docs/PHASE_0_ARCHITECTURE_REVIEW.md)
