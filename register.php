
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

if (!is_array($data)) {
    respond(400, ["success" => false, "message" => "Invalid request."]);
}

$firstName = trim($data["firstname"] ?? "");
$lastName = trim($data["lastname"] ?? "");
$username = trim($data["username"] ?? "");
$email = strtolower(trim($data["email"] ?? ""));
$password = $data["password"] ?? "";

if (
    $firstName === "" || $lastName === "" ||
    $username === "" || $email === "" ||
    !is_string($password) || $password === ""
) {
    respond(400, ["success" => false, "message" => "Please fill in all fields."]);
}

if (
    strlen($username) > 50 ||
    strlen($firstName) > 50 ||
    strlen($lastName) > 50 ||
    strlen($email) > 100
) {
    respond(400, ["success" => false, "message" => "One or more fields are too long."]);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL) ||
    !str_ends_with($email, "@gmail.com")) {
    respond(400, ["success" => false, "message" => "Please use a valid Gmail address."]);
}

if (strlen($password) < 8 || strlen($password) > 72) {
    respond(400, ["success" => false, "message" => "Password must be 8–72 characters."]);
}

try {
    $check = $pdo->prepare(
        "SELECT id FROM users WHERE username = ? OR email = ?"
    );
    $check->execute([$username, $email]);

    if ($check->fetch()) {
        respond(409, [
            "success" => false,
            "message" => "Username or email already exists."
        ]);
    }

    $agentNumber = random_int(10000, 99999);
    $hash = password_hash($password, PASSWORD_DEFAULT);

    $pdo->beginTransaction();

    $stmt = $pdo->prepare(
        "INSERT INTO users
        (username, first_name, last_name, email, password, agent_number)
        VALUES (?, ?, ?, ?, ?, ?)"
    );

    $stmt->execute([
        $username, $firstName, $lastName,
        $email, $hash, $agentNumber
    ]);

    $userId = (int)$pdo->lastInsertId();

    $stmt = $pdo->prepare(
        "INSERT INTO user_progress (user_id, mission_progress)
        VALUES (?, ?)"
    );
    $stmt->execute([$userId, "{}"]);

    $pdo->commit();

    session_regenerate_id(true);
    $_SESSION["user_id"] = $userId;

    respond(201, [
        "success" => true,
        "message" => "Registration successful.",
        "user" => [
            "id" => $userId,
            "firstname" => $firstName,
            "lastname" => $lastName,
            "username" => $username,
            "email" => $email,
            "agentNumber" => $agentNumber,
            "score" => 0,
            "scenariosCompleted" => 0,
            "missionProgress" => (object)[],
            "preAssessmentScore" => 0,
            "postAssessmentScore" => 0,
            "preAssessmentCompleted" => false,
            "postAssessmentCompleted" => false
        ]
    ]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log($e->getMessage());

    if ($e->getCode() === "23000") {
        respond(409, [
            "success" => false,
            "message" => "Username, email, or agent number already exists. Please try again."
        ]);
    }

    respond(500, [
        "success" => false,
        "message" => "Registration failed. Please try again."
    ]);
}
