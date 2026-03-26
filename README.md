# AI Clipart Generator

Monorepo for the Android-first AI image generation assignment.

- [apps/mobile](/Users/vishalsharma/Desktop/my-app/apps/mobile): Expo Router app with Clerk auth, create flow, results, and profile gallery
- [apps/api](/Users/vishalsharma/Desktop/my-app/apps/api): Fastify API with Prisma/Postgres persistence, protected generation routes, and swappable AI/storage providers
- [packages/shared](/Users/vishalsharma/Desktop/my-app/packages/shared): shared contracts, enums, and validation schemas

## Current Product Flow

`Welcome -> Sign in (optional entry) -> Home -> Create -> Results -> Profile`

The app is now designed around authenticated ownership:

- Clerk handles Google sign-in on mobile
- the backend verifies Clerk bearer tokens
- Postgres stores `User`, `Upload`, `GenerationJob`, `StyleTask`, and `Asset`
- results and profile history are owned by the signed-in Clerk user

## Prerequisites

- Node.js `20.19.4+` recommended
- npm
- PostgreSQL 16
- Android Studio emulator or a physical Android device

## Install

```bash
npm install
```

## Environment Setup

Use two env files.

### 1. Root backend env

Create [/.env](/Users/vishalsharma/Desktop/my-app/.env):

```env
PORT=4000
API_BASE_URL=http://10.0.2.2:4000
CLERK_SECRET_KEY=sk_test_...
AI_PROVIDER=mock
PROMPT_VERSION=v1
REPOSITORY_MODE=prisma
STORAGE_MODE=local
DATABASE_URL="postgresql://<your-user>@localhost:5432/ai_clipart?schema=public"

# Optional real AI
REPLICATE_API_TOKEN=
REPLICATE_MODEL=
REPLICATE_VERSION=
REPLICATE_IMAGE_FIELD=image
REPLICATE_PROMPT_FIELD=prompt

# Optional hosted storage
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=ai-clipart-generator
```

### 2. Mobile Expo env

Create [apps/mobile/.env](/Users/vishalsharma/Desktop/my-app/apps/mobile/.env):

```env
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:4000
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

Notes:

- On the Android emulator, use `http://10.0.2.2:4000` for both mobile and backend-facing local URLs.
- On a physical device, replace both API URLs with your machine's LAN IP, for example `http://192.168.x.x:4000`.

## PostgreSQL + Prisma

If PostgreSQL is not already running:

```bash
brew install postgresql@16
brew services start postgresql@16
createdb ai_clipart
```

Push the schema:

```bash
npm run prisma:push
```

Inspect the database:

```bash
npm run prisma:studio
```

## Run The App

### Terminal 1: API

```bash
npm run dev:api
```

### Terminal 2: Expo

```bash
cd /Users/vishalsharma/Desktop/my-app/apps/mobile
npx expo start --android --host localhost --clear
```

Or from the repo root:

```bash
npm run android
```

## Auth Flow

- The welcome screen can be entered without signing in.
- Clerk sign-in becomes required when the user tries to generate or access account-owned profile/history data.
- On the first authenticated backend request, the API verifies the Clerk token and upserts the user into Postgres.

## Provider Modes

### Development mode

Use:

```env
AI_PROVIDER=mock
STORAGE_MODE=local
REPOSITORY_MODE=prisma
```

This gives:

- real auth
- real Postgres persistence
- local file storage
- mock image generation

### Real AI mode with Replicate

Use:

```env
AI_PROVIDER=replicate
REPLICATE_API_TOKEN=...
REPLICATE_MODEL=<owner>/<model>
```

Optional:

```env
REPLICATE_VERSION=<model-version>
REPLICATE_IMAGE_FIELD=image
REPLICATE_PROMPT_FIELD=prompt
```

The backend will keep the same mobile route contract and switch only the provider implementation.

### Hosted storage mode with Cloudinary

Use:

```env
STORAGE_MODE=cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_FOLDER=ai-clipart-generator
```

This moves original uploads and generated outputs off local disk while keeping Postgres for metadata only.

## Core API Surface

Protected routes:

- `POST /uploads`
- `POST /jobs`
- `GET /jobs/:id`
- `POST /jobs/:id/styles/:style/retry`
- `GET /history`
- `GET /me`

Public route:

- `GET /health`

## Submission Checklist

- Clerk sign-in works on Android
- `/me` creates or updates the Postgres `User`
- prompt screen requires an image and enforces max 4 styles
- `POST /uploads` then `POST /jobs` succeeds
- results screen shows progress, success, retry, share, and download states
- profile screen shows the signed-in user and generated assets
- Replicate works for at least one real model
- Cloudinary serves hosted asset URLs
- README and env setup are sufficient for a reviewer to run the project

## Useful Commands

```bash
npm run typecheck
npm run lint
npm run test
npm run prisma:generate
npm run prisma:push
npm run prisma:studio
```
