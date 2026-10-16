<?php
session_start();
require_once __DIR__ . "/db.php";

header("Content-Type: application/json; charset=utf-8");

function respond($status, $data) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    respond(405, ["success" => false, "message" => "POST required."]);
}

if (!isset($_SESSION["user_id"])) {
    respond(401, ["success" => false, "message" => "Please log in first."]);
}

$data = json_decode(file_get_contents("php://input"), true);

if (!is_array($data)) {
    respond(400, ["success" => false, "message" => "Invalid request."]);
}

$userId = (int) $_SESSION["user_id"];
$pre  = max(0, min(100, (int) ($data["preAssessmentPercent"] ?? 0)));
$post = max(0, min(100, (int) ($data["postAssessmentPercent"] ?? 0)));
$improvement = $post - $pre;

try {
    // One row per person: update it if it already exists, otherwise create it
    $check = $pdo->prepare(
        "SELECT id FROM assessment_results WHERE user_id = ? ORDER BY id DESC LIMIT 1"
    );
    $check->execute([$userId]);
    $existing = $check->fetch();

    if ($existing) {
        $stmt = $pdo->prepare(
            "UPDATE assessment_results
             SET pre_assessment_score = ?, post_assessment_score = ?,
                 improvement_score = ?, completed_at = NOW()
             WHERE id = ?"
        );
        $stmt->execute([$pre, $post, $improvement, $existing["id"]]);
    } else {
        $stmt = $pdo->prepare(
            "INSERT INTO assessment_results
             (user_id, pre_assessment_score, post_assessment_score, improvement_score)
             VALUES (?, ?, ?, ?)"
        );
        $stmt->execute([$userId, $pre, $post, $improvement]);
    }

    respond(200, ["success" => true, "message" => "Assessment result saved."]);
} catch (PDOException $e) {
    error_log($e->getMessage());
    respond(500, ["success" => false, "message" => "Unable to save the assessment result."]);
}
