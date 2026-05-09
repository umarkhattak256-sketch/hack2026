<?php
require_once 'C:/xampp/htdocs/donortrace/backend/config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

// Accept both formats from React
$donor_id = isset($data['donor_id']) ? $data['donor_id'] : 
            (isset($data['donorId']) ? $data['donorId'] : null);

$ngo_name = isset($data['ngo_name']) ? $data['ngo_name'] : 
            (isset($data['ngoName']) ? $data['ngoName'] : null);

$amount = isset($data['amount']) ? floatval($data['amount']) : null;

$currency = isset($data['currency']) ? $data['currency'] : 'USD';
$stripe_payment_id = 'stripe_test_' . time() . '_' . rand(1000, 9999);

if (!$donor_id || !$ngo_name || !$amount) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

if ($amount <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid amount']);
    exit;
}

$db = getDB();

// Find NGO id by name
$ngoStmt = $db->prepare("SELECT id FROM ngos WHERE name = ? LIMIT 1");
$ngoStmt->bind_param("s", $ngo_name);
$ngoStmt->execute();
$ngoResult = $ngoStmt->get_result();

if ($ngoResult->num_rows === 0) {
    $ngo_id = 0;
} else {
    $ngo = $ngoResult->fetch_assoc();
    $ngo_id = $ngo['id'];
}

// Save donation
$stmt = $db->prepare("INSERT INTO donations (donor_id, ngo_id, amount, currency, stripe_payment_id, status) VALUES (?, ?, ?, ?, ?, 'held')");
$stmt->bind_param("iidss", $donor_id, $ngo_id, $amount, $currency, $stripe_payment_id);

if ($stmt->execute()) {
    $donation_id = $db->insert_id;

    // Create 3 milestones automatically
    $milestones = [
        ['Supplies purchased', round($amount * 0.33, 2)],
        ['Beneficiaries helped', round($amount * 0.33, 2)],
        ['Final impact report', round($amount * 0.34, 2)],
    ];

    $mStmt = $db->prepare("INSERT INTO milestones (donation_id, title, amount, status) VALUES (?, ?, ?, 'pending')");
    foreach ($milestones as $milestone) {
        $mStmt->bind_param("isd", $donation_id, $milestone[0], $milestone[1]);
        $mStmt->execute();
    }

    echo json_encode([
        'success' => true,
        'message' => 'Donation created successfully',
        'donation_id' => $donation_id,
        'stripe_payment_id' => $stripe_payment_id,
        'milestones_created' => 3
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to save donation']);
}

$db->close();
?>