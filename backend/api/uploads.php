<?php
require_once '../config.php';

requireAdmin();

enforceRateLimit('upload-ip', 20, 3600);

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

if (!isset($_FILES['file']) || !is_array($_FILES['file'])) {
    jsonResponse(['error' => 'No file was uploaded'], 422);
}

$type = sanitizeInput($_POST['type'] ?? '');
$folders = [
    'agent' => 'agent-photos',
    'property' => 'property-images',
    'blog' => 'blog-images',
];

if (!isset($folders[$type])) {
    jsonResponse(['error' => 'Invalid upload type'], 422);
}

$file = $_FILES['file'];
$uploadError = $file['error'] ?? UPLOAD_ERR_NO_FILE;
if ($uploadError !== UPLOAD_ERR_OK) {
    $messages = [
        UPLOAD_ERR_INI_SIZE => 'This image is larger than the server upload limit. Please use an image under 10MB.',
        UPLOAD_ERR_FORM_SIZE => 'This image is larger than the allowed form upload size.',
        UPLOAD_ERR_PARTIAL => 'The image upload was interrupted. Please try again.',
        UPLOAD_ERR_NO_FILE => 'Please choose an image to upload.',
        UPLOAD_ERR_NO_TMP_DIR => 'The server is missing a temporary upload folder.',
        UPLOAD_ERR_CANT_WRITE => 'The server could not write the uploaded image to disk.',
        UPLOAD_ERR_EXTENSION => 'The server blocked this upload. Please try a different image.',
    ];

    jsonResponse(['error' => $messages[$uploadError] ?? 'Upload failed'], 400);
}

$maxBytes = 10 * 1024 * 1024;
if (($file['size'] ?? 0) > $maxBytes) {
    jsonResponse(['error' => 'File is too large. Please upload an image under 10MB.'], 422);
}

$tmpName = $file['tmp_name'] ?? '';
if ($tmpName === '' || !is_uploaded_file($tmpName)) {
    jsonResponse(['error' => 'Invalid uploaded file'], 400);
}

$mimeType = mime_content_type($tmpName) ?: '';
$extensions = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
    'image/gif' => 'gif',
];

if (!isset($extensions[$mimeType])) {
    jsonResponse(['error' => 'Please upload a JPG, PNG, WEBP, or GIF image.'], 422);
}

$uploadsRoot = uploadsRootPath();
$targetFolder = $uploadsRoot . DIRECTORY_SEPARATOR . $folders[$type];
ensureDirectory($uploadsRoot);
ensureDirectory($targetFolder);

$fileName = sprintf('%s-%s.%s', $type, bin2hex(random_bytes(8)), $extensions[$mimeType]);
$targetPath = $targetFolder . DIRECTORY_SEPARATOR . $fileName;

if (!move_uploaded_file($tmpName, $targetPath)) {
    jsonResponse(['error' => 'Unable to save uploaded image'], 500);
}

$relativePath = '/uploads/' . $folders[$type] . '/' . $fileName;
jsonResponse([
    'message' => 'Image uploaded successfully',
    'path' => $relativePath,
    'url' => $relativePath,
], 201);
?>
