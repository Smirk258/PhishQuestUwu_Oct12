
<?php
session_start();

header("Content-Type: application/json");

require_once __DIR__ . "/db.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "POST requests only."
    ]);
    exit;
}

if (!isset($_SESSION["user_id"])) {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "Please log in first."
    ]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid request data."
    ]);
    exit;
}

$userId = (int) $_SESSION["user_id"];

$score = max(0, (int) ($data["score"] ?? 0));
$scenariosCompleted = max(
    0,
    (int) ($data["scenariosCompleted"] ?? 0)
);

$preAssessmentScore = max(
    0,
    (int) ($data["preAssessmentScore"] ?? 0)
);

$postAssessmentScore = max(
    0,
    (int) ($data["postAssessmentScore"] ?? 0)
);

$preAssessmentCompleted = !empty(
    $data["preAssessmentCompleted"]
) ? 1 : 0;

$postAssessmentCompleted = !empty(
    $data["postAssessmentCompleted"]
) ? 1 : 0;

$missionProgress = json_encode(
    $data["missionProgress"] ?? new stdClass()
);

if ($missionProgress === false) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Invalid mission progress."
    ]);
    exit;
}

try {
    $stmt = $pdo->prepare(
        "UPDATE user_progress
         SET score = ?,
             scenarios_completed = ?,
             pre_assessment_score = ?,
             post_assessment_score = ?,
             pre_assessment_completed = ?,
             post_assessment_completed = ?,
             mission_progress = ?
         WHERE user_id = ?"
    );

    $stmt->execute([
        $score,
        $scenariosCompleted,
        $preAssessmentScore,
        $postAssessmentScore,
        $preAssessmentCompleted,
        $postAssessmentCompleted,
        $missionProgress,
        $userId
    ]);

    if ($stmt->rowCount() === 0) {
        $check = $pdo->prepare(
            "SELECT id FROM user_progress WHERE user_id = ?"
        );
        $check->execute([$userId]);

        if (!$check->fetch()) {
            http_response_code(404);
            echo json_encode([
                "success" => false,
                "message" => "Progress record not found."
            ]);
            exit;
        }
    }

    echo json_encode([
        "success" => true,
        "message" => "Progress saved to MySQL."
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Unable to save progress."
    ]);
}
