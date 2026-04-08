<?php
declare(strict_types=1);

function envValue(string $key, ?string $default = null): ?string {
    $value = getenv($key);
    if ($value === false) {
        return $default;
    }

    $trimmed = trim($value);
    return $trimmed === '' ? $default : $trimmed;
}

function envInt(string $key, int $default): int {
    $value = envValue($key);
    if ($value === null) {
        return $default;
    }

    $parsed = filter_var($value, FILTER_VALIDATE_INT);
    return $parsed === false ? $default : (int) $parsed;
}

function envList(string $key, array $default = []): array {
    $value = envValue($key);
    if ($value === null) {
        return $default;
    }

    $items = array_filter(array_map(static fn(string $item): string => trim($item), explode(',', $value)));
    return array_values(array_unique($items));
}

function isHttpsRequest(): bool {
    if (!empty($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) !== 'off') {
        return true;
    }

    $forwardedProto = $_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '';
    return strtolower((string) $forwardedProto) === 'https';
}

function clientIpAddress(): string {
    $forwardedFor = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
    if ($forwardedFor !== '') {
        $parts = array_map('trim', explode(',', $forwardedFor));
        foreach ($parts as $part) {
            if (filter_var($part, FILTER_VALIDATE_IP)) {
                return $part;
            }
        }
    }

    $remoteAddr = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    return filter_var($remoteAddr, FILTER_VALIDATE_IP) ? $remoteAddr : 'unknown';
}

function baseStoragePath(): string {
    return __DIR__ . DIRECTORY_SEPARATOR . 'storage';
}

function ensureDirectory(string $path): void {
    if (!is_dir($path) && !mkdir($path, 0775, true) && !is_dir($path)) {
        jsonResponse(['error' => 'Unable to prepare storage directory'], 500);
    }
}

function rateLimitStoragePath(): string {
    $path = baseStoragePath() . DIRECTORY_SEPARATOR . 'rate-limits';
    ensureDirectory(baseStoragePath());
    ensureDirectory($path);
    return $path;
}

function logServerError(string $message, ?Throwable $exception = null): void {
    $payload = '[' . date('Y-m-d H:i:s') . '] ' . $message;
    if ($exception instanceof Throwable) {
        $payload .= ' | ' . $exception->getMessage() . ' | ' . $exception->getFile() . ':' . $exception->getLine();
    }
    error_log($payload);
}

function configureCors(): void {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowedOrigins = envList('ALLOWED_ORIGINS', [
        'http://localhost',
        'http://127.0.0.1',
        'http://localhost:8080',
        'http://127.0.0.1:8080',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ]);

    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-Token');
    header('Vary: Origin');

    if ($origin === '') {
        return;
    }

    if (in_array($origin, $allowedOrigins, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
        return;
    }

    http_response_code(403);
    echo json_encode(['error' => 'Origin not allowed'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

configureCors();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$sessionLifetime = envInt('SESSION_LIFETIME_SECONDS', 60 * 60 * 8);
if (PHP_SAPI !== 'cli') {
    if (session_status() === PHP_SESSION_NONE) {
        session_name(envValue('SESSION_NAME', 'geniehub_admin'));
        session_set_cookie_params([
            'lifetime' => $sessionLifetime,
            'path' => '/',
            'secure' => isHttpsRequest(),
            'httponly' => true,
            'samesite' => envValue('SESSION_SAMESITE', 'Lax') ?? 'Lax',
        ]);
        session_start([
            'cookie_httponly' => true,
            'cookie_samesite' => envValue('SESSION_SAMESITE', 'Lax') ?? 'Lax',
            'cookie_secure' => isHttpsRequest(),
            'use_strict_mode' => true,
            'gc_maxlifetime' => $sessionLifetime,
        ]);
    }

    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
}

define('DB_HOST', envValue('DB_HOST', 'localhost'));
define('DB_NAME', envValue('DB_NAME', 'geniehub_realty'));
define('DB_USER', envValue('DB_USER', 'root'));
define('DB_PASS', envValue('DB_PASS', ''));

function getDBConnection(): PDO {
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]
        );

        return $pdo;
    } catch (PDOException $e) {
        logServerError('Database connection failed', $e);
        jsonResponse(['error' => 'Database connection failed'], 500);
    }
}

function jsonResponse(array $payload, int $statusCode = 200): void {
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function getRawInput(): string {
    static $rawInput = null;

    if ($rawInput !== null) {
        return $rawInput;
    }

    $rawInput = file_get_contents('php://input');
    return $rawInput === false ? '' : $rawInput;
}

function readJsonInput(): array {
    $raw = getRawInput();
    if (!$raw) {
        return [];
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        jsonResponse(['error' => 'Invalid JSON data'], 400);
    }

    return $decoded;
}

function sanitizeInput($value) {
    if (is_array($value)) {
        return array_map('sanitizeInput', $value);
    }

    if ($value === null) {
        return null;
    }

    if (is_bool($value) || is_int($value) || is_float($value)) {
        return $value;
    }

    return trim((string) $value);
}

function getRequestHeadersCompat(): array {
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        if (is_array($headers)) {
            return $headers;
        }
    }

    $headers = [];
    foreach ($_SERVER as $key => $value) {
        if (str_starts_with($key, 'HTTP_')) {
            $headerName = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($key, 5)))));
            $headers[$headerName] = $value;
        }
    }
    return $headers;
}

function currentAdmin(): ?array {
    if (!isset($_SESSION['admin'])) {
        return null;
    }

    return $_SESSION['admin'];
}

function requireAuth(): array {
    $admin = currentAdmin();
    if (!$admin) {
        jsonResponse(['error' => 'Authentication required'], 401);
    }

    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if (!in_array($method, ['GET', 'OPTIONS'], true)) {
        $headers = getRequestHeadersCompat();
        $headerToken = $headers['X-CSRF-Token'] ?? $headers['X-Csrf-Token'] ?? '';
        $bodyToken = '';
        if (isset($_POST['csrf_token'])) {
            $bodyToken = trim((string) $_POST['csrf_token']);
        }
        if ($bodyToken === '') {
            $raw = getRawInput();
            if ($raw !== '') {
                $decoded = json_decode($raw, true);
                if (is_array($decoded) && isset($decoded['csrf_token'])) {
                    $bodyToken = trim((string) $decoded['csrf_token']);
                }
            }
        }
        $sessionToken = $_SESSION['csrf_token'] ?? '';

        $providedToken = $headerToken !== '' ? $headerToken : $bodyToken;
        if ($providedToken === '' || $sessionToken === '' || !hash_equals($sessionToken, $providedToken)) {
            jsonResponse(['error' => 'Invalid CSRF token'], 419);
        }
    }

    return $admin;
}

function isAuthenticated(): bool {
    return currentAdmin() !== null;
}

function currentAdminRole(): string {
    $admin = currentAdmin();
    return strtolower((string) ($admin['role'] ?? ''));
}

function requireAdmin(): array {
    $admin = requireAuth();
    $role = strtolower((string) ($admin['role'] ?? ''));
    if (!in_array($role, ['admin', 'superadmin'], true)) {
        jsonResponse(['error' => 'Admin privileges required'], 403);
    }

    return $admin;
}

function enforceRateLimit(string $bucket, int $maxAttempts, int $windowSeconds, ?string $identifier = null): void {
    $resolvedIdentifier = $identifier !== null && trim($identifier) !== '' ? trim($identifier) : clientIpAddress();
    $key = hash('sha256', strtolower($bucket . '|' . $resolvedIdentifier));
    $filePath = rateLimitStoragePath() . DIRECTORY_SEPARATOR . $key . '.json';
    $now = time();
    $payload = [
        'count' => 0,
        'window_started_at' => $now,
    ];

    if (is_file($filePath)) {
        $raw = file_get_contents($filePath);
        $decoded = $raw ? json_decode($raw, true) : null;
        if (is_array($decoded)) {
            $payload = array_merge($payload, $decoded);
        }
    }

    $windowStartedAt = (int) ($payload['window_started_at'] ?? $now);
    if (($now - $windowStartedAt) >= $windowSeconds) {
        $payload = [
            'count' => 0,
            'window_started_at' => $now,
        ];
    }

    $payload['count'] = (int) ($payload['count'] ?? 0) + 1;
    file_put_contents($filePath, json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);

    if ($payload['count'] > $maxAttempts) {
        $retryAfter = max(1, $windowSeconds - ($now - (int) $payload['window_started_at']));
        header('Retry-After: ' . $retryAfter);
        jsonResponse(['error' => 'Too many requests. Please try again later.'], 429);
    }
}

function boolValue($value): bool {
    if (is_bool($value)) {
        return $value;
    }

    return in_array(strtolower((string) $value), ['1', 'true', 'yes', 'on'], true);
}

function slugify(string $value): string {
    $slug = strtolower($value);
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug) ?? '';
    return trim($slug, '-') ?: 'listing';
}

function propertyFeatureFlags(array $features): array {
    $normalized = array_map('strtolower', $features);

    return [
        'hasKitchen' => in_array('kitchen', $normalized, true),
        'hasAC' => in_array('air-conditioning', $normalized, true),
        'hasSecurityPost' => in_array('security-post', $normalized, true),
        'isGatedCommunity' => in_array('gated-community', $normalized, true),
        'hasWater' => in_array('water', $normalized, true),
        'hasElectricity' => in_array('electricity', $normalized, true),
    ];
}

function mapPropertyRow(PDO $db, array $property): array {
    $imageStmt = $db->prepare('SELECT image_path FROM property_images WHERE property_id = ? ORDER BY sort_order ASC, id ASC');
    $imageStmt->execute([$property['id']]);
    $images = $imageStmt->fetchAll(PDO::FETCH_COLUMN);

    $featureStmt = $db->prepare('
        SELECT pf.name
        FROM property_features pf
        INNER JOIN property_feature_map pfm ON pfm.feature_id = pf.id
        WHERE pfm.property_id = ?
        ORDER BY pf.name ASC
    ');
    $featureStmt->execute([$property['id']]);
    $features = $featureStmt->fetchAll(PDO::FETCH_COLUMN);
    $flags = propertyFeatureFlags($features);

    return array_merge($property, [
        'images' => $images,
        'features' => $features,
        'nearby_landmarks' => [],
        'hasKitchen' => $flags['hasKitchen'],
        'hasAC' => $flags['hasAC'],
        'hasSecurityPost' => $flags['hasSecurityPost'],
        'isGatedCommunity' => $flags['isGatedCommunity'],
        'hasWater' => $flags['hasWater'],
        'hasElectricity' => $flags['hasElectricity'],
    ]);
}

function getOrCreateLookupId(PDO $db, string $table, string $name): int {
    $select = $db->prepare("SELECT id FROM {$table} WHERE name = ?");
    $select->execute([$name]);
    $existingId = $select->fetchColumn();
    if ($existingId) {
        return (int) $existingId;
    }

    $insert = $db->prepare("INSERT INTO {$table} (name) VALUES (?)");
    $insert->execute([$name]);
    return (int) $db->lastInsertId();
}

function deleteUploadedFile(?string $relativePath): void {
    if ($relativePath === null || trim($relativePath) === '') {
        return;
    }

    $normalized = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, (string) $relativePath);
    $normalized = ltrim($normalized, DIRECTORY_SEPARATOR);
    if (!str_starts_with($normalized, 'uploads' . DIRECTORY_SEPARATOR)) {
        return;
    }

    $absolutePath = projectRootPath() . DIRECTORY_SEPARATOR . $normalized;
    $resolvedProjectRoot = realpath(projectRootPath());
    $resolvedTarget = realpath($absolutePath);

    if ($resolvedProjectRoot === false || $resolvedTarget === false) {
        return;
    }

    if (!str_starts_with($resolvedTarget, $resolvedProjectRoot . DIRECTORY_SEPARATOR)) {
        return;
    }

    if (is_file($resolvedTarget)) {
        @unlink($resolvedTarget);
    }
}

function tableExists(PDO $db, string $table): bool {
    $stmt = $db->prepare('
        SELECT COUNT(*)
        FROM information_schema.tables
        WHERE table_schema = DATABASE() AND table_name = ?
    ');
    $stmt->execute([$table]);
    return (bool) $stmt->fetchColumn();
}

function getColumnMap(PDO $db, string $table): array {
    $columns = [];
    $stmt = $db->query("SHOW COLUMNS FROM {$table}");
    foreach ($stmt->fetchAll() as $column) {
        $columns[$column['Field']] = $column;
    }
    return $columns;
}

function ensureAdminAuthSchema(PDO $db): void {
    $columnMap = getColumnMap($db, 'admins');
    $columns = array_keys($columnMap);

    if (!in_array('username', $columns, true)) {
        $db->exec("ALTER TABLE admins ADD COLUMN username VARCHAR(80) NULL UNIQUE AFTER id");
    }

    if (!in_array('display_name', $columns, true)) {
        $db->exec("ALTER TABLE admins ADD COLUMN display_name VARCHAR(255) NULL AFTER username");
    }

    if (!in_array('is_active', $columns, true)) {
        $db->exec("ALTER TABLE admins ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER role");
    }

    if (isset($columnMap['email']) && strtoupper((string) $columnMap['email']['Null']) !== 'YES') {
        $db->exec("ALTER TABLE admins MODIFY COLUMN email VARCHAR(255) NULL");
    }

    $rows = $db->query('SELECT id, name, email, username, display_name FROM admins ORDER BY id ASC')->fetchAll();
    $update = $db->prepare('UPDATE admins SET username = ?, display_name = ? WHERE id = ?');

    foreach ($rows as $row) {
        $username = trim((string) ($row['username'] ?? ''));
        if ($username === '') {
            $email = (string) ($row['email'] ?? '');
            $fallback = $email !== '' ? strtok($email, '@') : ('admin' . $row['id']);
            $username = preg_replace('/[^a-z0-9._-]/i', '', strtolower((string) $fallback)) ?: ('admin' . $row['id']);
        }

        $displayName = trim((string) ($row['display_name'] ?? ''));
        if ($displayName === '') {
            $displayName = trim((string) ($row['name'] ?? '')) ?: ucfirst($username);
        }

        $update->execute([$username, $displayName, (int) $row['id']]);
    }
}

function ensureInquirySchema(PDO $db): void {
    $columnMap = getColumnMap($db, 'inquiries');
    if (isset($columnMap['email']) && strtoupper((string) $columnMap['email']['Null']) !== 'YES') {
        $db->exec("ALTER TABLE inquiries MODIFY COLUMN email VARCHAR(255) NULL");
    }
}

function ensureAgentSchema(PDO $db): void {
    $columnMap = getColumnMap($db, 'agents');
    if (!isset($columnMap['specialization'])) {
        $db->exec("ALTER TABLE agents ADD COLUMN specialization VARCHAR(255) NULL AFTER bio");
    }
}

function ensurePropertySchema(PDO $db): void {
    $columnMap = getColumnMap($db, 'properties');

    if (!isset($columnMap['meta_title'])) {
        $db->exec("ALTER TABLE properties ADD COLUMN meta_title VARCHAR(500) NULL AFTER agent_id");
    }

    if (!isset($columnMap['meta_description'])) {
        $db->exec("ALTER TABLE properties ADD COLUMN meta_description TEXT NULL AFTER meta_title");
    }

    if (!isset($columnMap['og_image'])) {
        $db->exec("ALTER TABLE properties ADD COLUMN og_image VARCHAR(500) NULL AFTER meta_description");
    }

    if (!isset($columnMap['canonical_url'])) {
        $db->exec("ALTER TABLE properties ADD COLUMN canonical_url VARCHAR(500) NULL AFTER og_image");
    }
}

function ensureBlogSchema(PDO $db): void {
    if (!tableExists($db, 'blog_posts')) {
        $db->exec('
            CREATE TABLE blog_posts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(500) NOT NULL,
                slug VARCHAR(500) UNIQUE NOT NULL,
                excerpt TEXT,
                content LONGTEXT,
                category VARCHAR(120) DEFAULT "market-insights",
                cover_image VARCHAR(500) DEFAULT NULL,
                author VARCHAR(255) DEFAULT "GenieHub Realty",
                meta_title VARCHAR(500) DEFAULT NULL,
                meta_description TEXT DEFAULT NULL,
                is_published TINYINT(1) NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        ');
        return;
    }

    $columnMap = getColumnMap($db, 'blog_posts');

    if (!isset($columnMap['excerpt'])) {
        $db->exec("ALTER TABLE blog_posts ADD COLUMN excerpt TEXT NULL AFTER slug");
    }

    if (!isset($columnMap['category'])) {
        $db->exec("ALTER TABLE blog_posts ADD COLUMN category VARCHAR(120) DEFAULT 'market-insights' AFTER content");
    }

    if (!isset($columnMap['cover_image'])) {
        $db->exec("ALTER TABLE blog_posts ADD COLUMN cover_image VARCHAR(500) NULL AFTER category");
    }

    if (!isset($columnMap['author'])) {
        $db->exec("ALTER TABLE blog_posts ADD COLUMN author VARCHAR(255) DEFAULT 'GenieHub Realty' AFTER cover_image");
    }

    if (!isset($columnMap['is_published'])) {
        $db->exec("ALTER TABLE blog_posts ADD COLUMN is_published TINYINT(1) NOT NULL DEFAULT 1 AFTER meta_description");
    }

    if (!isset($columnMap['updated_at'])) {
        $db->exec("ALTER TABLE blog_posts ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at");
    }
}

function ensureTestimonialsSchema(PDO $db): void {
    if (!tableExists($db, 'testimonials')) {
        $db->exec('
            CREATE TABLE testimonials (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                role VARCHAR(255) DEFAULT NULL,
                photo VARCHAR(500) DEFAULT NULL,
                content TEXT NOT NULL,
                rating INT NOT NULL DEFAULT 5,
                sort_order INT NOT NULL DEFAULT 0,
                is_active TINYINT(1) NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        ');
        return;
    }

    $columnMap = getColumnMap($db, 'testimonials');

    if (!isset($columnMap['photo'])) {
        $db->exec("ALTER TABLE testimonials ADD COLUMN photo VARCHAR(500) NULL AFTER role");
    }

    if (!isset($columnMap['sort_order'])) {
        $db->exec("ALTER TABLE testimonials ADD COLUMN sort_order INT NOT NULL DEFAULT 0 AFTER rating");
    }

    if (!isset($columnMap['is_active'])) {
        $db->exec("ALTER TABLE testimonials ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER sort_order");
    }

    if (!isset($columnMap['updated_at'])) {
        $db->exec("ALTER TABLE testimonials ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at");
    }
}

function ensureValuationSchema(PDO $db): void {
    if (tableExists($db, 'valuations')) {
        return;
    }

    $db->exec('
        CREATE TABLE valuations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            location VARCHAR(255) NOT NULL,
            property_type VARCHAR(120) NOT NULL,
            size VARCHAR(255) NOT NULL,
            property_condition VARCHAR(120) NOT NULL,
            expected_price DECIMAL(15,2) DEFAULT NULL,
            contact_name VARCHAR(255) NOT NULL,
            contact_phone VARCHAR(20) NOT NULL,
            contact_email VARCHAR(255) DEFAULT NULL,
            notes TEXT DEFAULT NULL,
            status ENUM("new", "contacted", "closed") DEFAULT "new",
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    ');
}

function ensureAppointmentSchema(PDO $db): void {
    if (tableExists($db, 'appointments')) {
        return;
    }

    $db->exec('
        CREATE TABLE appointments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            property_id INT NULL,
            agent_id INT NULL,
            client_name VARCHAR(255) NOT NULL,
            client_phone VARCHAR(20) NOT NULL,
            client_email VARCHAR(255) DEFAULT NULL,
            preferred_date DATE NOT NULL,
            preferred_time VARCHAR(50) NOT NULL,
            message TEXT DEFAULT NULL,
            status ENUM("pending", "confirmed", "completed", "cancelled") DEFAULT "pending",
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_appointments_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL,
            CONSTRAINT fk_appointments_agent FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL
        )
    ');
}

function projectRootPath(): string {
    return dirname(__DIR__);
}

function uploadsRootPath(): string {
    return projectRootPath() . DIRECTORY_SEPARATOR . 'uploads';
}

?>
