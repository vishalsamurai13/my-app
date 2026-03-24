# AI Clipart Generator

Workspace monorepo for the Android assignment deliverable:

- `apps/mobile`: Expo Router app for image upload, generation, results, history, download, and share.
- `apps/api`: Fastify API for uploads, async generation jobs, history, and local asset serving.
- `packages/shared`: shared contracts, enums, and validators used by both app and API.

## Run

1. Install dependencies:

```bash
npm install
```

2. Start the API:

```bash
npm run dev:api
```

3. Start the mobile app:

```bash
npm run dev:mobile
```

4. Launch Android:

```bash
npm run android
```

## Environment

Create `.env` in the repo root or under `apps/api/` with:

```bash
PORT=4000
API_BASE_URL=http://10.0.2.2:4000
STORAGE_MODE=local
```

For Android emulator access, keep both the mobile app API URL and the backend `API_BASE_URL` on `http://10.0.2.2:4000`. If you later test on a physical device, switch both to your machine's LAN IP.

## Notes

- The API currently uses a local file storage + mock AI provider fallback so the assignment can run end-to-end without external services.
- Prisma schema and client generation are included for the production Postgres path.
- Verified locally with `npm run typecheck`, `npm run lint`, `npm test`, and `npm run prisma:generate`.
