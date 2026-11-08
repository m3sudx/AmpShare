# AmpShare ⚡

**AmpShare** is a peer-to-peer EV charging marketplace that helps electric vehicle drivers discover and reserve chargers hosted by homes and businesses.

Drivers can find nearby chargers, check charging compatibility and prices, reserve time slots, and pay for charging. Hosts can list their chargers, manage availability, and receive payouts.

## Resources

- [Project Live Presentation](https://drive.google.com/file/d/1539DAcHtoULHNsDEGId9iECWdEdMYwzi/view?usp=drivesdk)

## Team

| Name | ID | Role |
|---|---|---|
| Aymen Muhammed | CTC-1544-26 | Fullstack Development |
| Dugomsa Dedefo | CTC-811-26 | Fullstack Development |
| Mesud Ali | CTC-1444-26 | Fullstack Development |
| Nathnael Esatu | CTC-2126-26 | Frontend Development |

## Tech Stack

### Frontend (`client/`)
- React 19 with Vite
- TypeScript
- Tailwind CSS
- React Router
- Axios (shared instance with token interceptor)
- TanStack Query
- Lucide React icons
- Leaflet / React-Leaflet

### Backend
- Node.js
- Express
- TypeScript
- PostgreSQL client (`pg`)
- Zod for request validation
- Socket.IO (for real-time features)

### Database and Development
- PostgreSQL
- PostGIS for geographic queries
- Docker
- Docker Compose

### Payments
- Telebirr Integration

## 📁 Project Structure

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
├── compose.yaml                 # Backend and database containers
├── .env.example                 # Environment variable template
├── .gitignore
└── README.md
```

## Prerequisites

Install the following before starting development:

- Git
- Docker Engine
- Docker Compose
- Node.js 22 and npm (only needed to run the frontend or backend outside Docker)


## Local Setup

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

The root `.env` is used by Docker Compose. Never commit it to GitHub.

### 3. Install backend dependencies

```bash
cd server
npm ci
cd ..
```

This uses the committed `package-lock.json` to install the backend dependencies consistently.

### 4. Start the backend and database

From the repository root:

```bash
docker compose up --build -d
```

Docker Compose starts three separate containers:

- `server`: the AmpShare Express API
- `db`: PostgreSQL with PostGIS enabled
- `client`: the React + Vite frontend (hot reload)

The database must become healthy before Compose starts the backend.

To run the frontend outside Docker instead:

```bash
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

### 5. Check the running containers

```bash
docker compose ps
```

View backend logs:

```bash
docker compose logs -f server
```

View database logs:

```bash
docker compose logs -f db
```

##  Verify the Setup

### Test the API

Open:

- Database and API health check: http://localhost:3003/api/health


Expected successful response:

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

The initial schema is located at:

`server/database/init/001_schema.sql`

It is executed automatically when PostgreSQL initializes an empty data directory. Editing this file later does not automatically update an existing database; use migrations for subsequent schema changes.

## 🔌 Local Development Ports

| Service | Address |
|---|---|
| React client (Vite) | `http://localhost:5173` |
| Express API | `http://localhost:3003` |
| API health check | `http://localhost:3003/api/health` |
| PostgreSQL from your computer | `localhost:5433` |
| PostgreSQL inside Docker | `db:5432` |

Inside Docker, the backend connects to PostgreSQL using the hostname `db` and port `5432`.

When connecting from your computer to the Docker database, use `localhost:5433`.

The client reads the API address from `VITE_API_URL` (default `http://localhost:3003/api`), and the API allows the client origin through `CORS_ORIGIN` (default `http://localhost:5173`). Both have defaults in `compose.yaml`, so you only set them in `.env` if you change ports or deploy.

## Client Routes: Bookings and Charging Sessions

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

## 🛑 Stop the Development Environment

Stop and remove the containers while preserving the named database volume:

```bash
docker compose down
```

Start them again:

```bash
docker compose up -d
```

**Warning:** Avoid `docker compose down -v` unless you intentionally want to delete the database volume and its local data.

## Team Collaboration

AmpShare is developed collaboratively through GitHub.

### Workflow

1. Pull the latest changes from `main`.
2. Create a feature branch.
3. Implement and test your changes.
4. Commit and push the feature branch.
5. Open a pull request for review.
6. Merge into `main` after approval.

Example:

```bash
git switch main
git pull origin main

git switch -c feature/your-feature-name

git add .
git commit -m "feat: describe your change"
git push -u origin feature/your-feature-name
```

### Important Team Rules

- Never commit `.env`, passwords, API keys, or payment credentials.
- Commit `package-lock.json` so everyone can install the same dependency versions.
- Coordinate database schema changes with the team.
- Do not commit `node_modules`, build output, or local database files.
- Test your changes before opening a pull request.
- Keep `main` in a working state.

##  Project Roadmap

- [x] Initialize the Express + TypeScript backend
- [x] Configure database connectivity and a health endpoint
- [x] Add centralized error handling and a main API router
- [x] Design the PostgreSQL + PostGIS schema
- [x] Prepare Docker Compose for the backend, database and client
- [x] Implement authentication and user roles
- [x] Implement vehicle management
- [x] Implement charger listings and nearby searches
- [x] Implement recurring schedules and booking conflict protection
- [x] Implement charging sessions and QR check-in (sessions done; QR check-in pending)
- [x] Integrate Telebirr payments and host payouts
- [x] Build and connect the React frontend (auth, vehicles, chargers, bookings and charging sessions in progress)
- [x] Add automated tests
