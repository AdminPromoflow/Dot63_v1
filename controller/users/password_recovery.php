<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../../model/password_recovery.php';
require_once __DIR__ . '/../emails/send_emails.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
Dot63Security::post();
$data = json_decode((string)file_get_contents('php://input'), true);
if (!is_array($data)) Dot63Security::fail(400, 'Invalid request payload.');
Dot63Security::csrf($data);
session_write_close();

$string = static fn(string $key): string => is_string($data[$key] ?? null) ? $data[$key] : '';
$type = $string('account_type');
$action = $string('action');
if (!in_array($type, ['customer', 'supplier'], true)) Dot63Security::fail(422, 'Choose a customer or supplier account.');
if (!in_array($action, ['request_reset', 'validate_token', 'reset_password'], true)) Dot63Security::fail(400, 'Unsupported recovery action.');

try {
    $email = strtolower(trim($string('email')));
    if ($action === 'request_reset' && (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 50)) {
        Dot63Security::fail(422, 'Enter a valid email address using no more than 50 characters.');
    }
    if ($action === 'reset_password') {
        $error = PasswordRecovery::passwordError($string('password'));
        if ($error !== null) Dot63Security::fail(422, $error);
        if ($string('password') !== $string('password_confirmation')) Dot63Security::fail(422, 'The passwords do not match.');
    }
    $recovery = new PasswordRecovery((new Database())->getConnection());
    if ($action === 'request_reset') {
        $recovery->request($type, $email, (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown'),
            static function (array $account, string $type, string $token): bool {
                $mail = new EmailsSender();
                $mail->setRecipientEmail($account['email']);
                $mail->setRecipientName($account['name']);
                return $mail->sendEmailPasswordReset($type, $token);
            });
        echo json_encode(['success' => true, 'message' => 'If an account matches that email, you will receive a password reset link. Check your inbox and spam folder. You can request up to 3 links every 15 minutes.']);
    } elseif ($action === 'validate_token') {
        if (!$recovery->isValid($type, $string('token'))) Dot63Security::fail(410, 'This reset link is invalid or has expired. Request a new link.');
        echo json_encode(['success' => true]);
    } else {
        if (!$recovery->reset($type, $string('token'), $string('password'))) Dot63Security::fail(410, 'This reset link is invalid or has expired. Request a new link.');
        echo json_encode(['success' => true, 'message' => 'Your password has been updated. You can now log in with your new password.']);
    }
} catch (Throwable $error) {
    // Do not log submitted credentials, reset tokens or database parameters.
    error_log('Dot63 password recovery failed: ' . get_class($error));
    Dot63Security::fail(503, 'Password recovery is temporarily unavailable. Please try again later.');
}
