<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = getDBConnection();
ensureAppointmentSchema($db);

switch ($method) {
    case 'GET':
        requireAdmin();
        $stmt = $db->query('
            SELECT a.*, p.title AS property_title, ag.name AS agent_name
            FROM appointments a
            LEFT JOIN properties p ON p.id = a.property_id
            LEFT JOIN agents ag ON ag.id = a.agent_id
            ORDER BY a.created_at DESC
        ');
        jsonResponse($stmt->fetchAll());

    case 'POST':
        $data = sanitizeInput(readJsonInput());
        foreach (['client_name', 'client_phone', 'preferred_date', 'preferred_time'] as $field) {
            if (empty($data[$field])) {
                jsonResponse(['error' => ucfirst(str_replace('_', ' ', $field)) . ' is required'], 422);
            }
        }

        if (!empty($data['client_email']) && !filter_var((string) $data['client_email'], FILTER_VALIDATE_EMAIL)) {
            jsonResponse(['error' => 'Please provide a valid email address'], 422);
        }

        $requestedStatus = $data['status'] ?? 'pending';
        $status = in_array($requestedStatus, ['pending', 'confirmed', 'completed', 'cancelled'], true)
            ? $requestedStatus
            : 'pending';

        $stmt = $db->prepare('
            INSERT INTO appointments (
                property_id, agent_id, client_name, client_phone, client_email, preferred_date, preferred_time, message, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            !empty($data['property_id']) ? (int) $data['property_id'] : null,
            !empty($data['agent_id']) ? (int) $data['agent_id'] : null,
            $data['client_name'],
            $data['client_phone'],
            $data['client_email'] ?? null,
            $data['preferred_date'],
            $data['preferred_time'],
            $data['message'] ?? null,
            $status,
        ]);

        jsonResponse(['id' => (int) $db->lastInsertId(), 'message' => 'Appointment request saved successfully'], 201);

    case 'PUT':
        requireAdmin();
        if (!isset($_GET['id'])) {
            jsonResponse(['error' => 'Appointment ID required'], 400);
        }

        $data = sanitizeInput(readJsonInput());
        foreach (['client_name', 'client_phone', 'preferred_date', 'preferred_time'] as $field) {
            if (empty($data[$field])) {
                jsonResponse(['error' => ucfirst(str_replace('_', ' ', $field)) . ' is required'], 422);
            }
        }

        $requestedStatus = $data['status'] ?? 'pending';
        $status = in_array($requestedStatus, ['pending', 'confirmed', 'completed', 'cancelled'], true)
            ? $requestedStatus
            : 'pending';

        $stmt = $db->prepare('
            UPDATE appointments
            SET property_id = ?, agent_id = ?, client_name = ?, client_phone = ?, client_email = ?,
                preferred_date = ?, preferred_time = ?, message = ?, status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ');
        $stmt->execute([
            !empty($data['property_id']) ? (int) $data['property_id'] : null,
            !empty($data['agent_id']) ? (int) $data['agent_id'] : null,
            $data['client_name'],
            $data['client_phone'],
            $data['client_email'] ?? null,
            $data['preferred_date'],
            $data['preferred_time'],
            $data['message'] ?? null,
            $status,
            (int) $_GET['id'],
        ]);

        jsonResponse(['message' => 'Appointment updated successfully']);

    case 'DELETE':
        requireAdmin();
        if (!isset($_GET['id'])) {
            jsonResponse(['error' => 'Appointment ID required'], 400);
        }

        $stmt = $db->prepare('DELETE FROM appointments WHERE id = ?');
        $stmt->execute([(int) $_GET['id']]);
        jsonResponse(['message' => 'Appointment deleted successfully']);

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}
?>
