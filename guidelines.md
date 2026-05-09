Backend (PHP, MySQLi, no framework):
All new endpoints live under /backend/api/<domain>/<action>.php
Every endpoint includes /backend/config/database.php via a portable relative path (require_once __DIR__ . '/../../config/database.php';) — fix the existing C:/xampp/... hardcoded paths as part of Phase 0.
All endpoints emit JSON, validate inputs, use prepared statements (no real_escape_string).
Auth: every protected endpoint calls a new helper require_user() from /backend/config/auth.php that decodes the bearer token, verifies HMAC signature, and returns the user row (signed with a secret in .env).
AI calls go through a single /backend/lib/groq.php wrapper (model + key from env, retry + timeout, returns parsed JSON).
Frontend (React 19 + Vite + Tailwind):
New folder layout: /frontend/src/{pages, components, hooks, services, contexts, lib, locales}.
All HTTP calls go through services/api.js (axios instance with Authorization header + 401 redirect).
Auth state via contexts/AuthContext.jsx (replaces scattered localStorage reads).
Polling lives in custom hooks (useChatMessages, useNotifications, useMatchStatus) — interval 3–5s for chat, 10s for notifications, on-demand for matches.
Tailwind for layout/spacing; keep the existing CSS-variable design tokens in index.css.
Database:
One SQL migration per phase: /backend/migrations/0XX_<name>.sql. Each is idempotent (CREATE TABLE IF NOT EXISTS, ALTER ... ADD COLUMN IF NOT EXISTS via stored proc shim).
Stop creating tables on the fly inside endpoints — endpoints assume the schema exists.
Don't touch ngos, donations, milestones (legacy, but DB-safe to leave).