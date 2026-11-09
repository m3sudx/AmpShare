<p align="center">
  <img src="docs/ampshare-banner.png" alt="AmpShare: find, book and share EV chargers" width="100%">
</p>

<h1 align="center">AmpShare ⚡</h1>

<p align="center">
  A peer-to-peer EV charging marketplace for Addis Ababa.<br>
  Find a charger nearby, book a time slot, and pay for charging. Or host your own.
</p>

<p align="center">
  <a href="https://amp-share-ivory.vercel.app/"><b>Live demo</b></a>
  ·
  <a href="https://drive.google.com/file/d/1539DAcHtoULHNsDEGId9iECWdEdMYwzi/view?usp=drivesdk"><b>Project presentation</b></a>
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-19-20232a?logo=react&logoColor=61DAFB">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white">
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-PostGIS-4169E1?logo=postgresql&logoColor=white">
  <img alt="Docker" src="https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white">
</p>

---

## Table of contents

- [About](#about)
- [Features](#features)
- [Team](#team)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Verify the setup](#verify-the-setup)
- [Local development ports](#local-development-ports)
- [Client routes](#client-routes)
- [Stop the development environment](#stop-the-development-environment)
- [Team collaboration](#team-collaboration)
- [Roadmap](#roadmap)

## About

**AmpShare** helps electric vehicle drivers discover and reserve chargers hosted by homes and businesses.

Drivers can find nearby chargers, check plug compatibility and prices, reserve time slots, and pay for charging. Hosts can list their chargers, manage availability, and receive payouts.

## Features

**For drivers**
- Find chargers near you on a map, filtered by distance, plug type, power and price
- Check compatibility with your vehicle before you book
- Reserve a time slot with booking conflict protection
- Track charging sessions and history
- Pay with Telebirr

**For hosts**
- List a home or business charger with its price and plug type
- Set weekly availability, pause or delete a listing
- Review and manage booking requests from a host dashboard
- Receive payouts

**Platform**
- Role-based accounts (driver and host) with token authentication
- Geographic queries powered by PostGIS
- Real-time updates with Socket.IO
- Request validation with Zod

## Team

| Name | ID | Role |
|---|---|---|
| Aymen Muhammed | CTC-1544-26 | Fullstack Development |
| Dugomsa Dedefo | CTC-811-26 | Fullstack Development |
| Mesud Ali | CTC-1444-26 | Fullstack Development |
| Nathnael Esatu | CTC-2126-26 | Frontend Development |

## Tech stack

### Frontend (`client/`)
- React 19 with Vite
- TypeScript
- Tailwind CSS
- React Router
- Axios (shared instance with token interceptor)
- TanStack Query
- Lucide React icons
- Leaflet / React-Leaflet

### Backend (`server/`)
- Node.js
- Express
- TypeScript
- PostgreSQL client (`pg`)
- Zod for request validation
- Socket.IO for real-time features

### Database and development
- PostgreSQL
- PostGIS for geographic queries
- Docker and Docker Compose

### Payments
- Telebirr integration

## Project structure

```text
AmpShare/
├── client/                      # React + Vite frontend
│   ├── src/
│   │   ├── components/          # Shared and feature components (bookings, chargers, vehicles)
│   │   ├── context/             # Auth and toast providers
│   │   ├── pages/               # Route pages (auth, chargers, bookings, vehicles)
│   │   ├── routes/              # React Router configuration
│   │   ├── services/            # Axios API functions (one file per backend module)
│   │   ├── types/               # TypeScript types matching API responses
│   │   └── utils/               # Formatting and helper functions
│   ├── Dockerfile               # dev (hot reload) and production (nginx) targets
│   └── nginx.conf
├── server/                      # Express + TypeScript API
│   ├── src/
│   │   ├── config/              # Database configuration
│   │   ├── middleware/          # Validation and error handling
│   │   ├── routes/              # Main API router
│   │   ├── modules/             # Feature modules
│   │   ├── utils/               # Shared utilities
│   │   ├── app.ts               # Express configuration
│   │   └── server.ts            # Server entry point
│   ├── database/
│   │   ├── init/                # Initial database schema
│   │   ├── migrations/          # Future schema migrations
│   │   └── seeds/               # Sample development data
│   ├── tests/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   └── tsconfig.json
├── docs/                        # README images
├── compose.yaml                 # Database, server and client containers
├── .env.example                 # Environment variable template
├── .gitignore
└── README.md
```

## Getting started

### Prerequisites

- Git
- Docker Engine and Docker Compose
- Node.js 22 and npm (only needed to run the client or server outside Docker)

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd AmpShare
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with the repository URL on GitHub.

### 2. Create your environment file

```bash
cp .env.example .env
```

Open `.env` and replace the placeholder database password with your own local development password.

The root `.env` is used by Docker Compose. **Never commit it to GitHub.**

### 3. Start the whole stack

From the repository root:

```bash
docker compose up --build -d
```

Docker Compose starts three separate containers:

| Container | What it runs |
|---|---|
| `db` | PostgreSQL with PostGIS enabled |
| `server` | The AmpShare Express API |
| `client` | The React + Vite frontend (hot reload) |

The database must become healthy before Compose starts the server.

Then open **http://localhost:5173**.

### 4. Check the running containers

```bash
docker compose ps
```

View logs:

```bash
docker compose logs -f server
docker compose logs -f db
```

### Run without Docker (optional)

To run the client or the server directly on your machine, keep the database container running and install dependencies first.

```bash
# Server
cd server
npm ci

# Client
cd client
npm ci
npm run dev
```

Before opening a pull request, check that the client still builds and lints cleanly:

```bash
cd client
npm run build
npm run lint
```

## Environment variables

Defined in `.env.example`. Most have defaults in `compose.yaml`, so you only set them if you change ports or deploy.

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `POSTGRES_PASSWORD` | Yes | none | Password for the local database |
| `POSTGRES_DB` | No | `ampshare` | Database name |
| `POSTGRES_USER` | No | `ampshare` | Database user |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Client origin the API accepts |
| `VITE_API_URL` | No | `http://localhost:3003/api` | API address used by the client |

## Verify the setup

### Test the API

Open the database and API health check: http://localhost:3003/api/health

Expected response:

```json
{
  "success": true,
  "message": "AmpShare API and database are working"
}
```

### Verify PostGIS

```bash
docker compose exec db psql \
  -U ampshare \
  -d ampshare \
  -c "SELECT PostGIS_Full_Version();"
```

The command should return details about the installed PostGIS version.

### Verify database tables

```bash
docker compose exec db sh -c \
  'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\dt"'
```

The initial schema is located at `server/database/init/001_schema.sql`.

It runs automatically when PostgreSQL initializes an empty data directory. Editing this file later does not update an existing database; use migrations for later schema changes.

## Local development ports

| Service | Address |
|---|---|
| React client (Vite) | `http://localhost:5173` |
| Express API | `http://localhost:3003` |
| API health check | `http://localhost:3003/api/health` |
| PostgreSQL from your computer | `localhost:5433` |
| PostgreSQL inside Docker | `db:5432` |

Inside Docker, the server connects to PostgreSQL using the hostname `db` and port `5432`. From your computer, connect to the Docker database at `localhost:5433`.

## Client routes

| Browser route | Page |
|---|---|
| `/chargers/:id/book` | Book a charger (vehicle, date, time, summary) |
| `/bookings` | My bookings, as driver or as host |
| `/bookings/:id` | Booking details |
| `/sessions` | Charging history |
| `/sessions/:id` | Charging session details |
| `/host` | Host dashboard: chargers, pending requests |
| `/host/chargers/new` | Add a charger |
| `/host/chargers/:id/edit` | Edit a charger, set weekly hours, pause or delete |

Host pages require an account with the `HOST` role. There is no endpoint yet that grants it, so for now add it in the database (see `user_roles`) and log in again.

These pages use the existing booking and charging-session endpoints (`/bookings`, `/charging-sessions`) and the shared Axios instance. Booking times are validated by the API in the charger's time zone, and the API remains the authority on who can confirm, cancel, start or finish.

## Stop the development environment

Stop and remove the containers while keeping the database volume:

```bash
docker compose down
```

Start them again:

```bash
docker compose up -d
```

> **Warning:** avoid `docker compose down -v` unless you intentionally want to delete the database volume and all local data.

## Team collaboration

AmpShare is developed collaboratively through GitHub.

### Workflow

1. Pull the latest changes from `main`.
2. Create a feature branch.
3. Implement and test your changes.
4. Commit and push the feature branch.
5. Open a pull request for review.
6. Merge into `main` after approval.

```bash
git switch main
git pull origin main

git switch -c feature/your-feature-name

git add .
git commit -m "feat: describe your change"
git push -u origin feature/your-feature-name
```

### Team rules

- Never commit `.env`, passwords, API keys, or payment credentials.
- Commit `package-lock.json` so everyone installs the same dependency versions.
- Coordinate database schema changes with the team.
- Do not commit `node_modules`, build output, or local database files.
- Test your changes before opening a pull request.
- Keep `main` in a working state.

## Roadmap

- [x] Initialize the Express + TypeScript backend
- [x] Configure database connectivity and a health endpoint
- [x] Add centralized error handling and a main API router
- [x] Design the PostgreSQL + PostGIS schema
- [x] Prepare Docker Compose for the server, database and client
- [x] Implement authentication and user roles
- [x] Implement vehicle management
- [x] Implement charger listings and nearby searches
- [x] Implement recurring schedules and booking conflict protection
- [x] Implement charging sessions
- [x] Integrate Telebirr payments and host payouts
- [x] Build and connect the React frontend
- [x] Add automated tests
- [ ] QR check-in for charging sessions