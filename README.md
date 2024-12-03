# ☁️ Cloudy

The monorepo for Cloudy, Self-updating tech docs that sync with your codebase. You can access the live product at [usecloudy.com](https://usecloudy.com).

We're a two person bootstrapped team.

We just [launched on PH] (https://www.producthunt.com/posts/cloudy-2) today 12/03/2024. If you see value in what we're building, please support us by upvoting, commenting, and sharing with others. Would mean a lot!



> ⚠️ Although this repo is open source, we are currently not ready for self hosting or have a clear guide on how to run it locally. This is a WIP and we will update this README with instructions on how to run it locally when we are ready.

This monorepo contains the following apps:

- [app](./apps/app) - The SPA React app that runs the main Cloudy frontend.
- [supabase](./apps/supabase) - The database and Postgres functions.
- [web](./apps/web) - The Next.js app that contains the marketing site and the serverless functions hosted on Vercel for the API.

## Getting Started

> ⚠️ Attempt running Cloudy locally or self hosting at your own risk for the time being.

### Prerequisites

1. Node.js 18.x
2. Docker
   1. [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Setup

#### Install Turbo CLI

```bash
npm install -g turbo
```

#### Install Dependencies

```bash
npm install
```

#### Env files

Jenn will give you the env files, some keys will be missing, you'll need to set it up yourself. The local supabase keys will come from the below:

#### Setup Supabase

```bash
cd apps/supabase
npm run dev
```

Supabase will be run in the background. You can access the Supabase dashboard at [http://localhost:54323](http://localhost:54323).
You will need to copy the supabase anon key, and the service role keys which is shown in your terminal.

Put it in the `apps/app/.env.development` and `apps/web/.env` files.

### Run everything in dev mode

```bash
turbo dev
```

### Sync DB

#### Sync from prod db

```bash
npm run db:sync
```

#### Sync from local db

```bash
npm run db:sync:local
```

### Stop Supabase

Because Supabase is run in the background, you'll need to stop it when you're done.

```bash
cd apps/supabase
npm run stop
```
