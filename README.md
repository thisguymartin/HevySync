# GymSync

Bridge between your trainer's workout spreadsheets and the [Hevy](https://www.hevyapp.com/) workout tracker. Upload a program, let AI parse it, and push routines directly to Hevy.

## Features

- **Spreadsheet Upload** — Drop an `.xlsx` / `.csv` file and AI extracts exercises, sets, reps, and weights
- **Workout Generator** — Describe your goals and get an AI-generated program matched to Hevy exercise templates
- **Hevy Integration** — Browse workouts, routines, and history; push parsed programs as Hevy routines
- **Exercise Matching** — Fuzzy-matches exercise names to Hevy's template library with confidence scores

## Tech Stack

- **Frontend:** React 19, React Router, Tailwind CSS, Zustand
- **Backend:** Hono (on Cloudflare Workers / Pages)
- **AI:** Anthropic Claude (Haiku 4.5)
- **APIs:** Hevy API v1

## Prerequisites

- Node.js 18+
- A [Cloudflare](https://dash.cloudflare.com/) account (for deployment)
- A [Hevy API key](https://www.hevyapp.com/)
- An [Anthropic API key](https://console.anthropic.com/)

## Quick Start

```bash
git clone https://github.com/thisguymartin/GymSync.git
cd GymSync
npm install
```

Create a `.dev.vars` file for local development:

```
ANTHROPIC_API_KEY=your-anthropic-api-key-here
```

Run the dev server:

```bash
npm run dev
```

The client runs on `http://localhost:5173` and the API on `http://localhost:8788`.

Enter your Hevy API key in the Settings page within the app.

## Environment Variables

| Variable | Where | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | `.dev.vars` / CF secret | Anthropic API key for Claude |
| `HEVY_API_BASE` | `wrangler.toml` | Hevy API base URL (default: `https://api.hevyapp.com`) |

## Deployment

Deploy to Cloudflare Pages:

```bash
npm run build
npm run deploy
```

Set `ANTHROPIC_API_KEY` as a secret in the Cloudflare dashboard.

## Project Structure

```
src/
├── client/                  # React frontend
│   ├── features/
│   │   ├── workouts/        # Browse Hevy workouts
│   │   ├── routines/        # Browse Hevy routines
│   │   ├── history/         # Workout history & stats
│   │   ├── upload/          # Spreadsheet upload & parse flow
│   │   ├── generator/       # AI workout generator
│   │   └── settings/        # API key configuration
│   └── shared/              # Shared components, hooks, stores, types
├── server/                  # Hono API (Cloudflare Workers)
│   ├── features/
│   │   ├── hevy/            # Hevy API client & routes
│   │   ├── parse/           # AI spreadsheet parsing
│   │   └── generator/       # AI workout generation
│   └── shared/              # Shared types & utilities
```

## API Routes

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/hevy/exercises` | List exercise templates |
| `GET` | `/api/hevy/workouts` | List workouts |
| `POST` | `/api/hevy/workouts` | Create a workout |
| `GET` | `/api/hevy/routines` | List routines |
| `POST` | `/api/hevy/routines` | Create a routine |
| `PUT` | `/api/hevy/routines/:id` | Update a routine |
| `POST` | `/api/parse` | Parse spreadsheet with AI |
| `POST` | `/api/generate` | Generate workout plan with AI |

All `/api/hevy/*` routes require the `x-hevy-api-key` header.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
