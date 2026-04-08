<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = getDBConnection();

$taxonomyMap = [
    'categories' => [
        'table' => 'property_categories',
        'usageJoin' => 'LEFT JOIN properties p ON p.category_id = t.id',
        'usageCount' => 'COUNT(p.id)',
    ],
    'types' => [
        'table' => 'property_types',
        'usageJoin' => 'LEFT JOIN properties p ON p.type_id = t.id',
        'usageCount' => 'COUNT(p.id)',
    ],
    'features' => [
        'table' => 'property_features',
        'usageJoin' => 'LEFT JOIN property_feature_map pfm ON pfm.feature_id = t.id',
        'usageCount' => 'COUNT(pfm.property_id)',
    ],
];

function taxonomyConfig(array $taxonomyMap, ?string $kind): array {
    if (!$kind || !isset($taxonomyMap[$kind])) {
        jsonResponse(['error' => 'Invalid taxonomy kind'], 422);
    }

    return $taxonomyMap[$kind];
}

function taxonomyItems(PDO $db, array $config): array {
    $stmt = $db->query("
        SELECT t.id, t.name, {$config['usageCount']} AS usage_count
        FROM {$config['table']} t
        {$config['usageJoin']}
        GROUP BY t.id, t.name
        ORDER BY t.name ASC
    ");

    return $stmt->fetchAll();
}

switch ($method) {
    case 'GET':
        if (!empty($_GET['kind'])) {
            $config = taxonomyConfig($taxonomyMap, sanitizeInput($_GET['kind']));
            jsonResponse(taxonomyItems($db, $config));
        }

        $response = [];
        foreach ($taxonomyMap as $kind => $config) {
            $response[$kind] = taxonomyItems($db, $config);
        }
        jsonResponse($response);

    case 'POST':
        requireAdmin();
        $data = sanitizeInput(readJsonInput());
        if (($data['action'] ?? '') === 'seed-defaults') {
            $defaults = [
                'categories' => ['houses', 'apartments', 'land', 'commercial', 'short-stay', 'luxury', 'student-housing'],
                'types' => ['house', 'apartment', 'duplex', 'townhouse', 'studio', 'land', 'office-space', 'shop', 'warehouse', 'short-stay', 'hostel', 'semi-detached', 'detached-house', 'compound-house', 'penthouse'],
                'features' => [
                    'kitchen',
                    'air-conditioning',
                    'security-post',
                    'gated-community',
                    'water',
                    'electricity',
                    'ensuite-bedrooms',
                    'boys-quarters',
                    'staff-quarters',
                    'borehole',
                    'water-reservoir',
                    'standby-generator',
                    'electric-fence',
                    'tiled-compound',
                    'balcony',
                    'fitted-wardrobes',
                    'cctv',
                    'self-compound',
                    'visitors-washroom',
                    'paved-road-access',
                    'close-to-main-road',
                ],
            ];

            foreach ($defaults as $kind => $items) {
                $config = $taxonomyMap[$kind];
                $stmt = $db->prepare("INSERT IGNORE INTO {$config['table']} (name) VALUES (?)");
                foreach ($items as $item) {
                    $stmt->execute([$item]);
                }
            }

            jsonResponse(['message' => 'Ghana-ready taxonomy starters added successfully']);
        }
        $config = taxonomyConfig($taxonomyMap, $data['kind'] ?? null);

        if (empty($data['name'])) {
            jsonResponse(['error' => 'Name is required'], 422);
        }

        $stmt = $db->prepare("INSERT INTO {$config['table']} (name) VALUES (?)");
        try {
            $stmt->execute([$data['name']]);
        } catch (PDOException $exception) {
            jsonResponse(['error' => 'That name already exists.'], 409);
        }

        jsonResponse(['id' => (int) $db->lastInsertId(), 'message' => 'Taxonomy item created successfully'], 201);

    case 'PUT':
        requireAdmin();
        if (!isset($_GET['id'])) {
            jsonResponse(['error' => 'Item ID required'], 400);
        }

        $data = sanitizeInput(readJsonInput());
        $config = taxonomyConfig($taxonomyMap, $data['kind'] ?? null);

        if (empty($data['name'])) {
            jsonResponse(['error' => 'Name is required'], 422);
        }

        $stmt = $db->prepare("UPDATE {$config['table']} SET name = ? WHERE id = ?");
        try {
            $stmt->execute([$data['name'], (int) $_GET['id']]);
        } catch (PDOException $exception) {
            jsonResponse(['error' => 'That name already exists.'], 409);
        }

        jsonResponse(['message' => 'Taxonomy item updated successfully']);

    case 'DELETE':
        requireAdmin();
        if (!isset($_GET['id'])) {
            jsonResponse(['error' => 'Item ID required'], 400);
        }

        $kind = sanitizeInput($_GET['kind'] ?? '');
        $config = taxonomyConfig($taxonomyMap, $kind);

        $stmt = $db->prepare("DELETE FROM {$config['table']} WHERE id = ?");
        try {
            $stmt->execute([(int) $_GET['id']]);
        } catch (PDOException $exception) {
            jsonResponse(['error' => 'This item is already being used by saved properties and cannot be deleted yet.'], 409);
        }

        jsonResponse(['message' => 'Taxonomy item deleted successfully']);

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}
?>
