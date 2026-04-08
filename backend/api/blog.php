<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = getDBConnection();
ensureBlogSchema($db);

function buildBlogExcerpt(string $content, ?string $excerpt = null): string {
    $summary = trim((string) ($excerpt ?? ''));
    if ($summary !== '') {
        return $summary;
    }

    $plainText = trim(strip_tags($content));
    if (function_exists('mb_substr')) {
        return mb_substr($plainText, 0, 180);
    }

    return substr($plainText, 0, 180);
}

function mapBlogPostRow(array $row): array {
    return [
        'id' => (int) $row['id'],
        'title' => $row['title'],
        'slug' => $row['slug'],
        'excerpt' => $row['excerpt'] ?? '',
        'content' => $row['content'] ?? '',
        'category' => $row['category'] ?? 'market-insights',
        'cover_image' => $row['cover_image'] ?? '',
        'author' => $row['author'] ?? 'GenieHub Realty',
        'meta_title' => $row['meta_title'] ?? null,
        'meta_description' => $row['meta_description'] ?? null,
        'is_published' => (int) ($row['is_published'] ?? 0),
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'] ?? $row['created_at'],
    ];
}

switch ($method) {
    case 'GET':
        $isAdmin = isAuthenticated() && (($_GET['admin'] ?? '') === '1');

        if (isset($_GET['id']) || isset($_GET['slug'])) {
            $identifierField = isset($_GET['slug']) ? 'slug' : 'id';
            $identifierValue = isset($_GET['slug']) ? sanitizeInput($_GET['slug']) : (int) $_GET['id'];
            $sql = "SELECT * FROM blog_posts WHERE {$identifierField} = ?";
            if (!$isAdmin) {
                $sql .= ' AND is_published = 1';
            }
            $sql .= ' LIMIT 1';

            $stmt = $db->prepare($sql);
            $stmt->execute([$identifierValue]);
            $post = $stmt->fetch();

            if (!$post) {
                jsonResponse(['error' => 'Blog post not found'], 404);
            }

            jsonResponse(mapBlogPostRow($post));
        }

        $where = $isAdmin ? '' : 'WHERE is_published = 1';
        $stmt = $db->query("
            SELECT *
            FROM blog_posts
            {$where}
            ORDER BY created_at DESC
        ");

        jsonResponse(array_map('mapBlogPostRow', $stmt->fetchAll()));

    case 'POST':
        requireAdmin();
        $data = sanitizeInput(readJsonInput());

        foreach (['title', 'content', 'category'] as $field) {
            if (empty($data[$field])) {
                jsonResponse(['error' => ucfirst(str_replace('_', ' ', $field)) . ' is required'], 422);
            }
        }

        $excerpt = buildBlogExcerpt((string) $data['content'], $data['excerpt'] ?? null);

        $slug = slugify((string) $data['title']);
        $originalSlug = $slug;
        $counter = 2;
        $slugStmt = $db->prepare('SELECT COUNT(*) FROM blog_posts WHERE slug = ?');
        while (true) {
            $slugStmt->execute([$slug]);
            if ((int) $slugStmt->fetchColumn() === 0) {
                break;
            }
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        $stmt = $db->prepare('
            INSERT INTO blog_posts (
                title, slug, excerpt, content, category, cover_image, author, meta_title, meta_description, is_published
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $data['title'],
            $slug,
            $excerpt,
            $data['content'],
            $data['category'],
            $data['cover_image'] ?? null,
            $data['author'] ?? 'GenieHub Realty',
            $data['meta_title'] ?? null,
            $data['meta_description'] ?? null,
            boolValue($data['is_published'] ?? true) ? 1 : 0,
        ]);

        jsonResponse(['id' => (int) $db->lastInsertId(), 'message' => 'Blog post created successfully'], 201);

    case 'PUT':
        requireAdmin();
        if (!isset($_GET['id'])) {
            jsonResponse(['error' => 'Blog post ID required'], 400);
        }

        $data = sanitizeInput(readJsonInput());
        foreach (['title', 'content', 'category'] as $field) {
            if (empty($data[$field])) {
                jsonResponse(['error' => ucfirst(str_replace('_', ' ', $field)) . ' is required'], 422);
            }
        }

        $excerpt = buildBlogExcerpt((string) $data['content'], $data['excerpt'] ?? null);

        $stmt = $db->prepare('
            UPDATE blog_posts
            SET title = ?, excerpt = ?, content = ?, category = ?, cover_image = ?, author = ?,
                meta_title = ?, meta_description = ?, is_published = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ');
        $stmt->execute([
            $data['title'],
            $excerpt,
            $data['content'],
            $data['category'],
            $data['cover_image'] ?? null,
            $data['author'] ?? 'GenieHub Realty',
            $data['meta_title'] ?? null,
            $data['meta_description'] ?? null,
            boolValue($data['is_published'] ?? true) ? 1 : 0,
            (int) $_GET['id'],
        ]);

        jsonResponse(['message' => 'Blog post updated successfully']);

    case 'DELETE':
        requireAdmin();
        if (!isset($_GET['id'])) {
            jsonResponse(['error' => 'Blog post ID required'], 400);
        }

        $imageStmt = $db->prepare('SELECT cover_image FROM blog_posts WHERE id = ? LIMIT 1');
        $imageStmt->execute([(int) $_GET['id']]);
        $coverImage = $imageStmt->fetchColumn();

        $stmt = $db->prepare('DELETE FROM blog_posts WHERE id = ?');
        $stmt->execute([(int) $_GET['id']]);
        deleteUploadedFile($coverImage !== false ? (string) $coverImage : null);
        jsonResponse(['message' => 'Blog post deleted successfully']);

    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}
?>
