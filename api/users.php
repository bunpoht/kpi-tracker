<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'db.php';

try {
    $stmt = $pdo->query("SELECT id, name, email, role, status FROM Users ORDER BY id DESC");
    $users = $stmt->fetchAll();
    
    echo json_encode(['status' => 'success', 'data' => $users]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
