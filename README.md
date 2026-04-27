# e-PMS — Electronic Performance Management System

A complete, production-ready **role-based HR performance appraisal system** featuring a modern, minimalist coffee/beige UI. Built to streamline the entire performance review lifecycle — from KPA goal setting through multi-level officer approvals to final HR sign-off — across an organization.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, React Router 6, Axios |
| Backend | Node.js 20, Express 4, Prisma ORM 5 |
| Database | PostgreSQL 16 |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| DevOps | Docker, Docker Compose, Nginx (reverse proxy) |
| Extras | Helmet, express-rate-limit, Morgan, node-cron, ExcelJS, PDFKit, Nodemailer |

---

## System Architecture

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   Browser    │──:8080──▶│  Nginx       │──proxy──▶│  Express API │──▶│ PostgreSQL │
│  React SPA   │       │  (frontend)  │  /api/*  │  (backend)   │   │  (postgres) │
└──────────────┘       └──────────────┘       └──────────────┘   └────────────┘
```

Nginx serves the compiled React SPA and proxies all `/api/*` requests to the Express backend. The backend connects to PostgreSQL via Prisma ORM.

---

## Roles

| Role | Key Responsibilities |
|------|---------------------|
| **Employee** | Set KPA goals, submit mid-year review, submit self-appraisal |
| **Reporting Officer** | Add mid-year remarks, rate KPAs & attributes, mark reporting done |
| **Reviewing Officer** | Review appraisal, add remarks, mark reviewing done |
| **Accepting Officer** | Accept appraisal, add final remarks |
| **HR / Admin** | Manage cycles, users, attributes, finalize appraisals, view reports |
| **Managing Director (CEO)** | Organization-wide dashboard, user oversight |

---

## Complete Folder Structure

```
ePMS/
├── docker-compose.yml             # Orchestrates all 3 services
├── .gitignore
├── README.md
│
├── backend/
│   ├── Dockerfile                 # Node 20 Alpine → prisma generate → db push + seed + start
│   ├── package.json
│   ├── server.js                  # Express entry: mounts routes, helmet, CORS, rate-limit, cron
│   ├── .env.example               # Template for backend environment variables
│   ├── prisma/
│   │   ├── schema.prisma          # PostgreSQL schema: 10 models, enums, relations
│   │   ├── seed.js                # Creates demo users, cycle, and attribute masters
│   │   └── migrations/            # Prisma migration history
│   └── src/
│       ├── controllers/           # Request handlers (10 controllers)
│       │   ├── authController.js
│       │   ├── userController.js
│       │   ├── cycleController.js
│       │   ├── kpaController.js
│       │   ├── midYearController.js
│       │   ├── appraisalController.js
│       │   ├── reportController.js
│       │   ├── attributeController.js
│       │   ├── auditController.js
│       │   └── ceoDashboardController.js
│       ├── routes/                # Express route definitions (10 route files)
│       │   ├── auth.js            # /api/auth/*
│       │   ├── users.js           # /api/users/*
│       │   ├── cycles.js          # /api/cycles/*
│       │   ├── kpa.js             # /api/kpa/*
│       │   ├── midYear.js         # /api/mid-year/*
│       │   ├── appraisal.js       # /api/appraisal/*
│       │   ├── reports.js         # /api/reports/*
│       │   ├── attributes.js      # /api/attributes/*
│       │   ├── audit.js           # /api/audit/*
│       │   └── ceo.js             # /api/ceo/*
│       ├── services/              # Business logic layer
│       │   ├── authService.js
│       │   ├── userService.js
│       │   ├── cycleService.js
│       │   ├── kpaService.js
│       │   ├── midYearService.js
│       │   ├── appraisalService.js
│       │   ├── calculationEngine.js  # Score computation engine
│       │   ├── reportService.js
│       │   └── ceoDashboardService.js
│       ├── middleware/
│       │   ├── auth.js            # JWT verification
│       │   ├── rbac.js            # Role-based access control
│       │   └── errorHandler.js    # Global error handler
│       ├── cron/
│       │   └── cycleScheduler.js  # Scheduled cycle tasks via node-cron
│       └── utils/
│           ├── prisma.js          # Prisma client singleton
│           ├── errors.js          # Custom error classes
│           ├── auditLogger.js     # Audit log helper
│           ├── emailService.js    # Email notifications via Nodemailer
│           └── exportService.js   # PDF/Excel export utilities
│
├── frontend/
│   ├── Dockerfile                 # Multi-stage: Vite build → Nginx Alpine
│   ├── nginx.conf                 # SPA fallback + /api/ reverse proxy to backend:5000
│   ├── package.json
│   ├── vite.config.js             # Dev server on :3000, /api proxy, Vitest config
│   ├── index.html
│   ├── .env.example               # Template for frontend environment variables
│   └── src/
│       ├── main.jsx               # React DOM entry point
│       ├── App.jsx                # Route definitions + AuthProvider wrapper
│       ├── context/
│       │   └── AuthContext.jsx    # Global auth state (login, logout, user)
│       ├── services/
│       │   └── api.js             # Axios instance + all API client functions
│       ├── components/            # Shared UI components (coffee/beige theme)
│       │   ├── Navbar.jsx
│       │   ├── Layout.jsx
│       │   ├── ProtectedRoute.jsx
│       │   ├── Card.jsx
│       │   ├── Button.jsx
│       │   ├── Badge.jsx
│       │   ├── Alert.jsx
│       │   ├── ConfirmModal.jsx
│       │   └── CycleSelector.jsx
│       └── pages/
│           ├── Login.jsx          # Split-panel login with quick-fill demo buttons
│           ├── Unauthorized.jsx
│           ├── employee/          # Dashboard, GoalSetting, MidYearReview, SelfAppraisal, AppraisalSummary
│           ├── officer/           # Dashboard, GoalApproval, OfficerMidYear, RatingPage
│           ├── hr/                # AdminDashboard, CycleManagement, CycleDetails, UserManagement, Reports, AttributeManagement
│           └── ceo/               # CEODashboard, CEOUserManagement
```

---

## Zero-to-Hero Setup Guide (Docker)

### Prerequisites

- **Docker Desktop** (or Docker Engine + Docker Compose plugin) — [Install here](https://www.docker.com/products/docker-desktop/)

### Step-by-step

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd ePMS

# 2. Build and start all services in detached mode
docker compose up -d --build

# 3. Wait ~30 seconds for:
#    - PostgreSQL to initialize
#    - Backend to run prisma db push + seed
#    - Frontend to build and serve via Nginx

# 4. Access the application
#    Frontend  →  http://localhost:8080
#    Backend   →  http://localhost:5001
#    Health    →  http://localhost:5001/health
```

> **What happens automatically on first start:**
> The backend container runs `prisma db push` to sync the schema, then `node prisma/seed.js` to populate demo data, then starts the Express server.

### Troubleshooting

| Problem | Solution |
|---------|---------|
| **Port 8080 already in use** | Stop the conflicting service, or edit `docker-compose.yml` → change `"8080:80"` to e.g. `"9090:80"` |
| **Port 5433 already in use** | Another PostgreSQL may be running. Change `"5433:5432"` in `docker-compose.yml` |
| **Port 5001 already in use** | Change `"5001:5000"` in `docker-compose.yml` and update `CORS_ORIGIN` if needed |
| **Backend keeps restarting** | Run `docker compose logs -f backend` to check for DB connection errors. Ensure postgres is healthy first |
| **Seed data not appearing** | Run manually: `docker exec epms_backend node prisma/seed.js` |
| **Stale containers** | Run `docker compose down -v` to remove volumes, then `docker compose up -d --build` for a clean start |

---

## Local Development (Without Docker)

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Backend

```bash
cd backend
npm install
cp .env.example .env        # Edit DATABASE_URL to your local PostgreSQL
npx prisma migrate dev --name init
npx prisma generate
node prisma/seed.js
npm run dev                  # → http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev                  # → http://localhost:3000 (proxies /api to :5000)
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://epms_user:epms_pass@localhost:5432/epms_db` | PostgreSQL connection string |
| `JWT_SECRET` | `your-super-secret-jwt-key-change-this` | Secret key for signing JWT tokens |
| `JWT_EXPIRES_IN` | `8h` | Token expiration duration |
| `PORT` | `5000` | Express server port |
| `NODE_ENV` | `development` | Environment mode |
| `BCRYPT_ROUNDS` | `10` | Password hashing rounds |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origin |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:5000/api` | Backend API base URL |
| `VITE_API_TARGET` | `http://localhost:5000` | Vite dev proxy target |

> **Note:** When running via Docker, backend env vars are set directly in `docker-compose.yml`. The frontend Nginx proxy handles API routing automatically — no frontend `.env` is needed in production.

---

## Demo Login Credentials

| Role | Name | Email | Password |
|------|------|-------|----------|
| Managing Director (CEO) | Managing Director | ceo@epms.com | ceo@123 |
| HR Admin | HR Admin | hr@epms.com | hr@123 |
| Employee | Alice Developer | alice@epms.com | alice@123 |
| Employee | Bob Engineer | bob@epms.com | bob@123 |
| Employee | Carol Designer | carol@epms.com | carol@123 |
| Employee | Dave Analyst | dave@epms.com | dave@123 |

---

## API Reference

All endpoints are prefixed with `/api`. Routes marked 🔒 require a valid JWT. Role restrictions are enforced by the `authorize()` middleware.

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/login` | Public | Login → returns JWT token + user object |
| GET | `/auth/me` | 🔒 | Get current authenticated user |
| POST | `/auth/change-password` | 🔒 | Change password (requires oldPassword, newPassword) |

### Users — `/api/users`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users/profile` | 🔒 | Get own profile |
| GET | `/users/reportees` | 🔒 | Get users reporting to you |
| GET | `/users/reviewees` | 🔒 | Get users you review |
| GET | `/users/appraisees` | 🔒 | Get users you accept appraisals for |
| GET | `/users` | 🔒 HR, MD | List all users |
| POST | `/users` | 🔒 HR, MD | Create a new user |
| GET | `/users/:id` | 🔒 All roles | Get user by ID |
| PUT | `/users/:id` | 🔒 HR, MD | Update user |

### Cycles — `/api/cycles`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/cycles/active` | 🔒 | Get the active appraisal cycle |
| GET | `/cycles` | 🔒 | List all cycles |
| POST | `/cycles` | 🔒 HR | Create a new cycle |
| GET | `/cycles/:id` | 🔒 | Get cycle by ID |
| GET | `/cycles/:id/pending-work` | 🔒 HR | Get pending work items for a cycle |
| PUT | `/cycles/:id` | 🔒 HR | Update cycle |
| POST | `/cycles/:id/advance-phase` | 🔒 HR | Advance cycle to next phase |
| POST | `/cycles/:id/close` | 🔒 HR | Close a cycle |
| DELETE | `/cycles/:id` | 🔒 HR | Delete a cycle |

### KPA Goals — `/api/kpa`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/kpa/cycle/:cycleId` | 🔒 EMP* | Create a KPA goal |
| GET | `/kpa/cycle/:cycleId/my` | 🔒 EMP* | Get my KPA goals |
| POST | `/kpa/cycle/:cycleId/submit` | 🔒 EMP* | Submit all KPAs for approval |
| PUT | `/kpa/:id` | 🔒 EMP* | Update a KPA goal |
| DELETE | `/kpa/:id` | 🔒 EMP* | Delete a KPA goal |
| POST | `/kpa/cycle/:cycleId/employee/:userId/review` | 🔒 All | Review employee's KPAs (approve/reject) |
| GET | `/kpa/cycle/:cycleId/team` | 🔒 All | Get team KPA goals (officer view) |
| GET | `/kpa/cycle/:cycleId/employee/:userId` | 🔒 All | Get specific employee's KPAs |

### Mid-Year Review — `/api/mid-year`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/mid-year/cycle/:cycleId/my` | 🔒 EMP* | Get my mid-year review |
| POST | `/mid-year/cycle/:cycleId` | 🔒 EMP* | Save mid-year review |
| POST | `/mid-year/cycle/:cycleId/submit` | 🔒 EMP* | Submit mid-year review |
| GET | `/mid-year/cycle/:cycleId/team` | 🔒 All | Get team mid-year reviews |
| POST | `/mid-year/cycle/:cycleId/employee/:userId/remarks` | 🔒 Reporting | Add officer remarks to employee mid-year |
| GET | `/mid-year/cycle/:cycleId/employee/:userId` | 🔒 All | Get specific employee's mid-year review |

### Appraisal — `/api/appraisal`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/appraisal/cycle/:cycleId/my` | 🔒 EMP* | Get my annual appraisal |
| PUT | `/appraisal/cycle/:cycleId/self-assessment` | 🔒 EMP* | Update self-assessment (achievements) |
| POST | `/appraisal/cycle/:cycleId/submit` | 🔒 EMP* | Submit appraisal |
| GET | `/appraisal/cycle/:cycleId/employee/:userId` | 🔒 All | Get employee's appraisal (officer view) |
| POST | `/appraisal/:appraisalId/kpa-ratings` | 🔒 EMP* | Save KPA ratings |
| POST | `/appraisal/:appraisalId/attribute-ratings` | 🔒 EMP* | Save attribute ratings (values/competencies) |
| POST | `/appraisal/cycle/:cycleId/employee/:userId/reporting-done` | 🔒 Reporting | Reporting officer signs off |
| POST | `/appraisal/cycle/:cycleId/employee/:userId/reviewing-done` | 🔒 Reviewing | Reviewing officer signs off |
| POST | `/appraisal/cycle/:cycleId/employee/:userId/accepting-done` | 🔒 Accepting | Accepting officer signs off |
| GET | `/appraisal/cycle/:cycleId/team` | 🔒 EMP* | Get team appraisals |
| POST | `/appraisal/cycle/:cycleId/finalize-all` | 🔒 HR | Finalize all appraisals in a cycle |

### Reports — `/api/reports`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/reports/cycle/:cycleId/individual/:userId` | 🔒 HR, MD, Officers | Individual performance report |
| GET | `/reports/cycle/:cycleId/individual/:userId/export` | 🔒 HR, MD, Officers | Export individual report as PDF |
| GET | `/reports/cycle/:cycleId/department` | 🔒 HR, MD, Officers | Department summary report |
| GET | `/reports/cycle/:cycleId/department/export` | 🔒 HR, MD, Officers | Export department report as Excel |
| GET | `/reports/cycle/:cycleId/distribution` | 🔒 HR, MD, Officers | Rating distribution analytics |
| GET | `/reports/cycle/:cycleId/progress` | 🔒 HR, MD, Officers | Cycle completion progress |

### Attributes — `/api/attributes`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/attributes` | 🔒 | List all attributes (values + competencies) |
| POST | `/attributes` | 🔒 HR | Create an attribute |
| PUT | `/attributes/:id` | 🔒 HR | Update an attribute |
| DELETE | `/attributes/:id` | 🔒 HR | Delete an attribute |

### Audit — `/api/audit`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/audit/my` | 🔒 | Get own audit logs |
| GET | `/audit` | 🔒 HR | Get all system audit logs |

### CEO Dashboard — `/api/ceo`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/ceo/dashboard` | 🔒 MD | Org-wide dashboard (active cycle) |
| GET | `/ceo/dashboard/:cycleId` | 🔒 MD | Org-wide dashboard for a specific cycle |

> **EMP\*** = EMPLOYEE, REPORTING_OFFICER, REVIEWING_OFFICER, ACCEPTING_OFFICER (all non-HR, non-MD roles). The service layer further enforces officer-employee relationships.

---

## Database Schema

### Enums

| Enum | Values |
|------|--------|
| `Role` | EMPLOYEE, REPORTING_OFFICER, REVIEWING_OFFICER, ACCEPTING_OFFICER, HR, MANAGING_DIRECTOR |
| `AppraisalStatus` | DRAFT → SUBMITTED → REPORTING_DONE → REVIEWING_DONE → ACCEPTING_DONE → FINALIZED |
| `CyclePhase` | GOAL_SETTING, MID_YEAR_REVIEW, ANNUAL_APPRAISAL |
| `CycleStatus` | ACTIVE, CLOSED |

### Data Models

| Model | Key Fields | Description |
|-------|-----------|-------------|
| **User** | id, name, email, password, role, department, employeeCode, reportingOfficerId, reviewingOfficerId, acceptingOfficerId | All system users with self-referencing officer hierarchy |
| **ReportingHistory** | userId, reportingOfficerId, reviewingOfficerId, acceptingOfficerId, startDate, endDate | Tracks historical officer assignments |
| **AppraisalCycle** | name, year, phase, status, startDate, endDate, kpaWeight, valuesWeight, competenciesWeight | Appraisal cycle definition with configurable score weights |
| **KpaGoal** | userId, cycleId, title, weightage, status, reportingRemarks | Employee KPA goals (weightage must sum to 100%) |
| **MidYearReview** | userId, cycleId, progress, selfRating, reportingRemarks, managerRating | Mid-year progress reviews (unique per user+cycle) |
| **AnnualAppraisal** | userId, cycleId, achievements, status, kpaScore, valuesScore, competenciesScore, finalScore, ratingBand | Annual appraisal with computed scores and multi-level remarks |
| **KpaRating** | annualAppraisalId, kpaGoalId, rating, remarks, ratedBy | Officer ratings for individual KPA goals |
| **AttributeMaster** | name, type (VALUES/COMPETENCIES), description | Master list of organizational values and competencies |
| **AttributeRating** | annualAppraisalId, attributeId, rating, remarks, ratedBy | Officer ratings for values/competencies |
| **AuditLog** | userId, action, entity, entityId, oldValue, newValue, ipAddress | Append-only audit trail of all system actions |

---

## Appraisal Workflow

```
Employee          Reporting Officer    Reviewing Officer    Accepting Officer    HR
   │                     │                    │                    │              │
   ├─ Set KPAs ─────────>│                    │                    │              │
   ├─ Submit KPAs ───────>│                    │                    │              │
   │                     │                    │                    │              │
   ├─ Mid-Year Update ───>│                    │                    │              │
   │                     ├─ Add Remarks ──────>│                    │              │
   │                     │                    │                    │              │
   ├─ Self Appraisal ────>│                    │                    │              │
   ├─ Submit ────────────>│  [SUBMITTED]       │                    │              │
   │                     ├─ Rate KPAs ─────────────────────────────>              │
   │                     ├─ Mark Done ─────────>│  [REPORTING_DONE] │              │
   │                     │                    ├─ Review ───────────>│              │
   │                     │                    ├─ Mark Done ─────────>│[REVIEWING_DONE]
   │                     │                    │                    ├─ Accept ─────>│
   │                     │                    │                    │  [ACCEPTING_DONE]
   │                     │                    │                    │              ├─ Finalize
   │                     │                    │                    │              │  [FINALIZED]
```

### Status Flow
```
DRAFT → SUBMITTED → REPORTING_DONE → REVIEWING_DONE → ACCEPTING_DONE → FINALIZED
```

---

## Score Calculation

```
KPA Score         =  SUM(weightage × rating) / 100
Values Score      =  AVG(all values ratings)
Competencies      =  AVG(all competency ratings)

Final Score  =  (KPA Score × 0.60) + (Values Score × 0.20) + (Competencies × 0.20)
```

> Score weights (60/20/20) are configurable per cycle via `kpaWeight`, `valuesWeight`, and `competenciesWeight` fields.

### Rating Bands

| Score Range | Band |
|-------------|------|
| 1.0 – 1.9 | Poor |
| 2.0 – 2.9 | Below Average |
| 3.0 – 3.9 | Average |
| 4.0 – 4.9 | Good |
| 5.0 | Outstanding |

---

## Docker Services

| Service | Container | Image | Internal Port | Host Port |
|---------|-----------|-------|--------------|-----------|
| PostgreSQL | epms_postgres | postgres:16-alpine | 5432 | 5433 |
| Backend | epms_backend | Node 20 Alpine | 5000 | 5001 |
| Frontend | epms_frontend | Nginx Alpine | 80 | 8080 |

### Useful Docker Commands

```bash
# Start all services (build + detached)
docker compose up -d --build

# Stop all services
docker compose down

# Stop + remove all data (clean slate)
docker compose down -v

# View backend logs
docker compose logs -f backend

# View frontend logs
docker compose logs -f frontend

# Rebuild a single service
docker compose build backend
docker compose up -d backend

# Access PostgreSQL directly
docker exec -it epms_postgres psql -U epms_user -d epms_db

# Re-run seed data
docker exec epms_backend node prisma/seed.js
```

---

## Features Summary

- **JWT Authentication** with role-based access control (6 roles)
- **KPA Goal Setting** with 100% weightage validation
- **Multi-level Approval Workflow** — strict sequential status transitions
- **Mid-Year Review** with officer remarks and manager ratings
- **Annual Self-Appraisal** with achievements
- **KPA + Values + Competency Ratings** by officers
- **Automated Score Calculation** on finalization (configurable weights)
- **CEO Dashboard** — organization-wide analytics and user management
- **PDF & Excel Exports** — individual reports (PDF) and department summaries (Excel)
- **Audit Logs** — append-only tracking of all system actions
- **Reports** — department summary, rating distribution, cycle progress, individual report
- **Cycle Management** — create, advance phases (Goal Setting → Mid-Year → Annual), close
- **User Management** — create users, assign three-tier officer hierarchy
- **Attribute Master** — configure organizational Values and Competencies
- **Cron Scheduler** — automated cycle management tasks
- **Email Notifications** — via Nodemailer integration
- **Rate Limiting** — 200 requests per 15-minute window
- **Modern Coffee/Beige UI** — premium design with espresso (#3C2415), mocha (#6F4E37), sand (#D4C3BB), and cream (#F5F0E8) palette

---

## License

MIT License — free to use and modify.
