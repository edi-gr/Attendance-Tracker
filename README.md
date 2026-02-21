# Attendance Tracker

An enterprise-grade employee attendance and leave management system built with Next.js 14, Prisma, and PostgreSQL.

## Features

- **Monthly Calendar View** — Mark each working day as WFO, WFH, PL, SL, or OL
- **Holiday Management** — Fixed holidays and optional holidays with scalable year configuration
- **Leave Balance Tracking** — PL (21), SL (12), OL (2) with real-time validation
- **WFO Compliance** — Minimum 6 WFO days per month enforcement
- **User Dashboard** — Yearly summary with month-wise breakdown
- **Admin Dashboard** — View all users, filter, search, and export CSV
- **Email/Password Auth** — Simple sign-up and sign-in with role-based access

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js with Credentials provider (email/password)
- **Date Logic**: date-fns

## Prerequisites

- Node.js 20+
- PostgreSQL database (local, Neon, or Supabase)

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

- `DATABASE_URL` — Your PostgreSQL connection string
- `NEXTAUTH_SECRET` — Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://localhost:3000` for local dev

### 3. Set up the database

```bash
npx prisma db push
```

### 4. Seed holidays and admin user

```bash
npm run db:seed
```

This seeds:

- 10 fixed holidays for 2026
- 12 optional holidays for 2026
- Admin user (email: `f20211247@goa.bits-pilani.ac.in`, password: `admin123`)

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Docker Setup

```bash
docker-compose up -d
```

Then run migrations inside the container:

```bash
docker-compose exec app npx prisma db push
docker-compose exec app npx tsx prisma/seed.ts
```

## Project Structure

```
src/
  app/             — Pages and API routes (App Router)
    calendar/      — Main calendar view
    dashboard/     — User yearly dashboard
    admin/         — Admin dashboard and user detail view
    sign-in/       — Sign-in page
    sign-up/       — Sign-up page
    api/           — REST API endpoints
  components/      — Reusable UI components
  hooks/           — Custom React hooks
  lib/             — Server utilities, auth, validation
  types/           — TypeScript type definitions
prisma/
  schema.prisma    — Database schema
  seed.ts          — Holiday and admin seeder
```

## Adding Holidays for Future Years

To add 2027 holidays, add entries to `prisma/seed.ts` and re-run `npm run db:seed`.
The app automatically handles any year present in the `HolidayCalendar` table.

## Admin Access

Add admin emails to `src/lib/constants.ts` in the `ADMIN_EMAILS` array.
New users who sign up with a listed admin email are automatically granted the ADMIN role.
