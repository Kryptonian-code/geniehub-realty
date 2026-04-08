# GenieHub Realty

A comprehensive real estate platform for Ghana built with React, TypeScript, PHP, and MySQL.

## Features

- **Property Listings**: Browse, search, and filter properties for sale and rent
- **Agent Profiles**: View agent information and their property listings
- **Lead Management**: Submit property inquiries that are stored in the database
- **Admin Dashboard**: Manage properties, agents, leads, FAQs, offices, and settings
- **Blog Management**: Publish and manage blog articles from the PHP admin dashboard
- **FAQ System**: Dynamic FAQ section powered by database content
- **Responsive Design**: Mobile-friendly interface with Ghanaian branding

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + ShadCN UI
- **Backend**: PHP + MySQL
- **Development**: XAMPP (Apache + MySQL + PHP)

## Setup Instructions

### Prerequisites

1. Install XAMPP from https://www.apachefriends.org/
2. Start Apache and MySQL services in XAMPP Control Panel

### Database Setup

1. Open phpMyAdmin at `http://localhost/phpmyadmin`
2. Create a new database named `geniehub_realty`
3. Import either [database.sql](c:\xampp\htdocs\geniehub-realty\database.sql) or [backend/migrations/database.sql](c:\xampp\htdocs\geniehub-realty\backend\migrations\database.sql)
4. If you already imported an older seeded version and want a true first-run state, run [scripts/reset-installed-data.sql](c:\xampp\htdocs\geniehub-realty\scripts\reset-installed-data.sql) in phpMyAdmin, then refresh `/admin/login`

### Backend Setup

1. Copy the entire project to `C:\xampp\htdocs\geniehub-realty`
2. The backend API will be available at `http://localhost/geniehub-realty/backend/api/`
3. Optional production-ready environment variables:
   - `DB_HOST`
   - `DB_NAME`
   - `DB_USER`
   - `DB_PASS`
   - `ALLOWED_ORIGINS`
   - `SITE_URL`

### Frontend Setup

1. Install dependencies:
   ```bash
   npm install
   ```
   Optional preflight check:
   ```bash
   npm run prepare:local
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser

### Admin Access

- **URL**: `http://localhost:5173/admin/login`
- **First use**: create the first admin account from the login screen
- **After setup**: sign in with the username and password you created
- **Email during setup**: optional
- **No seeded admin**: the project no longer ships with default credentials or sample records

## Project Structure

```text
geniehub-realty/
|-- backend/
|   |-- api/                PHP endpoints
|   |-- data/               runtime data helpers
|   |-- exports/            generated export files
|   |-- migrations/         database snapshots and SQL imports
|   |-- scripts/            backend maintenance scripts
|   |-- storage/            upload and generated storage
|   `-- config.php          database and session config
|-- deploy/
|   `-- infinityfree/       deployment packaging layout
|       |-- assets/
|       |-- backend/
|       `-- uploads/
|-- public/
|-- test-results/
|-- uploads/
|-- scripts/
|   `-- templates/
|-- src/
|   |-- data/
|   |-- integrations/
|   |-- components/
|   |   |-- admin/
|   |-- contexts/
|   |-- hooks/
|   |-- lib/
|   |-- pages/
|   |-- test/
|   `-- types/
|-- database.sql
`-- README.md
```

## Notes

- The repo now mirrors the higher-level operational folder layout used in `C:\xampp\htdocs\ghanaian-shepherd-main`.
- Admin authentication now follows the same username-first session login pattern used in `C:\xampp\htdocs\school-website`, including first-run admin creation when no account exists yet.
- Blog content is now database-backed on both the public site and the admin dashboard. No frontend seed data is required.
- For deployed SEO and sitemap output, set `SITE_URL` to your real public domain before generating the production package.
- For deployed API access, set `ALLOWED_ORIGINS` to the exact frontend origins allowed to call the backend.
- The SQL files now create schema only. They do not insert admin users, settings, properties, FAQs, agents, offices, or blog posts.
- The live app still runs from the same frontend and backend entry points, so this structure change does not alter URLs or break the current setup.

## Development

The frontend connects to the PHP backend via API calls. All important records persist in MySQL.

## Verification

- `npm run build`
- `npx tsc --noEmit`
- `C:\xampp\php\php.exe -l backend\config.php`
- `C:\xampp\php\php.exe -l backend\api\auth.php`
- `C:\xampp\php\php.exe -l backend\api\properties.php`
- `C:\xampp\php\php.exe -l backend\api\agents.php`
- `C:\xampp\php\php.exe -l backend\api\inquiries.php`
- `C:\xampp\php\php.exe -l backend\api\blog.php`
- `C:\xampp\php\php.exe -l backend\api\faqs.php`
- `C:\xampp\php\php.exe -l backend\api\settings.php`
- `C:\xampp\php\php.exe -l backend\api\offices.php`
