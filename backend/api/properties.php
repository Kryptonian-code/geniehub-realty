<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = getDBConnection();
ensurePropertySchema($db);

switch ($method) {
    case 'GET':
        $isAdmin = isAuthenticated() && (($_GET['admin'] ?? '') === '1');

        if (isset($_GET['id']) || isset($_GET['slug'])) {
            $identifierField = isset($_GET['slug']) ? 'p.slug' : 'p.id';
            $identifierValue = isset($_GET['slug']) ? sanitizeInput($_GET['slug']) : (int) $_GET['id'];

            $sql = '
                SELECT p.*, a.name AS agent_name, a.phone AS agent_phone, a.email AS agent_email,
                       pc.name AS category_name, pt.name AS type_name
                FROM properties p
                LEFT JOIN agents a ON a.id = p.agent_id
                LEFT JOIN property_categories pc ON pc.id = p.category_id
                LEFT JOIN property_types pt ON pt.id = p.type_id
                WHERE ' . $identifierField . ' = ?
            ';

            if (!$isAdmin) {
                $sql .= " AND p.status = 'available'";
            }

            $stmt = $db->prepare($sql . ' LIMIT 1');
            $stmt->execute([$identifierValue]);
            $property = $stmt->fetch();

            if (!$property) {
                jsonResponse(['error' => 'Property not found'], 404);
            }

            jsonResponse(mapPropertyRow($db, $property));
        }

        $where = [];
        $params = [];

        if (!$isAdmin) {
            $where[] = "p.status = 'available'";
        }

        if (!empty($_GET['category'])) {
            $where[] = 'pc.name = ?';
            $params[] = sanitizeInput($_GET['category']);
        }

        if (!empty($_GET['type'])) {
            $where[] = 'pt.name = ?';
            $params[] = sanitizeInput($_GET['type']);
        }

        if (!empty($_GET['city'])) {
            $where[] = '(p.city LIKE ? OR p.area LIKE ?)';
            $searchCity = '%' . sanitizeInput($_GET['city']) . '%';
            $params[] = $searchCity;
            $params[] = $searchCity;
        }

        if (!empty($_GET['agent_id'])) {
            $where[] = 'p.agent_id = ?';
            $params[] = (int) $_GET['agent_id'];
        }

        if (!empty($_GET['bedrooms'])) {
            $bedrooms = (int) $_GET['bedrooms'];
            $where[] = $bedrooms >= 4 ? 'p.bedrooms >= ?' : 'p.bedrooms = ?';
            $params[] = $bedrooms;
        }

        if (!empty($_GET['furnished'])) {
            $where[] = 'p.furnished = ?';
            $params[] = sanitizeInput($_GET['furnished']);
        }

        if (!empty($_GET['verified']) && boolValue($_GET['verified'])) {
            $where[] = 'p.is_verified = 1';
        }

        if (!empty($_GET['featured']) && boolValue($_GET['featured'])) {
            $where[] = 'p.is_featured = 1';
        }

        if (isset($_GET['min_price']) && $_GET['min_price'] !== '') {
            $where[] = 'COALESCE(NULLIF(p.price, 0), NULLIF(p.rent_price, 0), 0) >= ?';
            $params[] = (float) $_GET['min_price'];
        }

        if (isset($_GET['max_price']) && $_GET['max_price'] !== '') {
            $where[] = 'COALESCE(NULLIF(p.price, 0), NULLIF(p.rent_price, 0), 0) <= ?';
            $params[] = (float) $_GET['max_price'];
        }

        if (!empty($_GET['search'])) {
            $where[] = '(p.title LIKE ? OR p.description LIKE ? OR p.area LIKE ? OR p.city LIKE ?)';
            $search = '%' . sanitizeInput($_GET['search']) . '%';
            array_push($params, $search, $search, $search, $search);
        }

        $page = max(1, (int) ($_GET['page'] ?? 1));
        $perPage = max(1, min(24, (int) ($_GET['per_page'] ?? ($_GET['limit'] ?? 12))));
        $offset = ($page - 1) * $perPage;

        $whereClause = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

        $countStmt = $db->prepare("
            SELECT COUNT(*)
            FROM properties p
            LEFT JOIN property_categories pc ON pc.id = p.category_id
            LEFT JOIN property_types pt ON pt.id = p.type_id
            {$whereClause}
        ");
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        $sql = "
            SELECT p.*, a.name AS agent_name, a.phone AS agent_phone, a.email AS agent_email,
                   pc.name AS category_name, pt.name AS type_name
            FROM properties p
            LEFT JOIN agents a ON a.id = p.agent_id
            LEFT JOIN property_categories pc ON pc.id = p.category_id
            LEFT JOIN property_types pt ON pt.id = p.type_id
            {$whereClause}
            ORDER BY p.is_featured DESC, p.created_at DESC
            LIMIT {$perPage} OFFSET {$offset}
        ";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $properties = array_map(fn(array $row) => mapPropertyRow($db, $row), $stmt->fetchAll());

        jsonResponse([
            'data' => $properties,
            'meta' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'total_pages' => (int) ceil($total / $perPage),
            ],
        ]);

    case 'POST':
        requireAdmin();
        $data = sanitizeInput(readJsonInput());

        foreach (['title', 'description', 'category', 'type', 'region', 'city', 'area'] as $field) {
            if (empty($data[$field])) {
                jsonResponse(['error' => ucfirst($field) . ' is required'], 422);
            }
        }

        $categoryId = getOrCreateLookupId($db, 'property_categories', (string) $data['category']);
        $typeId = getOrCreateLookupId($db, 'property_types', (string) $data['type']);

        $slug = slugify((string) $data['title']);
        $originalSlug = $slug;
        $counter = 2;
        $slugStmt = $db->prepare('SELECT COUNT(*) FROM properties WHERE slug = ?');
        while (true) {
            $slugStmt->execute([$slug]);
            if ((int) $slugStmt->fetchColumn() === 0) {
                break;
            }
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        $stmt = $db->prepare('
            INSERT INTO properties (
                title, slug, description, category_id, type_id, region, city, area, address,
                price, rent_price, rent_advance, bedrooms, bathrooms, toilets, parking_spaces,
                land_size, furnished, status, is_featured, is_verified, agent_id, meta_title, meta_description, og_image, canonical_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $data['title'],
            $slug,
            $data['description'],
            $categoryId,
            $typeId,
            $data['region'],
            $data['city'],
            $data['area'],
            $data['address'] ?? null,
            $data['price'] ?? null,
            $data['rent_price'] ?? null,
            $data['rent_advance'] ?? null,
            (int) ($data['bedrooms'] ?? 0),
            (int) ($data['bathrooms'] ?? 0),
            (int) ($data['toilets'] ?? 0),
            (int) ($data['parking_spaces'] ?? 0),
            $data['land_size'] ?? null,
            $data['furnished'] ?? 'unfurnished',
            $data['status'] ?? 'available',
            boolValue($data['is_featured'] ?? false) ? 1 : 0,
            boolValue($data['is_verified'] ?? false) ? 1 : 0,
            !empty($data['agent_id']) ? (int) $data['agent_id'] : null,
            $data['meta_title'] ?? null,
            $data['meta_description'] ?? null,
            $data['og_image'] ?? null,
            $data['canonical_url'] ?? null,
        ]);

        $propertyId = (int) $db->lastInsertId();

        if (!empty($data['images']) && is_array($data['images'])) {
            $imageStmt = $db->prepare('INSERT INTO property_images (property_id, image_path, sort_order) VALUES (?, ?, ?)');
            foreach ($data['images'] as $index => $imagePath) {
                if (!$imagePath) {
                    continue;
                }
                $imageStmt->execute([$propertyId, $imagePath, $index]);
            }
        }

        if (isset($data['features']) && is_array($data['features'])) {
            $mapStmt = $db->prepare('INSERT IGNORE INTO property_feature_map (property_id, feature_id) VALUES (?, ?)');
            foreach ($data['features'] as $featureName) {
                if (!$featureName) {
                    continue;
                }
                $featureId = getOrCreateLookupId($db, 'property_features', (string) $featureName);
                $mapStmt->execute([$propertyId, $featureId]);
            }
        }

        jsonResponse(['id' => $propertyId, 'message' => 'Property created successfully'], 201);

    case 'PUT':
        requireAdmin();
        if (!isset($_GET['id'])) {
            jsonResponse(['error' => 'Property ID required'], 400);
        }

        $data = sanitizeInput(readJsonInput());
        $propertyId = (int) $_GET['id'];

        if (!empty($data['category'])) {
            $categoryId = getOrCreateLookupId($db, 'property_categories', (string) $data['category']);
        } else {
            $categoryId = null;
        }

        if (!empty($data['type'])) {
            $typeId = getOrCreateLookupId($db, 'property_types', (string) $data['type']);
        } else {
            $typeId = null;
        }

        $stmt = $db->prepare('
            UPDATE properties
            SET title = ?, description = ?, category_id = COALESCE(?, category_id), type_id = COALESCE(?, type_id),
                region = ?, city = ?, area = ?, address = ?, price = ?, rent_price = ?, rent_advance = ?,
                bedrooms = ?, bathrooms = ?, toilets = ?, parking_spaces = ?, land_size = ?, furnished = ?,
                status = ?, is_featured = ?, is_verified = ?, agent_id = ?, meta_title = ?, meta_description = ?,
                og_image = ?, canonical_url = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ');
        $stmt->execute([
            $data['title'] ?? '',
            $data['description'] ?? '',
            $categoryId,
            $typeId,
            $data['region'] ?? '',
            $data['city'] ?? '',
            $data['area'] ?? '',
            $data['address'] ?? null,
            $data['price'] ?? null,
            $data['rent_price'] ?? null,
            $data['rent_advance'] ?? null,
            (int) ($data['bedrooms'] ?? 0),
            (int) ($data['bathrooms'] ?? 0),
            (int) ($data['toilets'] ?? 0),
            (int) ($data['parking_spaces'] ?? 0),
            $data['land_size'] ?? null,
            $data['furnished'] ?? 'unfurnished',
            $data['status'] ?? 'available',
            boolValue($data['is_featured'] ?? false) ? 1 : 0,
            boolValue($data['is_verified'] ?? false) ? 1 : 0,
            !empty($data['agent_id']) ? (int) $data['agent_id'] : null,
            $data['meta_title'] ?? null,
            $data['meta_description'] ?? null,
            $data['og_image'] ?? null,
            $data['canonical_url'] ?? null,
            $propertyId,
        ]);

        if (isset($data['images']) && is_array($data['images'])) {
            $db->prepare('DELETE FROM property_images WHERE property_id = ?')->execute([$propertyId]);
            $imageStmt = $db->prepare('INSERT INTO property_images (property_id, image_path, sort_order) VALUES (?, ?, ?)');
            foreach ($data['images'] as $index => $imagePath) {
                if (!$imagePath) {
                    continue;
                }
                $imageStmt->execute([$propertyId, $imagePath, $index]);
            }
        }

        if (isset($data['features']) && is_array($data['features'])) {
            $db->prepare('DELETE FROM property_feature_map WHERE property_id = ?')->execute([$propertyId]);
            $mapStmt = $db->prepare('INSERT IGNORE INTO property_feature_map (property_id, feature_id) VALUES (?, ?)');
            foreach ($data['features'] as $featureName) {
                if (!$featureName) {
                    continue;
                }
                $featureId = getOrCreateLookupId($db, 'property_features', (string) $featureName);
                $mapStmt->execute([$propertyId, $featureId]);
            }
        }

        jsonResponse(['message' => 'Property updated successfully']);

    case 'DELETE':
        requireAdmin();
        if (!isset($_GET['id'])) {
            jsonResponse(['error' => 'Property ID required'], 400);
        }

        $imageStmt = $db->prepare('SELECT image_path FROM property_images WHERE property_id = ?');
        $imageStmt->execute([(int) $_GET['id']]);
        $images = $imageStmt->fetchAll(PDO::FETCH_COLUMN);

        $stmt = $db->prepare('DELETE FROM properties WHERE id = ?');
        $stmt->execute([(int) $_GET['id']]);
        foreach ($images as $imagePath) {
            deleteUploadedFile((string) $imagePath);
        }
        jsonResponse(['message' => 'Property deleted successfully']);

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}
?>
