# AntiTabs Monorepo

This repository contains the complete AntiTabs ecosystem:

- **website/** - Landing page and subscription management (React + Vite)
- **admin/** - Admin panel for user/coupon management (React + Vite)
- **electron/** - Desktop application (Electron + React + Vite)

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        AntiTabs Infrastructure                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PRODUCTION (main branch)           STAGING (dev branch)                │
│  ├─ antitabs.in                     ├─ staging.antitabs.in              │
│  ├─ admin.antitabs.in               ├─ admin-staging.antitabs.in        │
│  ├─ Supabase Production             ├─ Supabase Staging                 │
│  └─ Razorpay Live                   └─ Razorpay Test                    │
│                                                                         │
│  DESKTOP APP                                                            │
│  ├─ Auto-update via GitHub Releases                                     │
│  └─ Silent background check + "Update Available" prompt                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 20+ (use `nvm use` if you have nvm)
- npm or yarn

### Website

```bash
cd website
cp .env.example .env
# Edit .env with your Supabase credentials
npm install
npm run dev
```

### Admin Panel

```bash
cd admin
cp .env.example .env
# Edit .env with your Supabase credentials
npm install
npm run dev
```

### Electron App

```bash
cd electron
cp .env.example .env
# Edit .env with your Supabase credentials
npm install
npm run dev
```

## Deployment

### CI/CD Flow

- **Push to `dev` branch** → Auto-deploys to staging
- **Push to `main` branch** → Auto-deploys to production
- **Create git tag `v*`** → Builds and releases Electron apps

### Manual Deployment

#### Website
```bash
cd website
npm run build
# Upload ./build/ to Hostinger public_html
```

#### Admin Panel
```bash
cd admin
npm run build
# Upload ./dist/ to admin.antitabs.in public_html
```

#### Electron App
```bash
cd electron
npm run build:mac     # macOS
npm run build:win     # Windows
npm run build:linux   # Linux
# Installers are in ./release/
```

## GitHub Secrets Required

### Production
| Secret | Description |
|--------|-------------|
| `PROD_SUPABASE_URL` | Production Supabase URL |
| `PROD_SUPABASE_ANON_KEY` | Production anon key |
| `PROD_RAZORPAY_KEY_ID` | Live Razorpay key |
| `PROD_RAZORPAY_PLAN_MONTHLY` | Monthly plan ID |
| `PROD_RAZORPAY_PLAN_YEARLY` | Yearly plan ID |

### Staging
| Secret | Description |
|--------|-------------|
| `STAGING_SUPABASE_URL` | Staging Supabase URL |
| `STAGING_SUPABASE_ANON_KEY` | Staging anon key |
| `STAGING_RAZORPAY_KEY_ID` | Test Razorpay key |

### FTP (Hostinger)
| Secret | Description |
|--------|-------------|
| `FTP_SERVER` | Hostinger FTP server |
| `FTP_USERNAME_PROD` | Main site FTP user |
| `FTP_PASSWORD_PROD` | Main site FTP password |
| `FTP_USERNAME_STAGING` | Staging FTP user |
| `FTP_PASSWORD_STAGING` | Staging FTP password |
| `FTP_USERNAME_ADMIN` | Admin FTP user |
| `FTP_PASSWORD_ADMIN` | Admin FTP password |

## Electron Auto-Update

The desktop app automatically checks for updates on startup. When a new version is available:

1. User sees "Update Available" notification in Settings
2. Click "Download Update" to download
3. Click "Restart to Update" after download completes

### Creating a New Release

1. Update version in `electron/package.json`
2. Commit and push to main
3. Create and push a git tag:
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```
4. GitHub Actions builds for all platforms
5. Creates GitHub Release with installers
6. Users get automatic update notification

## Project Structure

```
.
├── .github/
│   └── workflows/
│       ├── website-deploy.yml
│       ├── admin-deploy.yml
│       └── electron-release.yml
├── website/                 # Landing page
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── admin/                   # Admin panel
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── electron/                # Desktop app
│   ├── src/
│   ├── electron/
│   ├── package.json
│   └── electron-builder.yml
└── README.md
```

## Development Workflow

1. Create feature branch from `dev`
2. Make changes, test locally
3. Push to `dev` → Auto-deploys to staging
4. Test on staging.antitabs.in
5. Create PR to merge to `main`
6. Merge → Auto-deploys to production

## License

Copyright © 2024 AntiTabs. All rights reserved.
