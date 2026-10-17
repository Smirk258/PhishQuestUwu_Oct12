
<?php
require_once __DIR__ . "/db.php";

header("Content-Type: application/json; charset=utf-8");

echo json_encode([
    "success" => true,
    "message" => "PhishQuest is connected to MySQL!"
]);
