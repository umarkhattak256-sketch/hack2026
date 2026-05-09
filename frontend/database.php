<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'donortrace');
define('GROQ_API_KEY', getenv('GROQ_API_KEY') ?: 'YOUR_GROQ_API_KEY_HERE');
define('GROQ_MODEL', 'llama3-70b-8192');
define('STRIPE_SECRET_KEY', getenv('STRIPE_SECRET_KEY') ?: 'YOUR_STRIPE_SECRET_KEY_HERE');
define('STRIPE_PUBLISHABLE_KEY', getenv('STRIPE_PUBLISHABLE_KEY') ?: 'YOUR_STRIPE_PUBLISHABLE_KEY_HERE');

function getDB() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        die(json_encode(['error' => 'Connection failed']));
    }
    return $conn;
}
?>