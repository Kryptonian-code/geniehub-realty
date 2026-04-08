# GenieHub Realty

GenieHub Realty is a Ghana-focused real estate platform built with React, TypeScript, PHP, and MySQL. It includes a public property website, an admin dashboard, image uploads, inquiries, appointments, valuations, blog management, FAQs, offices, testimonials, and site-wide settings.

This repository is designed to run locally with XAMPP and to be packaged for shared hosting environments such as InfinityFree.

## What This Project Includes

- Public property browsing with filters, detail pages, agent profiles, blog posts, FAQs, and contact flows
- Admin dashboard for managing properties, agents, inquiries, FAQs, offices, blog posts, testimonials, settings, appointments, valuations, and taxonomy data
- PHP session-based authentication with first-run admin account creation
- MySQL-backed persistence for all important content
- Image upload support for properties, agents, blog posts, and testimonials
- SEO support including metadata, sitemap generation, robots.txt, and structured data

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: PHP
- Database: MySQL / MariaDB
- Local environment: XAMPP

## Requirements

Before running the project, make sure you have:

- XAMPP installed
- Apache running
- MySQL running
- Node.js and npm installed

## Quick Start

### 1. Place the project in XAMPP

Put the project in your XAMPP htdocs directory. Example:

```text
C:\xampp\htdocs\geniehub-realty
```

### 2. Create the database

Open phpMyAdmin and create a database named:

```text
geniehub_realty
```

### 3. Import the schema

Import one of the SQL files below into the new database:

- `database.sql`
- `backend/migrations/database.sql`

Both files describe the current schema. Use one, not both.

### 4. Install frontend dependencies

```bash
npm install
```

### 5. Start the frontend

```bash
npm run dev
```

Open the frontend in your browser:

```text
http://localhost:5173
```

### 6. Use the backend through XAMPP

The PHP backend is served through Apache from the project directory. Example API base URL:

```text
http://localhost/geniehub-realty/backend/api/
```

## First-Time Admin Setup

This project does not ship with a default admin username or password.

On a fresh database:

1. Open the admin login page
2. The system will detect that no admin user exists
3. Create the first admin account from the setup screen
4. Sign in with the credentials you created

Typical local admin URL:

```text
http://localhost:5173/admin/login
```

## Configuration

The application supports environment-based configuration. The backend reads these values from environment variables and falls back to local defaults where appropriate.

An example file is provided:

- `.env.example`

### Supported variables

- `DB_HOST`
- `DB_NAME`
- `DB_USER`
- `DB_PASS`
- `SITE_URL`
- `ALLOWED_ORIGINS`
- `SESSION_LIFETIME_SECONDS`
- `SESSION_NAME`
- `SESSION_SAMESITE`

### Example values

```env
DB_HOST=localhost
DB_NAME=geniehub_realty
DB_USER=root
DB_PASS=
SITE_URL=http://localhost/geniehub-realty
ALLOWED_ORIGINS=http://localhost,http://127.0.0.1,http://localhost:5173,http://127.0.0.1:5173
```

### What these values control

- `DB_*` values configure the MySQL connection
- `SITE_URL` is used for sitemap and canonical URL generation
- `ALLOWED_ORIGINS` controls which frontend origins may call the backend API
- session values control PHP session behavior

## Project Structure

```text
geniehub-realty/
|-- backend/
|   |-- api/                PHP API endpoints
|   |-- data/               runtime data files
|   |-- exports/            generated exports
|   |-- migrations/         schema snapshots
|   |-- scripts/            backend maintenance scripts
|   |-- storage/            runtime storage
|   `-- config.php          backend bootstrap and shared helpers
|-- deploy/
|   `-- infinityfree/       generated deployment package
|-- public/                 static frontend assets
|-- scripts/                local and deployment helper scripts
|-- src/                    React frontend source
|-- uploads/                uploaded media
|-- database.sql            main database schema
`-- README.md
```

## Useful Commands

### Development

```bash
npm run dev
```

Starts the Vite development server.

### Build

```bash
npm run build
```

Builds the frontend for production.

### Tests

```bash
npm test
```

Runs the Vitest test suite.

### Local environment check

```bash
npm run prepare:local
```

Runs local readiness checks for the project.

### Prepare shared-hosting deployment package

```bash
npm run prepare:infinityfree
```

Builds the frontend and prepares the package in `deploy/infinityfree`.

## Deployment Notes

This repository includes deployment helpers for shared hosting.

Before generating a production package, make sure:

- `SITE_URL` matches the real public domain
- `ALLOWED_ORIGINS` includes the real frontend origin
- your production database credentials are set

For InfinityFree packaging details, see:

- `DEPLOY_INFINITYFREE.md`

## Data and Content Behavior

- The SQL schema does not seed admin credentials
- The SQL schema does not seed demo content for properties, agents, settings, FAQs, blog posts, or testimonials
- Taxonomy tables may contain starter values depending on your imported schema version
- All important site content is intended to persist in MySQL

## Media Uploads

The application supports uploads for:

- property images
- agent photos
- blog images
- testimonial photos

Uploads are stored under the `uploads/` directory. The repository only keeps placeholder files there so real uploaded media is not committed.

## SEO

The project includes:

- dynamic page metadata
- sitemap generation
- robots.txt
- structured data support

For correct production SEO output, set `SITE_URL` before generating the production sitemap.

## Manual Smoke Test Checklist

After local setup or deployment, verify these flows:

- homepage loads
- property listing page loads
- property detail page loads
- inquiry submission works
- appointment submission works
- valuation submission works
- admin login works
- first admin setup works on a clean database
- settings update reflects on the public site
- property create, edit, and delete work
- image upload and delete work
- `robots.txt` is accessible
- `sitemap.xml` is accessible

## Troubleshooting

### The admin setup screen does not appear

That usually means the database already contains at least one admin user. Remove the existing admin rows or reset the installed data before testing the first-run flow.

### The frontend loads but API requests fail

Check:

- Apache is running
- MySQL is running
- the project is inside `htdocs`
- the database exists
- the imported schema matches the current code
- `ALLOWED_ORIGINS` includes the frontend origin you are using

### Uploaded images do not appear

Check:

- the `uploads/` folder exists
- Apache can read the uploaded files
- the backend is writing paths correctly
- the related database rows were saved successfully

## License

Add your preferred license information here before public distribution if needed.
