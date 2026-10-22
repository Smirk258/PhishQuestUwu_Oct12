<?php
session_start();
require_once __DIR__ . "/db.php";

header("Content-Type: application/json; charset=utf-8");

function respond($status, $data) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

if (!isset($_SESSION["user_id"])) {
    respond(200, ["success" => false, "message" => "Not logged in."]);
}

try {
    $stmt = $pdo->prepare(
        "SELECT
            u.id, u.username, u.first_name, u.last_name,
            u.email, u.agent_number,
            p.score, p.scenarios_completed,
            p.pre_assessment_score, p.post_assessment_score,
            p.pre_assessment_completed, p.post_assessment_completed,
            p.mission_progress
         FROM users u
         LEFT JOIN user_progress p ON p.user_id = u.id
         WHERE u.id = ?
         LIMIT 1"
    );
    $stmt->execute([(int)$_SESSION["user_id"]]);
    $row = $stmt->fetch();

    if (!$row) {
        $_SESSION = [];
        session_destroy();
        respond(200, ["success" => false, "message" => "Not logged in."]);
    }

    $missionProgress = json_decode($row["mission_progress"] ?: "{}", true);
    if (!is_array($missionProgress)) {
        $missionProgress = [];
    }

    respond(200, [
        "success" => true,
        "user" => [
            "id" => (int)$row["id"],
            "firstname" => $row["first_name"],
            "lastname" => $row["last_name"],
            "username" => $row["username"],
            "email" => $row["email"],
            "agentNumber" => (int)$row["agent_number"],
            "score" => (int)($row["score"] ?? 0),
            "scenariosCompleted" => (int)($row["scenarios_completed"] ?? 0),
            "missionProgress" => $missionProgress,
            "preAssessmentScore" => (int)($row["pre_assessment_score"] ?? 0),
            "postAssessmentScore" => (int)($row["post_assessment_score"] ?? 0),
            "preAssessmentCompleted" => (bool)($row["pre_assessment_completed"] ?? false),
            "postAssessmentCompleted" => (bool)($row["post_assessment_completed"] ?? false)
        ]
    ]);
} catch (PDOException $e) {
    error_log($e->getMessage());
    respond(500, ["success" => false, "message" => "Could not restore session."]);
}
