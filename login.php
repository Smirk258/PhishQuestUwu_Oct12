
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

$data = json_decode(file_get_contents("php://input"), true);

$username = trim($data["username"] ?? "");
$password = $data["password"] ?? "";

if ($username === "" || !is_string($password) || $password === "") {
    respond(400, ["success" => false, "message" => "Enter your username and password."]);
}

try {
    $stmt = $pdo->prepare(
        "SELECT
            u.id, u.username, u.first_name, u.last_name,
            u.email, u.password, u.agent_number,
            p.score, p.scenarios_completed,
            p.pre_assessment_score, p.post_assessment_score,
            p.pre_assessment_completed, p.post_assessment_completed,
            p.mission_progress
         FROM users u
         LEFT JOIN user_progress p ON p.user_id = u.id
         WHERE u.username = ?
         LIMIT 1"
    );

    $stmt->execute([$username]);
    $row = $stmt->fetch();

    if (!$row || !password_verify($password, $row["password"])) {
        respond(401, [
            "success" => false,
            "message" => "Invalid Student ID or password."
        ]);
    }

    session_regenerate_id(true);
    $_SESSION["user_id"] = (int)$row["id"];

    $missionProgress = json_decode(
        $row["mission_progress"] ?: "{}",
        true
    );

    if (!is_array($missionProgress)) {
        $missionProgress = [];
    }

    respond(200, [
        "success" => true,
        "message" => "Login successful.",
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

    respond(500, [
        "success" => false,
        "message" => "Login failed. Please try again."
    ]);
}
