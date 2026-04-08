<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = getDBConnection();

switch ($method) {
    case 'GET':
        $stmt = $db->query('SELECT id, name, city, address, phone, email, created_at FROM offices ORDER BY name ASC');
        jsonResponse($stmt->fetchAll());

    case 'POST':
        requireAdmin();
        $data = sanitizeInput(readJsonInput());

        if (empty($data['name']) || empty($data['city']) || empty($data['address'])) {
            jsonResponse(['error' => 'Name, city, and address are required'], 422);
        }

        $stmt = $db->prepare('INSERT INTO offices (name, city, address, phone, email) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([
            $data['name'],
            $data['city'],
            $data['address'],
            $data['phone'] ?? null,
            $data['email'] ?? null,
        ]);

        jsonResponse(['id' => (int) $db->lastInsertId(), 'message' => 'Office created successfully'], 201);

    case 'PUT':
        requireAdmin();
        if (!isset($_GET['id'])) {
            jsonResponse(['error' => 'Office ID required'], 400);
        }

        $data = sanitizeInput(readJsonInput());
        $stmt = $db->prepare('
            UPDATE offices
            SET name = ?, city = ?, address = ?, phone = ?, email = ?
            WHERE id = ?
        ');
        $stmt->execute([
            $data['name'] ?? '',
            $data['city'] ?? '',
            $data['address'] ?? '',
            $data['phone'] ?? null,
            $data['email'] ?? null,
            (int) $_GET['id'],
        ]);

        jsonResponse(['message' => 'Office updated successfully']);

    case 'DELETE':
        requireAdmin();
        if (!isset($_GET['id'])) {
            jsonResponse(['error' => 'Office ID required'], 400);
        }

        $stmt = $db->prepare('DELETE FROM offices WHERE id = ?');
        $stmt->execute([(int) $_GET['id']]);

        jsonResponse(['message' => 'Office deleted successfully']);

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}
?>
