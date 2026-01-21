<?php
// Database configuration
$host = '127.0.0.1';
$username = 'root';
$password = '';
$dbname = 'kpi_tracker';

try {
    $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    $pdo = new PDO($dsn, $username, $password, $options);
    
} catch (PDOException $e) {
    if ($e->getCode() == 1049) {
        die("Database '$dbname' not found. Please create it first.");
    }
    die("Connection failed: " . $e->getMessage());
}
?>
