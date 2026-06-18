# Security Implementation Guide – ESC Sétif 1 Platform

## 1. Authentication & Session Management

| Control | Implementation |
|---|---|
| Password hashing | bcrypt with **12 salt rounds** (see `backend/src/utils/passwordHash.js`) |
| Access token | JWT, **15-minute expiry** (`JWT_ACCESS_EXPIRES`) |
| Refresh token | JWT, **7-day expiry**, stored as bcrypt hash in `sessions` table |
| Token storage | Access token in `sessionStorage`; refresh in `localStorage` (upgrade to HttpOnly cookie for prod) |
| Logout | Deletes all server-side sessions for the user (`DELETE FROM sessions WHERE company_id = $1`) |
| Auto-refresh | Axios interceptor silently refreshes on 401 before retrying the failed request |

## 2. Brute-Force Protection

| Endpoint | Limit |
|---|---|
| `POST /api/auth/login` | **5 attempts / 10 min** per IP (`loginLimiter`) |
| `POST /api/auth/register` | **3 attempts / hour** per IP (`registerLimiter`) |
| All `/api/*` routes | **100 requests / min** per IP (`apiLimiter`) |

Implemented via `express-rate-limit` in `rateLimitMiddleware.js`.

## 3. Role-Based Access Control (RBAC)

```
company → POST /api/needs, GET /api/needs/company
admin   → GET /api/needs/all, PUT /api/needs/:id/status,
          POST /api/services, DELETE /api/services/:id
public  → GET /api/services, GET /api/health
```

Enforced by `roleMiddleware.js` — every protected route verifies `req.user.role` after JWT validation.

## 4. Data Encryption

### At Rest
- Passwords: **bcrypt(12)** — never stored in plaintext
- PII fields (email, phone): **AES-256-GCM** application-level encryption (`crypto.js`)
  - Unique IV per field; auth tag prevents tampering
  - Lookup uses `email_normalized` (lowercase, plaintext) — only for index matching
- Database: Enable PostgreSQL TDE or encrypted volumes in production (AWS RDS, Supabase)

### In Transit
- TLS 1.3 enforced on all endpoints (HTTPS via hosting provider)
- HSTS header: `max-age=31536000; includeSubDomains`

## 5. Input Validation & XSS Prevention

- **Server-side**: `express-validator` rules for every route (`validationMiddleware.js`)
  - String escaping, length limits, type coercion
  - Allowlist for enums (`serviceType`, `status`, `category`)
- **SQL injection**: 100% parameterized queries — no raw string interpolation
- **Client-side**: `DOMPurify` sanitization + HTML entity escaping (`security.ts`)
- **CSP**: Helmet configures `Content-Security-Policy` with `default-src 'self'`

## 6. HTTP Security Headers

Configured via `helmet` in `app.js`:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; ...
Referrer-Policy: strict-origin-when-cross-origin
```

## 7. GDPR / Privacy Compliance

- Data minimisation: only essential fields collected
- Right to erasure: cascade delete on `companies` removes all associated `needs` and `sessions`
- Privacy Policy page at `/privacy`
- No sensitive data in logs (morgan masks password fields)
- Consent: explicit opt-in at registration

## 8. Production Checklist

- [ ] Replace `.env.example` values with strong random secrets (≥ 64 chars for JWT)
- [ ] Set `ENCRYPTION_KEY` to exactly 32 random bytes
- [ ] Enable PostgreSQL SSL (`ssl: { rejectUnauthorized: true }`)
- [ ] Deploy behind HTTPS reverse proxy (Nginx/Caddy)
- [ ] Store refresh tokens in HttpOnly, Secure, SameSite=Strict cookies
- [ ] Enable `pg_cron` for `cleanup_expired_sessions()`
- [ ] Configure CORS `FRONTEND_URL` to production domain only
- [ ] Enable database-level audit logging
- [ ] Set up intrusion detection (fail2ban or cloud WAF)
