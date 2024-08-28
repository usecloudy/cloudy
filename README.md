# Cloudy

This is the monorepo for Cloudy.

## Getting Started

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
