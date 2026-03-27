# AI Clipart Generator

AI Clipart Generator is an Android-first mobile app that takes a user-uploaded portrait and generates multiple stylized AI variations. The repo is a monorepo with an Expo mobile app, a Fastify API, Prisma/PostgreSQL persistence, Clerk authentication, Replicate generation, and Cloudinary asset hosting.

## Product Flow

The current user journey is:

`Welcome -> Home -> Create -> Results -> Profile`

Core product behaviors:

- welcome screen with guest and signed-in states
- Google sign-in with Clerk
- portrait upload from camera or gallery
- style selection with up to 4 styles per generation
- image generation through Replicate
- per-style polling and retry in the results screen
- public sharing through Cloudinary-backed URLs
- device gallery save on Android
- generation history and editable profile metadata persisted in PostgreSQL

Supported styles:

- Cartoon
- Anime
- Illustration
- Pixel
- Sketch
- Fantasy
- Comic
- Watercolor

## Monorepo Structure

- [apps/mobile](/Users/vishalsharma/Desktop/my-app/apps/mobile): Expo Router app
- [apps/api](/Users/vishalsharma/Desktop/my-app/apps/api): Fastify backend, auth, orchestration, Prisma repository, providers
- [packages/shared](/Users/vishalsharma/Desktop/my-app/packages/shared): shared schemas, enums, contracts, validators

## Tech Stack

### Mobile

- Expo SDK 54
- React Native 0.81
- Expo Router
- Clerk Expo SDK
- TanStack Query
- Zustand
- NativeWind
- Expo Image
- Expo Image Picker
- Expo Media Library
- Expo Sharing

### Backend

- Fastify
- Clerk backend SDK
- Prisma
- PostgreSQL
- Replicate
- Cloudinary
- Zod

## Architecture

### Authentication Flow

1. The mobile app signs the user in through Clerk Google OAuth.
2. The mobile app sends the Clerk bearer token to protected backend routes.
3. The API verifies the token, resolves the Clerk user, and upserts the local `User` record.
4. App-owned profile fields such as `displayName` and `dateOfBirth` are stored in Postgres and exposed through `/me`.

### Generation Flow

1. The user uploads an image in the mobile app.
2. The mobile app sends the original image to `POST /uploads`.
3. The mobile app creates a job with `POST /jobs`.
4. The backend creates a `GenerationJob` with child `StyleTask` records.
5. The results screen polls `GET /jobs/:jobId`.
6. Successful outputs are stored as `Asset` records and linked back to their style tasks.
7. The profile screen reads the user gallery through `GET /history`.

### Storage And Persistence

Metadata lives in PostgreSQL:

- `User`
- `Upload`
- `GenerationJob`
- `StyleTask`
- `Asset`

Binary assets live in storage:

- `STORAGE_MODE=local` for local file storage in development
- `STORAGE_MODE=cloudinary` for hosted public asset URLs

### Sharing And Downloads

- public sharing uses `POST /share/:assetId`
- the backend verifies that the selected asset belongs to the signed-in user
- the API returns a public URL for the generated image
- the mobile app uses the native share sheet with that URL
- downloads save the selected result to the device gallery through Expo Media Library

## Mobile Screens

- [apps/mobile/app/welcome.tsx](/Users/vishalsharma/Desktop/my-app/apps/mobile/app/welcome.tsx)
  - guest CTA state
  - signed-in greeting state
  - auth-aware auto-transition into the tab shell
- [apps/mobile/app/sign-in.tsx](/Users/vishalsharma/Desktop/my-app/apps/mobile/app/sign-in.tsx)
  - Clerk Google sign-in entry
- [apps/mobile/app/(tabs)/_layout.tsx](/Users/vishalsharma/Desktop/my-app/apps/mobile/app/(tabs)/_layout.tsx)
  - custom bottom tab shell
- [apps/mobile/app/(tabs)/index.tsx](/Users/vishalsharma/Desktop/my-app/apps/mobile/app/(tabs)/index.tsx)
  - home screen
  - hero card
  - trending style previews
- [apps/mobile/app/create.tsx](/Users/vishalsharma/Desktop/my-app/apps/mobile/app/create.tsx)
  - prompt input
  - image preview/upload
  - style selection
  - shape selection
  - generation entry point
- [apps/mobile/app/results/[jobId].tsx](/Users/vishalsharma/Desktop/my-app/apps/mobile/app/results/[jobId].tsx)
  - large active preview
  - per-style preview strip
  - shimmer loading state
  - retry/share/download actions
- [apps/mobile/app/(tabs)/profile.tsx](/Users/vishalsharma/Desktop/my-app/apps/mobile/app/(tabs)/profile.tsx)
  - profile header
  - editable profile settings
  - generation gallery

## Backend Routes

### Public

- `GET /health`

### Authenticated

- `POST /uploads`
- `POST /jobs`
- `GET /jobs/:jobId`
- `POST /jobs/:jobId/styles/:style/retry`
- `GET /history`
- `GET /me`
- `PATCH /me`
- `POST /share/:assetId`

### Route Summary

- `POST /uploads`
  - stores the original uploaded image
  - creates the `Upload` row
- `POST /jobs`
  - accepts `uploadId`, `styles`, optional `prompt`, optional `shape`
  - creates the generation job
- `GET /jobs/:jobId`
  - returns per-style status, asset metadata, and URLs
- `POST /jobs/:jobId/styles/:style/retry`
  - retries only a failed style
- `GET /history`
  - returns user-owned jobs for the profile/gallery view
- `GET /me`
  - returns Clerk-backed identity fields plus app-owned profile fields
- `PATCH /me`
  - saves editable profile fields such as `displayName` and `dateOfBirth`
- `POST /share/:assetId`
  - validates ownership and returns a shareable public URL

## Shared Contracts

[packages/shared](/Users/vishalsharma/Desktop/my-app/packages/shared) is the source of truth for:

- style enums
- shape enums
- generation job response schema
- history response schema
- profile response/update schema
- share response schema

The mobile app and API should stay aligned through these shared types rather than ad hoc request shapes.

## Environment Setup

Use two env files.

### 1. Root backend env

Create [/.env](/Users/vishalsharma/Desktop/my-app/.env):

```env
PORT=4000
API_BASE_URL=http://10.0.2.2:4000

CLERK_SECRET_KEY=sk_test_...

AI_PROVIDER=replicate
PROMPT_VERSION=v1

REPOSITORY_MODE=prisma
DATABASE_URL="postgresql://<your-user>@localhost:5432/ai_clipart?schema=public"

STORAGE_MODE=cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=ai-clipart-generator

REPLICATE_API_TOKEN=
REPLICATE_MODEL=black-forest-labs/flux-kontext-pro
REPLICATE_VERSION=4e8d527dd58f382067616cd3ce85e6d9ff4d5ce512cc055f2cb78300ad21e27a
REPLICATE_IMAGE_FIELD=input_image
REPLICATE_PROMPT_FIELD=prompt
```

### 2. Mobile Expo env

Create [apps/mobile/.env](/Users/vishalsharma/Desktop/my-app/apps/mobile/.env):

```env
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:4000
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

### Env Notes

- `10.0.2.2` is the Android emulator bridge back to your machine.
- On a physical device, replace both API base URLs with your LAN IP.
- Keep backend secrets only in the root `.env`.
- Do not duplicate `DATABASE_URL` across root and `apps/api/.env` unless you intentionally want Prisma commands to load from that location.
- Rotate any secret that was ever exposed.

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Start PostgreSQL on macOS

```bash
brew install postgresql@16
brew services start postgresql@16
createdb ai_clipart
```

### 3. Generate Prisma client

```bash
npm run prisma:generate
```

### 4. Push the schema

```bash
npm run prisma:push
```

### 5. Open Prisma Studio

```bash
npm run prisma:studio
```

### 6. Start the backend

```bash
npm run dev:api
```

### 7. Start the mobile app

From the repo root:

```bash
npm run android
```

Or directly from the mobile app:

```bash
cd /Users/vishalsharma/Desktop/my-app/apps/mobile
npx expo start --android --host localhost --clear
```

## Provider Modes

### Mock Mode

Use this when you want to work on UI and persistence without spending AI credits:

```env
AI_PROVIDER=mock
STORAGE_MODE=local
REPOSITORY_MODE=prisma
```

### Replicate Mode

Use Replicate for real image generation:

```env
AI_PROVIDER=replicate
REPLICATE_API_TOKEN=...
REPLICATE_MODEL=black-forest-labs/flux-kontext-pro
REPLICATE_VERSION=4e8d527dd58f382067616cd3ce85e6d9ff4d5ce512cc055f2cb78300ad21e27a
REPLICATE_IMAGE_FIELD=input_image
REPLICATE_PROMPT_FIELD=prompt
```

`black-forest-labs/flux-kontext-pro` fits the current image-first product because it accepts both a prompt and an input image.

### Cloudinary Mode

Use Cloudinary for public hosted asset URLs:

```env
STORAGE_MODE=cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_FOLDER=ai-clipart-generator
```

Cloudinary mode is required for:

- public share URLs
- hosted result previews outside localhost
- consistent share behavior across devices

## Profile Data Model

The app currently has two profile layers.

### Identity fields synced from Clerk

- `clerkUserId`
- `email`
- `firstName`
- `lastName`
- `imageUrl`

### App-owned profile fields stored in Postgres

- `displayName`
- `dateOfBirth`

Clerk remains the identity source. The API stores app-specific profile metadata through `/me`.

## Useful Commands

### Root

```bash
npm install
npm run dev:api
npm run android
npm run lint
npm run typecheck
npm run test
npm run prisma:generate
npm run prisma:push
npm run prisma:studio
```

### Mobile

```bash
npm run start --workspace @ai-clipart/mobile
npm run android --workspace @ai-clipart/mobile
npm run lint --workspace @ai-clipart/mobile
npm run typecheck --workspace @ai-clipart/mobile
```

### API

```bash
npm run dev --workspace @ai-clipart/api
npm run lint --workspace @ai-clipart/api
npm run typecheck --workspace @ai-clipart/api
npm run test --workspace @ai-clipart/api
```

## Verification Checklist

Use this after setup or after a large change:

- sign in with Google
- confirm `GET /me` creates or updates the `User` row
- open Profile and save `displayName` and `dateOfBirth`
- upload an image from camera or gallery
- choose up to 4 styles
- create a generation job
- watch the results screen poll until styles complete
- retry a failed style if needed
- save one result to the gallery
- share one result and open the shared URL externally
- confirm jobs appear in the Profile gallery

## Troubleshooting

### Prisma says `DATABASE_URL` is missing

Run Prisma commands from the repo root so the root [.env](/Users/vishalsharma/Desktop/my-app/.env) is loaded:

```bash
npm run prisma:push
```

### Prisma Studio says env vars conflict

Do not define `DATABASE_URL` in both:

- [/.env](/Users/vishalsharma/Desktop/my-app/.env)
- [apps/api/.env](/Users/vishalsharma/Desktop/my-app/apps/api/.env)

The recommended location is the root `.env`.

### Expo Go is showing stale screens

Reset Metro and Watchman:

```bash
watchman watch-del '/Users/vishalsharma/Desktop/my-app'
watchman watch-project '/Users/vishalsharma/Desktop/my-app'
cd /Users/vishalsharma/Desktop/my-app/apps/mobile
npx expo start --android --host localhost --clear
```

### Android emulator cannot reach the API

Use:

```env
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:4000
API_BASE_URL=http://10.0.2.2:4000
```

### Clerk publishable or secret key is missing

- mobile must read `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` from `apps/mobile/.env`
- backend must read `CLERK_SECRET_KEY` from the root `.env`

### Share links are not public

Check all of the following:

- `STORAGE_MODE=cloudinary`
- valid Cloudinary credentials
- newly generated assets were created after Cloudinary mode was enabled

### Downloads fail on device

Check:

- media-library permission was granted
- the selected result has a valid remote URL
- Cloudinary URL is reachable from the device/emulator

### Replicate throttles or fails some styles

This can happen during burst testing. The backend normalizes transient provider issues, but you should still:

- reduce rapid repeated test batches
- wait for rate limits to reset
- verify the Replicate model and input fields in `.env`

## Known Constraints

- The app is optimized for Android-first use.
- Public sharing depends on Cloudinary-backed asset URLs.
- Real image generation depends on valid Replicate configuration and quota.
- The custom tab shell is intentionally simple to prioritize stable scrolling and touch behavior over heavier blur/glass effects.

## Final Notes

- The mobile app and backend are contract-coupled through [packages/shared](/Users/vishalsharma/Desktop/my-app/packages/shared).
- If you change Prisma models, re-run:

```bash
npm run prisma:generate
npm run prisma:push
```

- If you change auth or env setup, restart both the backend and Expo.
