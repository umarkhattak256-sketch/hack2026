<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/_schema.php';
require_once __DIR__ . '/_finalize_logic.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true) ?: [];
$groupId = isset($data['group_id']) ? (int)$data['group_id'] : 0;

if ($groupId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'group_id is required']);
    exit;
}

$db = getDB();
ensureMatchingSchema($db);

$result = runFinalize($db, $groupId);
if (!isset($result['success']) || !$result['success']) {
    http_response_code(400);
}
echo json_encode($result);

$db->close();
