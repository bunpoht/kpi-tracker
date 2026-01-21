<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'db.php';

if ($pdo) {
    echo "<h1>Connected successfully!</h1>";
    echo "Database: " . htmlspecialchars($dbname) . "<br>";
    echo "Host: " . htmlspecialchars($host) . "<br>";
    
    // Try to query users
    try {
        $stmt = $pdo->query("SELECT count(*) as count FROM Users");
        $row = $stmt->fetch();
        echo "User count: " . $row['count'];
    } catch (Exception $e) {
        echo "Could not query Users table: " . $e->getMessage();
    }
}
?>
