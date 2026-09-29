<?php
/** Shared HTTP/session settings. Safe to include from CLI model tests. */
final class Dot63Security
{
    public static function configure(): void
    {
        if (session_status() === PHP_SESSION_NONE && !headers_sent()) {
            ini_set('session.use_strict_mode', '1');
            ini_set('session.use_only_cookies', '1');
            session_set_cookie_params([
                'lifetime' => 0, 'path' => '/',
                'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
                'httponly' => true, 'samesite' => 'Lax',
            ]);
        }
        if (PHP_SAPI !== 'cli' && !headers_sent()) {
            header_remove('X-Powered-By');
            header('X-Content-Type-Options: nosniff');
            header('X-Frame-Options: SAMEORIGIN');
            header('Referrer-Policy: strict-origin-when-cross-origin');
            header("Content-Security-Policy: base-uri 'self'; object-src 'none'; frame-ancestors 'self'");
            header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
        }
    }

    public static function startSession(): void
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            self::configure();
            session_start();
        }
    }

    public static function fail(int $status, string $message): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        echo json_encode(['success' => false, 'response' => false, 'error' => $message], JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function post(): void
    {
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
            header('Allow: POST');
            self::fail(405, 'Use POST for this request.');
        }
    }

    public static function csrfToken(): string
    {
        self::startSession();
        if (empty($_SESSION['dot63_csrf_token'])) {
            $_SESSION['dot63_csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['dot63_csrf_token'];
    }

    public static function csrf(array $data = []): void
    {
        self::post();
        self::startSession();
        $token = $_SERVER['HTTP_X_DOT63_CSRF_TOKEN'] ?? $data['_csrf'] ?? '';
        $expected = $_SESSION['dot63_csrf_token'] ?? '';
        if (!is_string($token) || !is_string($expected) || $expected === '' || !hash_equals($expected, $token)) {
            self::fail(419, 'Your session expired. Refresh the page and try again.');
        }
    }

    public static function supplierEmail(): string
    {
        self::startSession();
        $email = $_SESSION['email'] ?? '';
        if (empty($_SESSION['login']) || !is_string($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            self::fail(401, 'Please sign in as a supplier.');
        }
        return strtolower(trim($email));
    }

    public static function reviewer(): void
    {
        self::startSession();
        if (($_SESSION['is_logged'] ?? false) !== true || empty($_SESSION['user_email'])) {
            self::fail(401, 'Please sign in to Promoflow.');
        }
    }

    public static function assetUrl(string $path): string
    {
        $root = dirname(__DIR__, 2);
        $script = realpath($_SERVER['SCRIPT_FILENAME'] ?? '') ?: '';
        $name = $_SERVER['SCRIPT_NAME'] ?? '';
        $suffix = substr($script, strlen($root));
        $base = strpos($script, $root . '/') === 0 && $suffix !== '' && substr($name, -strlen($suffix)) === $suffix
            ? substr($name, 0, -strlen($suffix)) : '';
        return htmlspecialchars($base . '/' . ltrim($path, '/'), ENT_QUOTES, 'UTF-8');
    }
}
Dot63Security::configure();
