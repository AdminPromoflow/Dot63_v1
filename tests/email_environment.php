<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__ . '/../controller/emails/send_emails.php';

// Exercise the shared reader without sending messages or reading real credentials.
$reader = new ReflectionMethod(EmailsSender::class, 'environmentValue');
$reader->setAccessible(true);
$sender = new EmailsSender();
$key = 'DOT63_TEST_MAIL_ENV_' . bin2hex(random_bytes(6));
$read = static fn(): string => $reader->invoke($sender, $key, 'fallback');
$check = static function (string $expected) use ($read): void {
    if ($read() !== $expected) throw new RuntimeException('Email environment lookup failed.');
};
try {
    $_SERVER['HTTP_' . $key] = 'untrusted';
    $check('fallback');
    $_SERVER['REDIRECT_REDIRECT_' . $key] = 'double-redirect';
    $check('double-redirect');
    $_SERVER['REDIRECT_' . $key] = 'redirect';
    $check('redirect');
    $_SERVER[$key] = 'server';
    $check('server');
    $_ENV[$key] = 'environment';
    $check('environment');
    putenv($key . '=process');
    $check('process');
    putenv($key . '=');
    $check('environment');
    echo "PASS email environment sources, precedence, redirects and HTTP header exclusion\n";
} finally {
    putenv($key);
    unset($_ENV[$key], $_SERVER[$key], $_SERVER['REDIRECT_' . $key], $_SERVER['REDIRECT_REDIRECT_' . $key], $_SERVER['HTTP_' . $key]);
}
