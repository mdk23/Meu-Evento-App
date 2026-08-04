# Meu Evento App

An event-venue booking and operations platform: manage client bookings, event execution (services, suppliers, guests, tasks), and finances (payments, expenses) for a venue business.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router)
- [Prisma](https://www.prisma.io) + PostgreSQL, hosted on [Neon](https://neon.tech)
- [TanStack Query](https://tanstack.com/query) for client-side data fetching
- Tailwind CSS v4, Radix UI, Framer Motion

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your Neon connection strings:

   ```bash
   cp .env.example .env
   ```

3. Generate the Prisma client and push the schema to your database:

   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. Seed demo data (creates a demo tenant, space, clients, services, etc. — only runs if the database has no tenants yet):

   ```bash
   curl -X POST http://localhost:3000/api/seed
   ```

   (start the dev server first, see next step)

5. Run the development server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Pooled Neon Postgres connection string, used at runtime |
| `DIRECT_URL` | Direct (non-pooled) Neon connection string, used by Prisma for migrations/schema push |

## Project structure

- `src/app/**` — pages and API routes (App Router)
- `src/lib/services/*.service.ts` — business logic, called from API routes
- `src/lib/repositories/*.repository.ts` — Prisma query layer
- `src/lib/prisma.ts` — Prisma client singleton
- `src/types/dtos.ts` — response shapes returned by API routes to the client
- `prisma/schema.prisma` — database schema
