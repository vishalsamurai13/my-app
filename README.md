# AI Clipart Generator

AI Clipart Generator is an Android-first mobile application for turning an uploaded portrait into multiple stylized AI variations. The product is built as a monorepo with an Expo React Native app, a Fastify backend, Prisma/PostgreSQL persistence, Clerk authentication, Replicate image generation, and Cloudinary asset hosting.

## What The App Does

The user flow is:

`Welcome -> Home -> Prompt/Create -> Results -> Profile`

Core behaviors:

- optional entry through the welcome screen
- Google sign-in with Clerk
- upload a portrait from camera or gallery
- select up to 4 styles per generation batch
- create AI outputs for styles such as Cartoon, Anime, Illustration, Pixel, Sketch, Fantasy, Comic, and Watercolor
- poll generation progress in the results screen
- retry failed styles
- save generated images to the device gallery
- share generated images through public Cloudinary-backed URLs
- persist generation history and user profile data in PostgreSQL

## Monorepo Structure

- [apps/mobile](/Users/vishalsharma/Desktop/my-app/apps/mobile): Expo Router mobile app
- [apps/api](/Users/vishalsharma/Desktop/my-app/apps/api): Fastify API, generation orchestration, Prisma repository, auth verification
- [packages/shared](/Users/vishalsharma/Desktop/my-app/packages/shared): shared enums, schemas, and contract types

## Tech Stack

### Mobile

- Expo SDK 54
- React Native 0.81
- Expo Router
- Clerk Expo SDK
- TanStack Query
- Zustand
- NativeWind
- Expo Image, Image Picker, Media Library, Sharing

### Backend

- Fastify
- Clerk backend SDK
- Prisma
- PostgreSQL
- Replicate
- Cloudinary
- Zod

## Product Architecture

### Authentication

- mobile signs in with Clerk using Google
- the mobile app sends a Clerk bearer token to protected backend routes
- the backend verifies the token and resolves the Clerk user
- on authenticated requests, the backend upserts the local `User` record in Postgres

### Generation Flow

1. The user selects an image and styles in the mobile app.
2. The mobile app uploads the original image with `POST /uploads`.
3. The mobile app creates a generation job with `POST /jobs`.
4. The backend creates `StyleTask` records and runs the orchestrator asynchronously.
5. The results screen polls `GET /jobs/:jobId`.
6. Completed assets are stored and linked back to the job.
7. The profile screen reads history through `GET /history`.

### Persistence

Metadata lives in PostgreSQL:

- `User`
- `Upload`
- `GenerationJob`
- `StyleTask`
- `Asset`

Binary files live in storage:

- local disk in development if `STORAGE_MODE=local`
- Cloudinary in hosted/public mode if `STORAGE_MODE=cloudinary`

## Mobile Screens

- [apps/mobile/app/welcome.tsx](/Users/vishalsharma/Desktop/my-app/apps/mobile/app/welcome.tsx)
  - branded welcome/onboarding screen
- [apps/mobile/app/sign-in.tsx](/Users/vishalsharma/Desktop/my-app/apps/mobile/app/sign-in.tsx)
  - Clerk sign-in entry
- [apps/mobile/app/(tabs)/_layout.tsx](/Users/vishalsharma/Desktop/my-app/apps/mobile/app/(tabs)/_layout.tsx)
  - custom bottom tab shell
- [apps/mobile/app/(tabs)/index.tsx](/Users/vishalsharma/Desktop/my-app/apps/mobile/app/(tabs)/index.tsx)
  - home screen with generator hero card and style preview cards
- [apps/mobile/app/create.tsx](/Users/vishalsharma/Desktop/my-app/apps/mobile/app/create.tsx)
  - prompt, image upload, style selection, shape selection
- [apps/mobile/app/results/[jobId].tsx](/Users/vishalsharma/Desktop/my-app/apps/mobile/app/results/[jobId].tsx)
  - result preview, retry, share, download
- [apps/mobile/app/(tabs)/profile.tsx](/Users/vishalsharma/Desktop/my-app/apps/mobile/app/(tabs)/profile.tsx)
  - profile info, editable app metadata, saved generation gallery

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

### Route Notes

- `POST /uploads`
  - stores the original uploaded image
  - creates the `Upload` row
- `POST /jobs`
  - accepts `uploadId`, `styles`, optional `prompt`, optional `shape`
  - creates the job and enqueues generation
- `GET /jobs/:jobId`
  - returns per-style independent status and asset URLs
- `POST /jobs/:jobId/styles/:style/retry`
  - retries only failed styles
- `GET /history`
  - returns user-owned jobs for the profile gallery
- `GET /me`
  - returns merged Clerk-backed identity plus app-owned profile metadata
- `PATCH /me`
  - persists editable fields such as `displayName` and `dateOfBirth`
- `POST /share/:assetId`
  - validates ownership and returns a public share URL for the selected asset

## Shared Contract Notes

The shared contract in [packages/shared](/Users/vishalsharma/Desktop/my-app/packages/shared) is the source of truth for:

- style enums
- shape enums
- job response schema
- profile response schema
- profile update schema
- share response schema

This keeps the mobile app and backend in sync.

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

- On the Android emulator, `10.0.2.2` points back to your Mac.
- On a real device, replace both API URLs with your machine’s LAN IP.
- Never commit real secrets.
- If secrets were exposed accidentally, rotate them.

## Local Database Setup

This project expects PostgreSQL.

### Install And Start PostgreSQL On macOS

```bash
brew install postgresql@16
brew services start postgresql@16
createdb ai_clipart
```

### Generate Prisma Client

```bash
npm run prisma:generate
```

### Push The Schema

```bash
npm run prisma:push
```

### Open Prisma Studio

```bash
npm run prisma:studio
```

## Running The App

### 1. Install dependencies

```bash
npm install
```

### 2. Start the backend

```bash
npm run dev:api
```

### 3. Start the mobile app

```bash
cd /Users/vishalsharma/Desktop/my-app/apps/mobile
npx expo start --android --host localhost --clear
```

Or from root:

```bash
npm run android
```

## Provider Modes

### Mock Mode

Use this when you want to develop UI and persistence without spending API credits:

```env
AI_PROVIDER=mock
STORAGE_MODE=local
REPOSITORY_MODE=prisma
```

### Real AI Mode

Use Replicate for real image generation:

```env
AI_PROVIDER=replicate
REPLICATE_API_TOKEN=...
REPLICATE_MODEL=black-forest-labs/flux-kontext-pro
REPLICATE_VERSION=4e8d527dd58f382067616cd3ce85e6d9ff4d5ce512cc055f2cb78300ad21e27a
REPLICATE_IMAGE_FIELD=input_image
REPLICATE_PROMPT_FIELD=prompt
```

`flux-kontext-pro` fits the current image-first product because it accepts both a prompt and an input image.

### Cloudinary Mode

Use public asset hosting:

```env
STORAGE_MODE=cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_FOLDER=ai-clipart-generator
```

Cloudinary mode is recommended for:

- real public sharing
- public preview URLs
- avoiding localhost-only asset links

## Profile Data Model

The app has two profile layers:

### Identity fields from Clerk

- `clerkUserId`
- `email`
- `firstName`
- `lastName`
- `imageUrl`

### App-owned profile fields in Postgres

- `displayName`
- `dateOfBirth`

The backend syncs Clerk identity fields automatically and stores editable app metadata in Postgres through `PATCH /me`.

## Style System

The app currently supports:

- Cartoon
- Anime
- Illustration
- Pixel
- Sketch
- Fantasy
- Comic
- Watercolor

Style prompts are generated server-side in the Replicate provider so each style has a tuned prompt preset instead of relying only on raw user text.

## Public Sharing

With `STORAGE_MODE=cloudinary`, generated assets are public URLs. The share flow is:

1. Mobile selects the active generated asset.
2. Mobile calls `POST /share/:assetId`.
3. The backend verifies that the asset belongs to the signed-in user.
4. The backend returns a public share URL.
5. The mobile app opens the native share sheet with that URL.

This means shared links can be opened on other devices and browsers, as long as the asset is publicly hosted.

## Saving To Device Gallery

Downloads are handled on mobile with Expo Media Library:

- the app requests media library permission
- the selected generated image is downloaded to cache
- the file is saved to the user’s gallery
- the app tries to place it into an `AI Clipart Generator` album

## Useful Commands

### Root

```bash
npm install
npm run dev:api
npm run android
npm run typecheck
npm run lint
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

Use this to verify the whole app after setup:

- sign in with Google
- confirm `GET /me` creates or updates the `User` row
- open Profile and save `displayName` and `dateOfBirth`
- upload an image from camera or gallery
- select up to 4 styles
- create a job
- watch the results screen poll until assets are generated
- retry failed styles if needed
- save one result to the gallery
- share one result and open the shared link externally
- confirm generated jobs appear in the Profile gallery

## Troubleshooting

### Prisma says `DATABASE_URL` is missing

Run Prisma commands from the repo root so the root [.env](/Users/vishalsharma/Desktop/my-app/.env) is loaded:

```bash
npm run prisma:push
```

### Prisma Studio complains about env conflicts

Do not define `DATABASE_URL` in both:

- [/.env](/Users/vishalsharma/Desktop/my-app/.env)
- [apps/api/.env](/Users/vishalsharma/Desktop/my-app/apps/api/.env)

Keep it in one place only. The recommended location is the root `.env`.

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

### Share links are not public

Make sure:

- `STORAGE_MODE=cloudinary`
- Cloudinary credentials are valid
- newly generated assets are being created after Cloudinary mode is enabled

### Replicate throttles or fails some styles

This is expected during rapid testing. The backend already includes:

- automatic backoff for rate limiting
- one retry for transient provider failures
- cleaner error normalization for mobile

If failures persist:

- reduce test burst volume
- wait for rate limits to reset
- verify the Replicate model input fields in `.env`

## Final Notes

- This project is optimized for Android-first evaluation.
- The mobile app and backend share a strict contract through [packages/shared](/Users/vishalsharma/Desktop/my-app/packages/shared).
- Real AI generation, public sharing, and persisted profile metadata all depend on correct env configuration.
- If you change Prisma schema fields, re-run:

```bash
npm run prisma:generate
npm run prisma:push
```
