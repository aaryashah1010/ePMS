# e-PMS — Electronic Performance Management System

A complete, production-ready **role-based performance appraisal system** built from scratch.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Axios, React Router |
| Backend | Node.js, Express.js, Prisma ORM |
| Database | PostgreSQL 16 |
| Auth | JWT + bcrypt |
| DevOps | Docker, Docker Compose, Nginx |

---

## Roles

| Role | Responsibilities |
|------|-----------------|
| **Employee** | Set KPA goals, submit mid-year review, submit self-appraisal |
| **Reporting Officer** | Add mid-year remarks, rate KPAs & attributes, mark reporting done |
| **Reviewing Officer** | Review appraisal, add remarks, mark reviewing done |
| **Accepting Officer** | Accept appraisal, add final remarks |
| **HR / Admin** | Manage cycles, users, attributes, finalize appraisals, view reports |

---

## Project Structure

```
ems/
├── backend/
│   ├── server.js                  # Express app entry point
│   ├── Dockerfile
│   ├── package.json
│   ├── .env                       # Environment variables (not committed)
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   ├── seed.js                # Sample data seeder
│   │   └── migrations/            # SQL migration files
│   └── src/
│       ├── controllers/           # Request handlers
│       │   ├── authController.js
│       │   ├── userController.js
│       │   ├── cycleController.js
│       │   ├── kpaController.js
│       │   ├── midYearController.js
│       │   ├── appraisalController.js
│       │   ├── reportController.js
│       │   ├── attributeController.js
│       │   └── auditController.js
│       ├── routes/                # Express route definitions
│       │   ├── auth.js
│       │   ├── users.js
│       │   ├── cycles.js
│       │   ├── kpa.js
│       │   ├── midYear.js
│       │   ├── appraisal.js
│       │   ├── reports.js
│       │   ├── attributes.js
│       │   └── audit.js
│       ├── middleware/
│       │   ├── auth.js            # JWT authentication
│       │   ├── rbac.js            # Role-based access control
│       │   └── errorHandler.js    # Global error handler
│       ├── services/              # Business logic
│       │   ├── authService.js
│       │   ├── userService.js
│       │   ├── cycleService.js
│       │   ├── kpaService.js
│       │   ├── midYearService.js
│       │   ├── appraisalService.js
│       │   ├── calculationEngine.js  # Score computation
│       │   └── reportService.js
│       └── utils/
│           ├── prisma.js          # Prisma client singleton
│           ├── errors.js          # Custom error classes
│           └── auditLogger.js     # Audit log helper
│
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf                 # Nginx config + API proxy
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── .env                       # Environment variables (not committed)
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                # Routes + Auth provider
│       ├── context/
│       │   └── AuthContext.jsx    # Global auth state
│       ├── services/
│       │   └── api.js             # Axios instance + all API calls
│       ├── components/            # Reusable UI components
│       │   ├── Navbar.jsx
│       │   ├── Layout.jsx
│       │   ├── ProtectedRoute.jsx
│       │   ├── Card.jsx
│       │   ├── Button.jsx
│       │   ├── Badge.jsx
│       │   ├── Alert.jsx
│       │   └── CycleSelector.jsx
│       └── pages/
│           ├── Login.jsx
│           ├── Unauthorized.jsx
│           ├── employee/
│           │   ├── Dashboard.jsx
│           │   ├── GoalSetting.jsx
│           │   ├── MidYearReview.jsx
│           │   └── SelfAppraisal.jsx
│           ├── officer/
│           │   ├── Dashboard.jsx
│           │   ├── GoalApproval.jsx
│           │   └── RatingPage.jsx
│           └── hr/
│               ├── AdminDashboard.jsx
│               ├── CycleManagement.jsx
│               ├── UserManagement.jsx
│               ├── Reports.jsx
│               └── AttributeManagement.jsx
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Quick Start (Docker — Recommended)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Steps

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd ems

# 2. Start all services
docker-compose up --build

# 3. Access the app
# Frontend  →  http://localhost:8080
# Backend   →  http://localhost:5001
# Health    →  http://localhost:5001/health
```

> Database migrations and seed data run automatically on first start.

---

## Local Development (Without Docker)

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env → set your local DATABASE_URL

# Run database migration
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Seed sample data
node prisma/seed.js

# Start development server
npm run dev
# Backend runs on http://localhost:5000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env → VITE_API_URL=http://localhost:5000/api

# Start development server
npm run dev
# Frontend runs on http://localhost:3000
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
DATABASE_URL="postgresql://epms_user:epms_pass@localhost:5432/epms_db"
JWT_SECRET="your-secret-key-here"
JWT_EXPIRES_IN="8h"
PORT=5000
NODE_ENV=development
BCRYPT_ROUNDS=10
CORS_ORIGIN="http://localhost:3000"
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

---

## Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| HR Admin | hr@epms.com | hr@123 |
| Accepting Officer | director@epms.com | director@123 |
| Reviewing Officer | manager@epms.com | manager@123 |
| Reporting Officer | teamlead@epms.com | teamlead@123 |
| Employee 1 | alice@epms.com | alice@123 |
| Employee 2 | bob@epms.com | bob@123 |
| Employee 3 | carol@epms.com | carol@123 |

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

### Rating Bands

| Score Range | Band |
|-------------|------|
| 1.0 – 1.9 | Poor |
| 2.0 – 2.9 | Below Average |
| 3.0 – 3.9 | Average |
| 4.0 – 4.9 | Good |
| 5.0 | Outstanding |

---

## Database Schema

| Table | Description |
|-------|-------------|
| `User` | All users with roles and officer hierarchy |
| `AppraisalCycle` | Appraisal cycles with phases and status |
| `KpaGoal` | Employee KPA goals with weightage |
| `MidYearReview` | Mid-year progress updates |
| `AnnualAppraisal` | Annual appraisal with computed scores |
| `KpaRating` | Officer ratings for each KPA |
| `AttributeMaster` | Values and Competency definitions |
| `AttributeRating` | Officer ratings for values/competencies |
| `AuditLog` | Append-only log of all system actions |

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/change-password` | Change password |

### Cycles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cycles` | Get all cycles |
| GET | `/api/cycles/active` | Get active cycle |
| POST | `/api/cycles` | Create cycle (HR) |
| POST | `/api/cycles/:id/advance-phase` | Advance phase (HR) |
| POST | `/api/cycles/:id/close` | Close cycle (HR) |

### KPA Goals
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/kpa/cycle/:id` | Create KPA |
| GET | `/api/kpa/cycle/:id/my` | Get my KPAs |
| PUT | `/api/kpa/:id` | Update KPA |
| DELETE | `/api/kpa/:id` | Delete KPA |
| POST | `/api/kpa/cycle/:id/submit` | Submit all KPAs |

### Appraisal
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/appraisal/cycle/:id/my` | Get my appraisal |
| POST | `/api/appraisal/cycle/:id/submit` | Submit appraisal |
| POST | `/api/appraisal/:id/kpa-ratings` | Save KPA ratings |
| POST | `/api/appraisal/:id/attribute-ratings` | Save attribute ratings |
| POST | `/api/appraisal/cycle/:cid/employee/:uid/reporting-done` | Reporting officer action |
| POST | `/api/appraisal/cycle/:cid/employee/:uid/reviewing-done` | Reviewing officer action |
| POST | `/api/appraisal/cycle/:cid/employee/:uid/accepting-done` | Accepting officer action |
| POST | `/api/appraisal/cycle/:id/finalize-all` | HR finalize all |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/cycle/:id/individual/:uid` | Individual report |
| GET | `/api/reports/cycle/:id/department` | Department summary |
| GET | `/api/reports/cycle/:id/distribution` | Rating distribution |
| GET | `/api/reports/cycle/:id/progress` | Cycle progress |

---

## Docker Services

| Service | Container | Internal Port | Host Port |
|---------|-----------|--------------|-----------|
| PostgreSQL | epms_postgres | 5432 | 5433 |
| Backend | epms_backend | 5000 | 5001 |
| Frontend | epms_frontend | 80 | 8080 |

### Useful Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Rebuild after code changes
docker-compose build backend
docker-compose up -d backend

# Access database directly
docker exec -it epms_postgres psql -U epms_user -d epms_db

# Re-run seed data
docker exec epms_backend node prisma/seed.js
```

---

## Features Summary

- **JWT Authentication** with role-based access control
- **KPA Goal Setting** with 100% weightage validation
- **Multi-level Approval Workflow** — strict sequential status transitions
- **Mid-Year Review** with officer remarks
- **Annual Self-Appraisal** with achievements
- **KPA + Values + Competency Ratings** by officers
- **Automated Score Calculation** on finalization
- **Audit Logs** — append-only tracking of all actions
- **Reports** — department summary, rating distribution, cycle progress, individual report
- **Cycle Management** — create, advance phases, close
- **User Management** — create users, assign officer hierarchy
- **Attribute Master** — configure Values and Competencies

---

## License

MIT License — free to use and modify.
