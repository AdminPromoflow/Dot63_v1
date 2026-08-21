<?php

header('Content-Type: application/json; charset=utf-8');

include_once '../../controller/config/database.php';
include_once '../../model/super_lanyard_generator.php';

class SuperLanyardController
{
    private const PREVIEW_SESSION_KEY = 'super_lanyard_generation_preview';
    private const PREVIEW_TTL_SECONDS = 1800;

    public function handle(): void
    {
        if (($_SERVER['REQUEST_METHOD'] ?? 'POST') !== 'POST') {
            $this->respond(405, ['success' => false, 'error' => 'POST is required.']);
            return;
        }

        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_start();
        }

        $email = strtolower(trim((string)($_SESSION['email'] ?? '')));
        $isLoggedIn = !empty($_SESSION['login']);
        if (!$isLoggedIn || $email === '') {
            $this->respond(401, [
                'success' => false,
                'error' => 'Your supplier session has expired. Please sign in again.',
            ]);
            return;
        }

        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        if (!is_array($data)) {
            $this->respond(400, ['success' => false, 'error' => 'Invalid JSON request.']);
            return;
        }

        $generator = new SuperLanyardGenerator(new Database());
        switch ($data['action'] ?? null) {
            case 'preview_super_lanyard':
                $this->preview($generator, $email);
                return;

            case 'generate_super_lanyard':
                $this->generate($generator, $email, $data);
                return;

            default:
                $this->respond(400, ['success' => false, 'error' => 'Unsupported action.']);
        }
    }

    private function preview(SuperLanyardGenerator $generator, string $email): void
    {
        $result = $generator->preview($email);
        if (!$result['success']) {
            unset($_SESSION[self::PREVIEW_SESSION_KEY]);
            $this->respond(422, $result);
            return;
        }

        $token = bin2hex(random_bytes(24));
        $_SESSION[self::PREVIEW_SESSION_KEY] = [
            'token_hash' => hash('sha256', $token),
            'definition_signature' => $result['definition_signature'],
            'source_product_id' => (int)$result['source']['product_id'],
            'supplier_email' => $email,
            'expires_at' => time() + self::PREVIEW_TTL_SECONDS,
        ];

        unset($result['definition_signature']);
        $result['preview_token'] = $token;
        $result['preview_expires_in'] = self::PREVIEW_TTL_SECONDS;

        $this->respond(200, $result);
    }

    private function generate(
        SuperLanyardGenerator $generator,
        string $email,
        array $data
    ): void {
        $token = trim((string)($data['preview_token'] ?? ''));
        $preview = $_SESSION[self::PREVIEW_SESSION_KEY] ?? null;

        $validPreview = is_array($preview)
            && $token !== ''
            && ($preview['expires_at'] ?? 0) >= time()
            && hash_equals((string)($preview['supplier_email'] ?? ''), $email)
            && hash_equals(
                (string)($preview['token_hash'] ?? ''),
                hash('sha256', $token)
            );

        if (!$validPreview) {
            unset($_SESSION[self::PREVIEW_SESSION_KEY]);
            $this->respond(409, [
                'success' => false,
                'error' => 'Create a fresh Super Lanyard preview before generating products.',
                'preview_required' => true,
            ]);
            return;
        }

        // El token es de un solo uso. La operación es idempotente, pero exigir una
        // nueva vista previa evita ejecutar con un total que el usuario no vio.
        unset($_SESSION[self::PREVIEW_SESSION_KEY]);

        $result = $generator->generate(
            $email,
            (string)$preview['definition_signature'],
            (int)$preview['source_product_id']
        );

        $status = !empty($result['completed']) ? 200 : 422;
        $this->respond($status, $result);
    }

    private function respond(int $status, array $payload): void
    {
        http_response_code($status);
        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
}

(new SuperLanyardController())->handle();

