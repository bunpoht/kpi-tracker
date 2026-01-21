<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$host = 'localhost';
$username = 'root';
$password = '';

echo "<h1>Database Setup</h1>";

try {
    // 1. Connect without database selected
    $pdo = new PDO("mysql:host=$host", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Connected to MySQL server successfully.<br>";

    // 2. Create Database
    $pdo->exec("CREATE DATABASE IF NOT EXISTS kpi_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "Database 'kpi_tracker' created or already exists.<br>";

    // 3. Connect to the database
    $pdo->exec("USE kpi_tracker");

    // 4. Create Tables (MySQL Compatible)
    
    // Users
    $sql_users = "CREATE TABLE IF NOT EXISTS Users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role ENUM('ADMIN', 'USER') DEFAULT 'USER',
        status VARCHAR(50) DEFAULT 'APPROVED',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    $pdo->exec($sql_users);
    echo "Table 'Users' checked/created.<br>";

    // Goals
    $sql_goals = "CREATE TABLE IF NOT EXISTS Goals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        target DECIMAL(10, 2) NOT NULL,
        startDate DATE NOT NULL,
        endDate DATE NOT NULL,
        createdById INT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (createdById) REFERENCES Users(id) ON DELETE CASCADE
    )";
    $pdo->exec($sql_goals);
    echo "Table 'Goals' checked/created.<br>";

    // GoalAssignments
    $sql_assignments = "CREATE TABLE IF NOT EXISTS GoalAssignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        goalId INT NOT NULL,
        userId INT NOT NULL,
        assignedTarget DECIMAL(10, 2) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_goal_user (goalId, userId),
        FOREIGN KEY (goalId) REFERENCES Goals(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
    )";
    $pdo->exec($sql_assignments);
    echo "Table 'GoalAssignments' checked/created.<br>";

    // WorkLogs
    $sql_worklogs = "CREATE TABLE IF NOT EXISTS WorkLogs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        goalId INT NOT NULL,
        userId INT NOT NULL,
        completedWork DECIMAL(10, 2) NOT NULL,
        description TEXT,
        date DATE NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (goalId) REFERENCES Goals(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
    )";
    $pdo->exec($sql_worklogs);
    echo "Table 'WorkLogs' checked/created.<br>";

    // Images
    $sql_images = "CREATE TABLE IF NOT EXISTS Images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workLogId INT NOT NULL,
        url TEXT NOT NULL,
        publicId VARCHAR(255),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (workLogId) REFERENCES WorkLogs(id) ON DELETE CASCADE
    )";
    $pdo->exec($sql_images);
    echo "Table 'Images' checked/created.<br>";

    // Insert Default Admin User if not exists
    $stmt = $pdo->query("SELECT COUNT(*) FROM Users WHERE email = 'admin@example.com'");
    if ($stmt->fetchColumn() == 0) {
        // Password: 'password' (hashed)
        $passwordHash = password_hash('password', PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO Users (email, password, name, role) VALUES (?, ?, ?, ?)");
        $stmt->execute(['admin@example.com', $passwordHash, 'Admin User', 'ADMIN']);
        echo "Default admin user (admin@example.com / password) created.<br>";
    }

    echo "<h3>Setup Completed Successfully!</h3>";
    echo "<a href='test_connection.php'>Go to Test Connection</a>";

} catch (PDOException $e) {
    echo "<h3>Error:</h3>";
    echo $e->getMessage();
}
?>
