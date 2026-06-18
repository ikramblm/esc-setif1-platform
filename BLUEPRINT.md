# ESC Sétif 1 – Comprehensive Technical Blueprint
> Structured specification for implementation and Figma Make

---

## PART 1 – INFORMATION ARCHITECTURE

### Sitemap

```
ESC Sétif 1 Platform
│
├── PUBLIC (unauthenticated)
│   ├── / (Home)
│   │   ├── #hero          Hero + stats
│   │   ├── #services      4 service cards (Consulting/Formation/Études/Recherche)
│   │   ├── #sectors       6 sector chips
│   │   ├── #about         About + pillars
│   │   └── #contact       Contact form
│   ├── /auth              Login + Register (tabbed)
│   ├── /privacy           GDPR privacy policy
│   └── /terms             Terms of use
│
├── COMPANY (role: company)
│   └── /dashboard
│       ├── Stats overview (4 KPI cards)
│       ├── My needs list  (filterable cards)
│       └── Submit need modal
│
└── ADMIN (role: admin)
    └── /admin
        ├── Sidebar nav (Requests / Services)
        ├── /admin → Requests tab
        │   ├── KPI stats row
        │   ├── Status filter chips
        │   └── Requests table (inline status update)
        └── /admin → Services tab
            ├── Published services grid
            └── Publish service modal
```

---

## PART 2 – USER JOURNEY MAPPING

### Journey 1 – Company (Conversion: Submit a Need)
```
Landing Page → Hero CTA ("Soumettre un besoin")
  → /auth?mode=register
    → Fill registration form (company name, sector, contact, email, password)
      → Auto-login → /dashboard
        → Click "Nouveau Besoin"
          → Modal: title, type, description, deadline, budget
            → Submit → Status: "En attente"
              → Track status updates from admin
```

### Journey 2 – Admin (Manage Requests)
```
/auth → Login with admin@esc-setif1.dz / admin123
  → /admin (Requests tab)
    → View all company requests in table
      → Click request title → Detail modal
        → Update status dropdown (pending→reviewing→approved/rejected/completed)
          → (Tab: Services)
            → Click "Publier un Service"
              → Modal: category, title, description → Publish
```

### Journey 3 – Visitor (Browse & Contact)
```
/ → Browse services section → Browse sectors
  → CTA band "Démarrer maintenant" → /auth?mode=register
  OR
  → #contact → Fill contact form → Submit
```

---

## PART 3 – DATA ARCHITECTURE

### Entity Relationship Diagram

```
companies (1) ──< needs (many)
companies (1) ──< sessions (many)
```

### Schema Summary

| Table | Key Fields | Indexes |
|---|---|---|
| `companies` | id (UUID PK), email_normalized (UNIQUE), password_hash, role | email_normalized, role |
| `needs` | id (UUID PK), company_id (FK), service_type, status | company_id, status, created_at |
| `services` | id (UUID PK), category, title, published_at | category, published_at |
| `sessions` | id (UUID PK), company_id (FK), token_hash, expires_at | company_id, expires_at |

### Encryption Fields
| Field | Method |
|---|---|
| `companies.email` | AES-256-GCM (app-level) |
| `companies.phone` | AES-256-GCM (app-level) |
| `companies.password_hash` | bcrypt(12) |
| `sessions.token_hash` | bcrypt(12) |

---

## PART 4 – API SURFACE

### Auth Routes
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | /api/auth/register | ✗ | — | Company registration |
| POST | /api/auth/login | ✗ | — | Returns JWT pair |
| POST | /api/auth/logout | ✓ | any | Invalidates session |
| POST | /api/auth/refresh | ✗ | — | Refresh access token |
| GET  | /api/auth/verify | ✓ | any | Validate token |

### Needs Routes
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | /api/needs | ✓ | company | Create need |
| GET  | /api/needs/company | ✓ | company | Own needs |
| GET  | /api/needs/all | ✓ | admin | All needs + company info |
| PUT  | /api/needs/:id/status | ✓ | admin | Update status |

### Services Routes
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET    | /api/services | ✗ | — | Public listing |
| POST   | /api/services | ✓ | admin | Publish service |
| DELETE | /api/services/:id | ✓ | admin | Remove service |

---

## PART 5 – COMPONENT INVENTORY (30+ components)

| # | Component | File | Purpose |
|---|---|---|---|
| 1 | Navbar | Navbar.tsx | Sticky nav with lang switcher, auth state |
| 2 | Footer | Footer.tsx | Dark footer with links and contact |
| 3 | HeroSection | HeroSection.tsx | Landing hero with stats grid |
| 4 | ServicesSection | ServicesSection.tsx | 4 service type cards |
| 5 | SectorsSection | SectorsSection.tsx | 6 sector icon cards |
| 6 | AboutSection | AboutSection.tsx | About + pillars grid |
| 7 | ContactSection | ContactSection.tsx | Contact form (dark bg) |
| 8 | Modal | Modal.tsx | Accessible dialog with ESC dismiss |
| 9 | StatusBadge | StatusBadge.tsx | Color-coded status indicator |
| 10 | NeedCard | NeedCard.tsx | Company need summary card |
| 11 | ServiceCard | ServiceCard.tsx | Published service card (admin delete) |
| 12 | Alert | Alert.tsx | Error/success/info banner |
| 13 | LoadingSpinner | LoadingSpinner.tsx | Animated spinner (3 sizes) |
| 14 | AuthPage | Auth.tsx | Tabbed login/register page |
| 15 | CompanyDashboard | CompanyDashboard.tsx | Company request management |
| 16 | AdminPanel | AdminPanel.tsx | Admin requests + services tabs |
| 17 | PublicHome | PublicHome.tsx | Full home page assembly |
| 18 | Navbar.LangSwitcher | (in Navbar) | FR/AR/EN dropdown |
| 19 | Navbar.MobileMenu | (in Navbar) | Responsive hamburger menu |
| 20 | HeroSection.StatGrid | (in Hero) | 4-column KPI strip |
| 21 | HeroSection.TrustCard | (in Hero) | Floating trust indicator |
| 22 | Form.Input | (inline) | Styled text input + validation |
| 23 | Form.Select | (inline) | Styled select + arrow |
| 24 | Form.Textarea | (inline) | Auto-resize textarea |
| 25 | Form.PasswordField | (in Auth) | Eye toggle + strength meter |
| 26 | Dashboard.StatsRow | (in Dashboard) | 4 KPI cards row |
| 27 | Dashboard.EmptyState | (in Dashboard) | Empty needs illustration |
| 28 | Admin.StatusFilter | (in Admin) | Chip-based status filter |
| 29 | Admin.RequestsTable | (in Admin) | Full-width sortable table |
| 30 | Admin.SidebarNav | (in Admin) | Icon sidebar navigation |
| 31 | App.RequireAuth | App.tsx | Route guard HOC |
| 32 | ServiceCard.DeleteBtn | (in ServiceCard) | Admin trash button |
| 33 | CTABand | PublicHome.tsx | Full-width conversion CTA |
| 34 | PrivacyPage | App.tsx | GDPR policy page |

---

## PART 6 – PAGE BLUEPRINTS

### / (Public Home)
```
[Navbar: Logo | Nav links | Lang | Login | Register]
[Hero: Badge | H1 title | Subtitle | CTA buttons | Stats grid | Trust card]
[Services: Section header | 4 cards (icon, title, features, CTA)]
[Sectors: Section header | 6 icon cards grid]
[Published Services: Section header | Service cards feed]
[CTA Band: H2 | Text | Button]
[About: Text+stats col | Pillars 2×2 grid]
[Contact: Dark bg | Info col | Form card]
[Footer: Logo+tagline | Links cols | Contact | Bottom bar]
```

### /auth
```
[Top bar: Back link | Logo]
[Card: Mode tabs (Login/Register)]
  [Login: Email | Password+eye | Forgot | Submit | Switch]
  [Register: Company+Sector | Contact+Phone | Email | Password+meter | Confirm | Submit | Switch]
[Demo hint box]
```

### /dashboard
```
[Header: Logo | Company name | Email | Logout]
[Page: Title + New Need btn]
[Stats: 4 KPI cards]
[Need cards grid OR Empty state]
[New Need Modal: Title | Type | Description | Deadline | Budget | Submit]
[Detail Modal: Badge | Description | Metadata grid]
```

### /admin
```
[Header: Logo | Admin tag | Email | Logout]
[Layout: Sidebar (Requests/Services) | Main content]
  [Requests: Stats row | Filter chips | Table (Title/Company/Type/Date/Status/Action)]
  [Services: Publish btn | Service cards grid]
[Publish Modal: Category | Title | Description | Submit]
[Detail Modal: Status update dropdown]
```

---

## PART 7 – TECHNOLOGY STACK

### Frontend
- **Framework**: React 18 + TypeScript (Vite 5)
- **Routing**: React Router v6
- **HTTP**: Axios with interceptor-based JWT refresh
- **Validation**: Zod + react-hook-form
- **Icons**: Lucide React
- **XSS**: DOMPurify
- **i18n**: Custom hook (no external dependency)

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js 4
- **ORM**: Raw SQL with `pg` (node-postgres) — parameterized queries only
- **Auth**: `jsonwebtoken` (HS256, short-lived access + refresh)
- **Password**: `bcrypt` (12 rounds)
- **Encryption**: Node.js built-in `crypto` (AES-256-GCM)
- **Validation**: `express-validator`
- **Security**: `helmet`, `cors`, `express-rate-limit`
- **Logging**: `morgan`

### Database
- **Engine**: PostgreSQL 16
- **Features**: UUID PKs (`gen_random_uuid`), TIMESTAMPTZ, auto-updated_at triggers
- **Encryption**: AES-256-GCM at application layer; TDE at DB layer in production

### Hosting (Recommended)
| Layer | Free tier | Paid |
|---|---|---|
| Frontend | Vercel, Netlify | Vercel Pro |
| Backend | Render (free tier) | Railway, AWS ECS |
| Database | Supabase (free 500MB), Neon | AWS RDS, Supabase Pro |

---

## PART 8 – PERFORMANCE BENCHMARKS

| Metric | Target |
|---|---|
| Lighthouse Performance | ≥ 95 |
| First Contentful Paint | < 1.2s |
| Largest Contentful Paint | < 2.5s |
| Time to Interactive | < 3.0s |
| Cumulative Layout Shift | < 0.1 |
| API response time (p95) | < 200ms |
| Bundle size (gzip) | < 150KB JS |
| PostgreSQL query time | < 20ms (indexed) |

Optimizations implemented:
- Vite code-splitting: vendor, ui, routes
- Google Fonts with `display=swap` + preconnect
- Lazy loading for dashboard/admin pages
- Connection pool (max 20) for PostgreSQL
- Response compression (add `compression` middleware for production)

---

## PART 9 – SEO FRAMEWORK

### Meta Tags (index.html)
- `<title>` with brand + keyword
- `<meta name="description">` (120–160 chars)
- `<meta name="keywords">` relevant terms
- Open Graph: `og:title`, `og:description`, `og:type`
- `<html lang>` dynamically set (fr/ar/en)
- `<html dir>` dynamically set (ltr/rtl)

### Structural SEO
- Semantic HTML5: `<header>`, `<main>`, `<section>`, `<footer>`
- Single H1 per page
- Anchor `href="#sections"` for scroll navigation (crawlable)
- Alt text on all images/icons

### Multilingual SEO
- Dynamic `lang` + `dir` attributes on `<html>`
- Hreflang (add server-side for multi-domain deployments)
- Arabic RTL content fully indexed (not hidden via CSS)

### Technical SEO
- 100% HTTPS (HSTS enforced)
- Canonical URLs
- `sitemap.xml` (generate with vite-plugin-sitemap for production)
- `robots.txt` (allow all public pages, disallow /dashboard, /admin)

---

*Blueprint version 1.0 – ESC Sétif 1 Platform – June 2025*
