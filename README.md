# ESC Sétif 1 – University Services & Consulting Platform

> Full-stack enterprise platform for **Entreprise de Services et Consultations Sétif 1 Ferhat Abbas**

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Routing | React Router v6 |
| Backend | Node.js + Express.js |
| Database | PostgreSQL 16 |
| Auth | JWT (access 15min + refresh 7d) + bcrypt(12) |
| Security | Helmet, CORS, rate-limiting, AES-256-GCM, Zod/express-validator |
| i18n | Custom trilingual (FR/AR/EN) with RTL |
| Deployment | Frontend → Vercel/Netlify · Backend → Render/Railway · DB → Supabase/Neon |

## Quick Start (Docker)

```bash
# 1. Clone & configure
cp backend/.env.example backend/.env
# Edit backend/.env with your secrets

# 2. Start database + backend
docker compose up -d

# 3. Start frontend (separate terminal)
cd frontend
npm install
npm run dev
```

App runs at: http://localhost:5173  
API runs at: http://localhost:4000

## Manual Setup (no Docker)

### Database
```bash
psql -U postgres -c "CREATE DATABASE esc_setif1;"
psql -U postgres -d esc_setif1 -f database/schema.sql
psql -U postgres -d esc_setif1 -f database/seed-data.sql
```

### Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL and secrets
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```


## API Endpoints

```
POST   /api/auth/register        Company registration
POST   /api/auth/login           Login → JWT tokens
POST   /api/auth/logout          Invalidate session
POST   /api/auth/refresh         Refresh access token
GET    /api/auth/verify          Validate current token

POST   /api/needs                Submit a need (company)
GET    /api/needs/company        Own needs (company)
GET    /api/needs/all            All needs (admin)
PUT    /api/needs/:id/status     Update status (admin)

GET    /api/services             Public service listing
POST   /api/services             Publish service (admin)
DELETE /api/services/:id         Remove service (admin)
```

## Project Structure

```
esc-setif1-platform/
├── frontend/          React + TS + Vite
│   └── src/
│       ├── components/   30+ UI components
│       ├── pages/        PublicHome, Auth, CompanyDashboard, AdminPanel
│       ├── lib/          api.ts, i18n.ts, auth.ts, security.ts
│       ├── hooks/        useI18n, useAuth
│       └── styles/       global.css (design system), rtl.css
├── backend/           Express.js REST API
│   └── src/
│       ├── controllers/  auth, needs, services
│       ├── middleware/   auth, role, rateLimit, validation
│       ├── routes/       authRoutes, needsRoutes, servicesRoutes
│       ├── utils/        crypto (AES-256), passwordHash (bcrypt)
│       └── db/           PostgreSQL connection pool
├── database/
│   ├── schema.sql        Full schema with indexes & triggers
│   └── seed-data.sql     Demo admin + 4 default services
├── docker-compose.yml
├── SECURITY.md        Security implementation details
└── README.md
```

## Design System

- **Navy**: `#0d2a4a` · **Emerald**: `#0ea47f` · **BG**: `#f4f7fb` · **Footer**: `#0a1626`
- **Fonts**: Schibsted Grotesk (headings) · Plus Jakarta Sans (body) · IBM Plex Sans Arabic (AR)
- **RTL**: Full Arabic support via `html[dir="rtl"]` + CSS logical properties

## Security Highlights

See [SECURITY.md](SECURITY.md) for the full security guide.

- bcrypt(12) password hashing
- JWT access (15min) + refresh (7d) token rotation
- AES-256-GCM encryption for PII fields (email, phone)
- RBAC: `company` / `admin` roles enforced on every route
- Rate limiting: 5 login attempts / 10 min; 100 req/min global
- SQL injection: 100% parameterized queries
- XSS: CSP headers + DOMPurify + express-validator escaping
- HSTS, X-Frame-Options: DENY, nosniff

