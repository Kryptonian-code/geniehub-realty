<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = getDBConnection();
ensureAdminAuthSchema($db);

switch ($method) {
    case 'GET':
        if (($_GET['action'] ?? '') === 'setup-status') {
            $count = (int) $db->query('SELECT COUNT(*) FROM admins WHERE is_active = 1')->fetchColumn();
            jsonResponse(['has_admin' => $count > 0]);
        }

        $admin = currentAdmin();
        jsonResponse([
            'user' => $admin,
            'csrf_token' => $_SESSION['csrf_token'] ?? null,
        ]);

    case 'POST':
        $data = sanitizeInput(readJsonInput());
        if (($data['action'] ?? '') === 'logout') {
            $_SESSION = [];
            if (ini_get('session.use_cookies')) {
                $params = session_get_cookie_params();
                setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
            }
            session_destroy();
            jsonResponse(['success' => true]);
        }

        if (($data['action'] ?? '') === 'bootstrap-admin') {
            enforceRateLimit('auth-bootstrap', 5, 600);
            $count = (int) $db->query('SELECT COUNT(*) FROM admins')->fetchColumn();
            if ($count > 0) {
                jsonResponse(['error' => 'An admin account already exists'], 409);
            }

            $username = trim((string) ($data['username'] ?? ''));
            $displayName = trim((string) ($data['display_name'] ?? ''));
            $email = trim((string) ($data['email'] ?? ''));
            $password = (string) ($data['password'] ?? '');

            if ($username === '' || $displayName === '' || $password === '') {
                jsonResponse(['error' => 'Username, display name, and password are required'], 422);
            }

            if (!preg_match('/^[a-zA-Z0-9._-]{3,80}$/', $username)) {
                jsonResponse(['error' => 'Username must be 3 to 80 characters and use only letters, numbers, dots, underscores, or hyphens'], 422);
            }

            if (strlen($displayName) < 2 || strlen($displayName) > 255) {
                jsonResponse(['error' => 'Display name must be between 2 and 255 characters'], 422);
            }

            if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                jsonResponse(['error' => 'Please provide a valid email address'], 422);
            }

            if (strlen($password) < 8) {
                jsonResponse(['error' => 'Password must be at least 8 characters long'], 422);
            }

            $stmt = $db->prepare('INSERT INTO admins (username, display_name, name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([
                $username,
                $displayName,
                $displayName,
                $email !== '' ? $email : null,
                password_hash($password, PASSWORD_DEFAULT),
                'admin',
                1,
            ]);

            session_regenerate_id(true);
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
            $_SESSION['admin'] = [
                'id' => (int) $db->lastInsertId(),
                'username' => $username,
                'display_name' => $displayName,
                'name' => $displayName,
                'email' => $email !== '' ? $email : null,
                'role' => 'admin',
            ];

            jsonResponse([
                'user' => $_SESSION['admin'],
                'csrf_token' => $_SESSION['csrf_token'],
                'message' => 'Admin account created successfully',
            ], 201);
        }

        enforceRateLimit('auth-login', 5, 600);
        if (empty($data['username']) || empty($data['password'])) {
            jsonResponse(['error' => 'Username and password are required'], 422);
        }

        $stmt = $db->prepare('SELECT id, username, display_name, name, email, password_hash, role, is_active FROM admins WHERE username = ? LIMIT 1');
        $stmt->execute([$data['username']]);
        $admin = $stmt->fetch();

        if (!$admin || (int) ($admin['is_active'] ?? 1) !== 1 || !password_verify((string) $data['password'], $admin['password_hash'])) {
            jsonResponse(['error' => 'Invalid username or password'], 401);
        }

        session_regenerate_id(true);
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        $_SESSION['admin'] = [
            'id' => (int) $admin['id'],
            'username' => $admin['username'],
            'display_name' => $admin['display_name'] ?: $admin['name'],
            'name' => $admin['display_name'] ?: $admin['name'],
            'email' => $admin['email'],
            'role' => $admin['role'],
        ];

        jsonResponse([
            'user' => $_SESSION['admin'],
            'csrf_token' => $_SESSION['csrf_token'],
        ]);

    case 'DELETE':
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
        }
        session_destroy();

        jsonResponse(['success' => true]);

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}
?>
