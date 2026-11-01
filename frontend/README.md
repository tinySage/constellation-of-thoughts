# Frontend

The frontend is a minimal React and TypeScript application powered by Vite. It
currently provides the responsive visual shell for Constellation of Thoughts;
authentication, journaling, APIs, and constellation visualization are not
implemented yet.

## Requirements

- Node.js 26 LTS
- npm

## Commands

Run these commands from `frontend/`:

```bash
npm install
npm run dev
npm run lint
npm run format:check
npm run typecheck
npm run test
npm run build
```

Use `npm run format` to format the frontend files. The npm lockfile is
committed with this application so installs remain reproducible.

## Design tokens

The shell uses the approved celestial palette:

- Midnight Navy: `#10172B`
- Champagne Gold: `#C9A96E`
- Warm Ivory: `#F4EFE4`
- Deep Space: `#080D19`
- Muted Starlight: `#A7AEC0`
- Dusty Blue: `#64748B`
