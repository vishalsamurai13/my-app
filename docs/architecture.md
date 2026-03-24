# Architecture Notes

## Mobile

- Expo Router controls the app flow: home -> preview -> results -> history.
- Zustand stores device identity and current draft selection.
- React Query owns remote job and history state.
- Feature folders keep UI and logic grouped by product flow.

## API

- Fastify exposes upload, job, history, and health routes.
- `JobOrchestrator` processes styles asynchronously and persists per-style progress.
- `FileRepository` is the local development fallback.
- Prisma schema models the production PostgreSQL path for `Device`, `Upload`, `GenerationJob`, `StyleTask`, and `Asset`.

## Shared

- `@ai-clipart/shared` exports style enums, job state types, and Zod contracts.
- Mobile and API both validate against the same request/response shapes to prevent drift.
