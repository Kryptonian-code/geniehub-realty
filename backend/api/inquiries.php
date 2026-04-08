<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = getDBConnection();
ensureInquirySchema($db);

switch ($method) {
    case 'GET':
        requireAdmin();
        $stmt = $db->query('
            SELECT i.*, p.title AS property_title
            FROM inquiries i
            LEFT JOIN properties p ON p.id = i.property_id
            ORDER BY i.created_at DESC
        ');
        jsonResponse($stmt->fetchAll());

    case 'POST':
        enforceRateLimit('inquiry-ip', 10, 3600);
        $data = sanitizeInput(readJsonInput());
        foreach (['name', 'phone', 'message'] as $field) {
            if (empty($data[$field])) {
                jsonResponse(['error' => ucfirst($field) . ' is required'], 422);
            }
        }

        if (!empty($data['email']) && !filter_var((string) $data['email'], FILTER_VALIDATE_EMAIL)) {
            jsonResponse(['error' => 'Please provide a valid email address'], 422);
        }

        $stmt = $db->prepare('
            INSERT INTO inquiries (property_id, name, email, phone, message, status)
            VALUES (?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            !empty($data['property_id']) ? (int) $data['property_id'] : null,
            $data['name'],
            $data['email'] ?? null,
            $data['phone'],
            $data['message'],
            'new',
        ]);

        jsonResponse(['id' => (int) $db->lastInsertId(), 'message' => 'Inquiry submitted successfully'], 201);

    case 'PUT':
        requireAdmin();
        if (!isset($_GET['id'])) {
            jsonResponse(['error' => 'Inquiry ID required'], 400);
        }

        $data = sanitizeInput(readJsonInput());
        $allowed = ['new', 'contacted', 'responded', 'closed'];
        $status = $data['status'] ?? 'new';
        if (!in_array($status, $allowed, true)) {
            jsonResponse(['error' => 'Invalid inquiry status'], 422);
        }

        $stmt = $db->prepare('UPDATE inquiries SET status = ? WHERE id = ?');
        $stmt->execute([$status, (int) $_GET['id']]);
        jsonResponse(['message' => 'Inquiry updated successfully']);

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}
?>
