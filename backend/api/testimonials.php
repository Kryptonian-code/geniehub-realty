<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = getDBConnection();
ensureTestimonialsSchema($db);

switch ($method) {
    case 'GET':
        $where = isAuthenticated() && (($_GET['admin'] ?? '') === '1') ? '' : 'WHERE is_active = 1';
        $stmt = $db->query("
            SELECT id, name, role, photo, content, rating, sort_order, is_active, created_at, updated_at
            FROM testimonials
            {$where}
            ORDER BY sort_order ASC, created_at DESC
        ");
        jsonResponse($stmt->fetchAll());

    case 'POST':
        requireAdmin();
        $data = sanitizeInput(readJsonInput());
        foreach (['name', 'content'] as $field) {
            if (empty($data[$field])) {
                jsonResponse(['error' => ucfirst($field) . ' is required'], 422);
            }
        }

        $rating = max(1, min(5, (int) ($data['rating'] ?? 5)));
        $stmt = $db->prepare('
            INSERT INTO testimonials (name, role, photo, content, rating, sort_order, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $data['name'],
            $data['role'] ?? null,
            $data['photo'] ?? null,
            $data['content'],
            $rating,
            (int) ($data['sort_order'] ?? 0),
            boolValue($data['is_active'] ?? true) ? 1 : 0,
        ]);

        jsonResponse(['id' => (int) $db->lastInsertId(), 'message' => 'Testimonial created successfully'], 201);

    case 'PUT':
        requireAdmin();
        if (!isset($_GET['id'])) {
            jsonResponse(['error' => 'Testimonial ID required'], 400);
        }

        $data = sanitizeInput(readJsonInput());
        foreach (['name', 'content'] as $field) {
            if (empty($data[$field])) {
                jsonResponse(['error' => ucfirst($field) . ' is required'], 422);
            }
        }

        $rating = max(1, min(5, (int) ($data['rating'] ?? 5)));
        $stmt = $db->prepare('
            UPDATE testimonials
            SET name = ?, role = ?, photo = ?, content = ?, rating = ?, sort_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ');
        $stmt->execute([
            $data['name'],
            $data['role'] ?? null,
            $data['photo'] ?? null,
            $data['content'],
            $rating,
            (int) ($data['sort_order'] ?? 0),
            boolValue($data['is_active'] ?? true) ? 1 : 0,
            (int) $_GET['id'],
        ]);

        jsonResponse(['message' => 'Testimonial updated successfully']);

    case 'DELETE':
        requireAdmin();
        if (!isset($_GET['id'])) {
            jsonResponse(['error' => 'Testimonial ID required'], 400);
        }

        $photoStmt = $db->prepare('SELECT photo FROM testimonials WHERE id = ? LIMIT 1');
        $photoStmt->execute([(int) $_GET['id']]);
        $photoPath = $photoStmt->fetchColumn();

        $stmt = $db->prepare('DELETE FROM testimonials WHERE id = ?');
        $stmt->execute([(int) $_GET['id']]);
        deleteUploadedFile($photoPath !== false ? (string) $photoPath : null);
        jsonResponse(['message' => 'Testimonial deleted successfully']);

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}
?>
