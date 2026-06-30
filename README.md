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

