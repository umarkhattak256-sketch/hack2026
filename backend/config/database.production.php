<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Safe-to-commit production template — contains NO real secrets.
// The Docker build copies this into config/database.php at build time
// (see Dockerfile). All real values come from environment variables set
// in the Railway dashboard, never from this file. Your actual local
// database.php (with real keys) stays gitignored and untouched.
function envOr($name, $default) {
    $value = getenv($name);
    return ($value !== false && $value !== '') ? $value : $default;
}

define('DB_HOST', envOr('MYSQLHOST', 'localhost'));
define('DB_USER', envOr('MYSQLUSER', 'root'));
define('DB_PASS', envOr('MYSQLPASSWORD', ''));
define('DB_NAME', envOr('MYSQLDATABASE', 'showup2move'));
define('DB_PORT', envOr('MYSQLPORT', '3306'));

define('GROQ_API_KEY', envOr('GROQ_API_KEY', ''));
define('GROQ_MODEL', envOr('GROQ_MODEL', 'openai/gpt-oss-120b'));
define('STRIPE_SECRET_KEY', envOr('STRIPE_SECRET_KEY', ''));
define('STRIPE_PUBLISHABLE_KEY', envOr('STRIPE_PUBLISHABLE_KEY', ''));

function getDB() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, (int)DB_PORT);
    if ($conn->connect_error) {
        die(json_encode(['error' => 'Connection failed']));
    }
    return $conn;
}
?>
