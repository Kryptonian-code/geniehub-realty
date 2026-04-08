<?php
require_once __DIR__ . '/../config.php';

$projectRoot = dirname(__DIR__, 2);
$publicPath = $projectRoot . DIRECTORY_SEPARATOR . 'public';
$targetPath = $publicPath . DIRECTORY_SEPARATOR . 'sitemap.xml';

if (!is_dir($publicPath)) {
    fwrite(STDERR, "Public directory not found.\n");
    exit(1);
}

$db = getDBConnection();
$baseUrl = rtrim(envValue('SITE_URL', 'http://localhost/geniehub-realty'), '/');

$urls = [
    ['loc' => $baseUrl . '/', 'priority' => '1.0'],
    ['loc' => $baseUrl . '/properties', 'priority' => '0.9'],
    ['loc' => $baseUrl . '/agents', 'priority' => '0.8'],
    ['loc' => $baseUrl . '/blog', 'priority' => '0.7'],
    ['loc' => $baseUrl . '/contact', 'priority' => '0.7'],
    ['loc' => $baseUrl . '/valuation', 'priority' => '0.6'],
];

$propertyStmt = $db->query("SELECT slug, updated_at FROM properties");
foreach ($propertyStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
    if (!empty($row['slug'])) {
        $urls[] = [
            'loc' => $baseUrl . '/properties/' . rawurlencode((string) $row['slug']),
            'lastmod' => !empty($row['updated_at']) ? date('c', strtotime((string) $row['updated_at'])) : null,
            'priority' => '0.8',
        ];
    }
}

$blogStmt = $db->query("SELECT slug, updated_at FROM blog_posts WHERE is_published = 1");
foreach ($blogStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
    if (!empty($row['slug'])) {
        $urls[] = [
            'loc' => $baseUrl . '/blog/' . rawurlencode((string) $row['slug']),
            'lastmod' => !empty($row['updated_at']) ? date('c', strtotime((string) $row['updated_at'])) : null,
            'priority' => '0.7',
        ];
    }
}

$agentStmt = $db->query("SELECT id, created_at FROM agents");
foreach ($agentStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
    if (!empty($row['id'])) {
        $urls[] = [
            'loc' => $baseUrl . '/agents/' . rawurlencode((string) $row['id']),
            'lastmod' => !empty($row['created_at']) ? date('c', strtotime((string) $row['created_at'])) : null,
            'priority' => '0.6',
        ];
    }
}

$xml = new DOMDocument('1.0', 'UTF-8');
$xml->formatOutput = true;

$urlset = $xml->createElement('urlset');
$urlset->setAttribute('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9');
$xml->appendChild($urlset);

foreach ($urls as $entry) {
    $url = $xml->createElement('url');
    $url->appendChild($xml->createElement('loc', $entry['loc']));

    if (!empty($entry['lastmod'])) {
        $url->appendChild($xml->createElement('lastmod', $entry['lastmod']));
    }

    if (!empty($entry['priority'])) {
        $url->appendChild($xml->createElement('priority', $entry['priority']));
    }

    $urlset->appendChild($url);
}

$xml->save($targetPath);
fwrite(STDOUT, "Sitemap written to {$targetPath}\n");
