<?php
header("Content-Type: text/plain");
require __DIR__ . "/db.php";

echo "Database connected OK.\n";
$count = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
echo "Users in database: " . $count . "\n";
