# Contributing to GymSync

Thanks for your interest in contributing!

## Setup

1. Fork and clone the repo
2. Install dependencies: `npm install`
3. Create `.dev.vars` with your `ANTHROPIC_API_KEY`
4. Run the dev server: `npm run dev`

## Development

```bash
npm run dev          # Start client + worker dev servers
npm run build        # TypeScript check + Vite build
npm run lint         # ESLint
```

## Code Conventions

- TypeScript strict mode
- Functional React components with hooks
- Feature-based folder structure (`src/client/features/`, `src/server/features/`)
- Shared code goes in `shared/` directories
- Tailwind CSS for styling (no CSS modules)
- Hono for server routes

## Pull Requests

1. Create a feature branch from `main`
2. Make your changes
3. Ensure `npm run build` and `npm run lint` pass
4. Open a PR with a clear description of what and why

## Reporting Issues

Open an issue with:
- Steps to reproduce
- Expected vs actual behavior
- Browser / Node version if relevant
