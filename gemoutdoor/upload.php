<?php
// GEM Outdoor – Görsel Yükleme
// Kullanım: admin.html'den AJAX ile çağrılır

// Basit kimlik doğrulama
session_start();
if (empty($_SESSION['gem_auth'])) {
    http_response_code(403);
    die(json_encode(['error' => 'Yetkisiz erişim']));
}

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || empty($_FILES['image'])) {
    die(json_encode(['error' => 'Dosya gönderilmedi']));
}

$file  = $_FILES['image'];
$allowed = ['image/jpeg','image/png','image/gif','image/webp','image/svg+xml'];

if (!in_array($file['type'], $allowed)) {
    die(json_encode(['error' => 'Desteklenmeyen dosya türü']));
}

if ($file['size'] > 10 * 1024 * 1024) { // 10MB limit
    die(json_encode(['error' => 'Dosya 10MB\'dan büyük olamaz']));
}

$ext      = pathinfo($file['name'], PATHINFO_EXTENSION);
$name     = preg_replace('/[^a-z0-9_-]/i', '-', pathinfo($file['name'], PATHINFO_FILENAME));
$filename = strtolower($name) . '.' . strtolower($ext);
$target   = __DIR__ . '/images/' . $filename;

if (!is_dir(__DIR__ . '/images')) {
    mkdir(__DIR__ . '/images', 0755, true);
}

if (move_uploaded_file($file['tmp_name'], $target)) {
    echo json_encode(['url' => 'images/' . $filename]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Yükleme başarısız']);
}
