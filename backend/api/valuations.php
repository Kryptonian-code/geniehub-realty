<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = getDBConnection();
ensureValuationSchema($db);

switch ($method) {
    case 'GET':
        requireAdmin();
        $stmt = $db->query('
            SELECT id, location, property_type, size, property_condition, expected_price, contact_name,
                   contact_phone, contact_email, notes, status, created_at, updated_at
            FROM valuations
            ORDER BY created_at DESC
        ');
        jsonResponse($stmt->fetchAll());

    case 'POST':
        $data = sanitizeInput(readJsonInput());

        foreach (['location', 'property_type', 'size', 'property_condition', 'contact_name', 'contact_phone'] as $field) {
            if (empty($data[$field])) {
                jsonResponse(['error' => ucfirst(str_replace('_', ' ', $field)) . ' is required'], 422);
            }
        }

        if (!empty($data['contact_email']) && !filter_var((string) $data['contact_email'], FILTER_VALIDATE_EMAIL)) {
            jsonResponse(['error' => 'Please provide a valid email address'], 422);
        }

        $requestedStatus = $data['status'] ?? 'new';
        $status = in_array($requestedStatus, ['new', 'contacted', 'closed'], true) ? $requestedStatus : 'new';
        $stmt = $db->prepare('
            INSERT INTO valuations (
                location, property_type, size, property_condition, expected_price,
                contact_name, contact_phone, contact_email, notes, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $data['location'],
            $data['property_type'],
            $data['size'],
            $data['property_condition'],
            $data['expected_price'] ?? null,
            $data['contact_name'],
            $data['contact_phone'],
            $data['contact_email'] ?? null,
            $data['notes'] ?? null,
            $status,
        ]);

        jsonResponse(['id' => (int) $db->lastInsertId(), 'message' => 'Valuation request saved successfully'], 201);

    case 'PUT':
        requireAdmin();
        if (!isset($_GET['id'])) {
            jsonResponse(['error' => 'Valuation ID required'], 400);
        }

        $data = sanitizeInput(readJsonInput());
        foreach (['location', 'property_type', 'size', 'property_condition', 'contact_name', 'contact_phone'] as $field) {
            if (empty($data[$field])) {
                jsonResponse(['error' => ucfirst(str_replace('_', ' ', $field)) . ' is required'], 422);
            }
        }

        $requestedStatus = $data['status'] ?? 'new';
        $status = in_array($requestedStatus, ['new', 'contacted', 'closed'], true) ? $requestedStatus : 'new';
        $stmt = $db->prepare('
            UPDATE valuations
            SET location = ?, property_type = ?, size = ?, property_condition = ?, expected_price = ?,
                contact_name = ?, contact_phone = ?, contact_email = ?, notes = ?, status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ');
        $stmt->execute([
            $data['location'],
            $data['property_type'],
            $data['size'],
            $data['property_condition'],
            $data['expected_price'] ?? null,
            $data['contact_name'],
            $data['contact_phone'],
            $data['contact_email'] ?? null,
            $data['notes'] ?? null,
            $status,
            (int) $_GET['id'],
        ]);

        jsonResponse(['message' => 'Valuation request updated successfully']);

    case 'DELETE':
        requireAdmin();
        if (!isset($_GET['id'])) {
            jsonResponse(['error' => 'Valuation ID required'], 400);
        }

        $stmt = $db->prepare('DELETE FROM valuations WHERE id = ?');
        $stmt->execute([(int) $_GET['id']]);
        jsonResponse(['message' => 'Valuation request deleted successfully']);

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}
?>
