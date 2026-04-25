# HevySync

Personal sync tool for [Hevy](https://www.hevyapp.com/). Upload a workout spreadsheet, review the parsed routine draft, edit the details, and push routines to Hevy.

## Features

- Spreadsheet import for `.xlsx`, `.xls`, and `.csv`
- Server-side workbook normalization for multi-sheet and horizontal week layouts
- OpenAI-assisted parsing with deterministic fallback
- Hevy exercise matching and custom exercise creation
- Routine creation and routine/workout editing through Hevy's API
- Cloudflare Pages / Wrangler deployment

## Tech Stack

- Frontend: React 19, React Router, Tailwind CSS, Zustand
- Backend: Hono on Cloudflare Pages Functions
- APIs: Hevy API v1, OpenAI Chat Completions structured JSON output
- Deployment: Wrangler

## Environment

Use two secrets:

| Variable | Description |
|---|---|
| `HEVY_API_KEY` | Hevy developer API key |
| `OPENAI_API_KEY` | OpenAI API key |
| `OPENAI_MODEL` | Optional, defaults to `gpt-5-mini` |
| `HEVY_API_BASE` | Optional, defaults to `https://api.hevyapp.com` |

Existing local aliases are also supported: `HEAVY_API` and `OPENAI_KEY`.

For encrypted dotenvx files, run the app through dotenvx so encrypted values are decrypted before Wrangler starts:

```bash
npm run dev:dotenvx
```

## Development

```bash
npm install
npm run build
npm run dev:dotenvx
```

The Vite client runs on `http://localhost:5173`; the Pages Functions API runs on `http://localhost:8788`.

## Deployment

Set production secrets in Cloudflare:

```bash
wrangler pages secret put HEVY_API_KEY
wrangler pages secret put OPENAI_API_KEY
```

Then build and deploy:

```bash
npm run build
npm run deploy
```

## API Routes

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/setup` | Check server secret configuration |
| `GET` | `/api/hevy/user` | Validate the configured Hevy key |
| `GET` | `/api/hevy/exercises/all` | Load Hevy exercise templates |
| `POST` | `/api/hevy/exercises/custom` | Create a custom Hevy exercise |
| `GET/POST` | `/api/hevy/routines` | List or create routines |
| `GET/PUT` | `/api/hevy/routines/:id` | Read or update a routine |
| `GET/POST` | `/api/hevy/workouts` | List or create workouts |
| `GET/PUT` | `/api/hevy/workouts/:id` | Read or update a workout |
| `GET` | `/api/hevy/workouts/events` | Read Hevy workout sync events |
| `POST` | `/api/imports/parse` | Upload and parse a workout file |
| `POST` | `/api/imports/push-routines` | Create parsed routines in Hevy |

All Hevy API calls use server-side secrets; the browser does not store a Hevy API key.
