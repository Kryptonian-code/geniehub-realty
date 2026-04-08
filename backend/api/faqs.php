<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = getDBConnection();

switch ($method) {
    case 'GET':
        $where = isAuthenticated() && (($_GET['admin'] ?? '') === '1') ? '' : 'WHERE is_active = 1';
        $stmt = $db->query("
            SELECT id, question, answer, sort_order, is_active, created_at, updated_at
            FROM faqs
            {$where}
            ORDER BY sort_order ASC, created_at DESC
        ");
        jsonResponse($stmt->fetchAll());

    case 'POST':
        requireAdmin();
        $data = sanitizeInput(readJsonInput());
        if (empty($data['question']) || empty($data['answer'])) {
            jsonResponse(['error' => 'Question and answer are required'], 422);
        }

        $stmt = $db->prepare('INSERT INTO faqs (question, answer, sort_order, is_active) VALUES (?, ?, ?, ?)');
        $stmt->execute([
            $data['question'],
            $data['answer'],
            (int) ($data['sort_order'] ?? 0),
            boolValue($data['is_active'] ?? true) ? 1 : 0,
        ]);

        jsonResponse(['id' => (int) $db->lastInsertId(), 'message' => 'FAQ created successfully'], 201);

    case 'PUT':
        requireAdmin();
        if (!isset($_GET['id'])) {
            jsonResponse(['error' => 'FAQ ID required'], 400);
        }

        $data = sanitizeInput(readJsonInput());
        $stmt = $db->prepare('
            UPDATE faqs
            SET question = ?, answer = ?, sort_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ');
        $stmt->execute([
            $data['question'] ?? '',
            $data['answer'] ?? '',
            (int) ($data['sort_order'] ?? 0),
            boolValue($data['is_active'] ?? true) ? 1 : 0,
            (int) $_GET['id'],
        ]);

        jsonResponse(['message' => 'FAQ updated successfully']);

    case 'DELETE':
        requireAdmin();
        if (!isset($_GET['id'])) {
            jsonResponse(['error' => 'FAQ ID required'], 400);
        }

        $stmt = $db->prepare('DELETE FROM faqs WHERE id = ?');
        $stmt->execute([(int) $_GET['id']]);
        jsonResponse(['message' => 'FAQ deleted successfully']);

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}
?>
