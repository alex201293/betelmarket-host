# BetelMarket Hosting Panel

A production-grade SaaS hosting panel powered by HestiaCP. Inspired by Hostinger hPanel and Vercel's dashboard design.

## Architecture

```
Client Browser → Next.js Frontend → Laravel API → Redis Queue → Hestia Adapter → HestiaCP Server
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, TanStack Query, Zustand |
| Backend | Laravel 12, PHP 8.3, Sanctum, Redis Queue |
| Database | PostgreSQL 16 |
| Infrastructure | Docker, HestiaCP |

## Quick Start

```bash
# Clone and start services
docker-compose up -d

# Backend setup
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed

# Frontend setup
cd frontend
npm install
npm run dev
```

## Default Credentials (Seeder)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@betelmarket.com | password123 |
| Reseller | reseller@betelmarket.com | password123 |
| Client | client@betelmarket.com | password123 |

## API Endpoints

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user

### Users (Admin/Reseller)
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PATCH /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Plans
- `GET /api/plans` - List plans
- `POST /api/plans` - Create plan (admin)
- `PATCH /api/plans/{id}` - Update plan (admin)

### Hosting Accounts
- `GET /api/hosting` - List accounts
- `POST /api/hosting` - Create account

### Domains
- `GET /api/domains` - List domains
- `POST /api/domains` - Create domain
- `DELETE /api/domains/{id}` - Delete domain

### Emails
- `GET /api/emails` - List mailboxes
- `POST /api/emails` - Create mailbox
- `PATCH /api/emails/{id}` - Update mailbox
- `DELETE /api/emails/{id}` - Delete mailbox

### DNS
- `GET /api/dns` - List DNS records
- `POST /api/dns` - Create record
- `PATCH /api/dns/{id}` - Update record
- `DELETE /api/dns/{id}` - Delete record

### Backups
- `GET /api/backups` - List backups
- `POST /api/backups` - Create backup
- `POST /api/backups/{id}/restore` - Restore backup

### Usage
- `GET /api/usage` - Resource usage summary

## Project Structure

```
betelmarket-host/
├── backend/
│   ├── app/
│   │   ├── Http/Controllers/    # API controllers
│   │   ├── Http/Middleware/     # RBAC middleware
│   │   ├── Jobs/               # Async queue jobs
│   │   ├── Models/             # Eloquent models
│   │   └── Services/Hestia/    # HestiaCP adapter layer
│   ├── config/hestia.php       # Hestia configuration
│   ├── database/migrations/    # DB schema
│   ├── database/seeders/       # Demo data
│   └── routes/api.php          # API routes
├── frontend/
│   └── src/
│       ├── app/                # Next.js pages
│       ├── components/         # UI components
│       ├── lib/                # API client, utilities
│       ├── stores/             # Zustand state
│       └── types/              # TypeScript types
└── docker-compose.yml
```

## Roles

- **Super Admin**: Full system access, manages plans, users, billing
- **Reseller**: Creates clients, manages their domains and services
- **Client**: Manages own domains, emails, DNS, backups

## Queue Jobs (Async)

All HestiaCP operations are processed asynchronously:
- `ProvisionHostingAccount` - Creates Hestia user
- `ProvisionDomain` - Creates domain in Hestia
- `ProvisionMailbox` - Creates email account
- `CreateBackup` - Initiates backup
- `RestoreBackup` - Restores from backup

## Environment Variables

See `backend/.env.example` for all configuration options including HestiaCP connection settings.
