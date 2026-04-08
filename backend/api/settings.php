<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = getDBConnection();

switch ($method) {
    case 'GET':
        $stmt = $db->query('SELECT `key`, value FROM settings');
        jsonResponse($stmt->fetchAll(PDO::FETCH_KEY_PAIR));

    case 'PUT':
        requireAdmin();
        $data = sanitizeInput(readJsonInput());
        if (!$data) {
            jsonResponse(['error' => 'No settings provided'], 422);
        }

        $db->beginTransaction();

        try {
            $stmt = $db->prepare('
                INSERT INTO settings (`key`, value)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE value = VALUES(value)
            ');

            foreach ($data as $key => $value) {
                $stmt->execute([(string) sanitizeInput($key), $value === null ? null : (string) sanitizeInput($value)]);
            }

            $db->commit();
            jsonResponse(['message' => 'Settings updated successfully']);
        } catch (Throwable $exception) {
            $db->rollBack();
            jsonResponse(['error' => 'Failed to update settings'], 500);
        }

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}
?>
