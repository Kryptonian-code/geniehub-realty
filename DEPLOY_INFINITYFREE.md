# InfinityFree Deployment

This project is prepared for an InfinityFree-style shared hosting deployment:

- the built React app lives in the web root
- the PHP backend lives in `/backend`
- runtime uploads live in `/uploads`

## 1. Prepare the deployment bundle

From the project root run:

```powershell
npm.cmd run prepare:infinityfree
```

You can also use:

```powershell
npm.cmd run deploy:infinityfree
```

Both commands prepare the same InfinityFree bundle.

That command will:

- build the frontend
- create `deploy/infinityfree`
- copy the frontend build into the web root bundle
- copy the full backend into `deploy/infinityfree/backend`
- create `404.html` from the built `index.html`
- generate host-ready `.htaccess` files
- prepare `uploads/property-images`
- prepare `uploads/agent-photos`

## 2. Upload to InfinityFree

Upload the contents of `deploy/infinityfree` into `public_html`.

After upload, the structure should look like this:

```text
public_html/
|-- .htaccess
|-- index.html
|-- 404.html
|-- assets/
|-- backend/
`-- uploads/
    |-- property-images/
    `-- agent-photos/
```

## 3. Database import

In InfinityFree phpMyAdmin:

1. create the MySQL database
2. import `backend/database.sql`

Do not expect a seeded admin user. After deployment, open `/admin/login` and create the first admin account from the setup screen.

## 4. Update backend credentials

Edit the uploaded `backend/config.php` and set the production database values:

```php
define('DB_HOST', 'YOUR_INFINITYFREE_DB_HOST');
define('DB_NAME', 'YOUR_INFINITYFREE_DB_NAME');
define('DB_USER', 'YOUR_INFINITYFREE_DB_USER');
define('DB_PASS', 'YOUR_INFINITYFREE_DB_PASSWORD');
```

## 5. Smoke test

Check:

- `https://your-domain.example/`
- `https://your-domain.example/admin/login`
- `https://your-domain.example/backend/api/settings.php`

If the homepage loads but client-side routes fail, the usual cause is that the root `.htaccess` file was not uploaded.
