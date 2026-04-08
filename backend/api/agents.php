<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = getDBConnection();
ensureAgentSchema($db);

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $stmt = $db->prepare('
                SELECT a.*, o.name AS office_name, o.city AS office_city
                FROM agents a
                LEFT JOIN offices o ON o.id = a.office_id
                WHERE a.id = ?
                LIMIT 1
            ');
            $stmt->execute([(int) $_GET['id']]);
            $agent = $stmt->fetch();

            if (!$agent) {
                jsonResponse(['error' => 'Agent not found'], 404);
            }

            jsonResponse($agent);
        }

        $stmt = $db->query('
            SELECT a.*, o.name AS office_name, o.city AS office_city
            FROM agents a
            LEFT JOIN offices o ON o.id = a.office_id
            ORDER BY a.created_at DESC
        ');
        jsonResponse($stmt->fetchAll());

    case 'POST':
        requireAdmin();
        $data = sanitizeInput(readJsonInput());

        foreach (['name', 'phone', 'email', 'bio'] as $field) {
            if (empty($data[$field])) {
                jsonResponse(['error' => ucfirst($field) . ' is required'], 422);
            }
        }

        $stmt = $db->prepare('
            INSERT INTO agents (name, photo, phone, email, bio, specialization, experience_years, office_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $data['name'],
            $data['photo'] ?? '',
            $data['phone'],
            $data['email'],
            $data['bio'],
            $data['specialization'] ?? null,
            (int) ($data['experience_years'] ?? 0),
            !empty($data['office_id']) ? (int) $data['office_id'] : null,
        ]);

        jsonResponse(['id' => (int) $db->lastInsertId(), 'message' => 'Agent created successfully'], 201);

    case 'PUT':
        requireAdmin();
        if (!isset($_GET['id'])) {
            jsonResponse(['error' => 'Agent ID required'], 400);
        }

        $data = sanitizeInput(readJsonInput());
        $stmt = $db->prepare('
            UPDATE agents
            SET name = ?, photo = ?, phone = ?, email = ?, bio = ?, specialization = ?, experience_years = ?, office_id = ?
            WHERE id = ?
        ');
        $stmt->execute([
            $data['name'] ?? '',
            $data['photo'] ?? '',
            $data['phone'] ?? '',
            $data['email'] ?? '',
            $data['bio'] ?? '',
            $data['specialization'] ?? null,
            (int) ($data['experience_years'] ?? 0),
            !empty($data['office_id']) ? (int) $data['office_id'] : null,
            (int) $_GET['id'],
        ]);

        jsonResponse(['message' => 'Agent updated successfully']);

    case 'DELETE':
        requireAdmin();
        if (!isset($_GET['id'])) {
            jsonResponse(['error' => 'Agent ID required'], 400);
        }

        $photoStmt = $db->prepare('SELECT photo FROM agents WHERE id = ? LIMIT 1');
        $photoStmt->execute([(int) $_GET['id']]);
        $photoPath = $photoStmt->fetchColumn();

        $stmt = $db->prepare('DELETE FROM agents WHERE id = ?');
        $stmt->execute([(int) $_GET['id']]);
        deleteUploadedFile($photoPath !== false ? (string) $photoPath : null);
        jsonResponse(['message' => 'Agent deleted successfully']);

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}
?>
