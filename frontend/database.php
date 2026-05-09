<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'donortrace');
define('GROQ_API_KEY', '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');
define('GROQ_MODEL', 'llama3-70b-8192');
define('STRIPE_SECRET_KEY', 'sk_test_51TU3fWC7gczbbaaVMxfBq4Hni1AxLQqhFbqGywJN8qq51rfUWUdyXN9nHcBt6h55H3fl6ilBVja6p0pJaMju32RY00vfzty6o6');
define('STRIPE_PUBLISHABLE_KEY', 'pk_test_51TU3fWC7gczbbaaVWKsDelhUE3T4GfZuTd9nr7BuzexopFf75ZHQDZJde2AdS0QeAFJMlfc0g1xwVYADBlu0kPKJ00IrMvfq3');

function getDB() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        die(json_encode(['error' => 'Connection failed']));
    }
    return $conn;
}
?>