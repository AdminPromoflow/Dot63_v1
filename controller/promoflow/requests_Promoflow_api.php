<?php
require_once __DIR__ . "/../security/bootstrap.php";

require_once __DIR__ . "/../config/database.php";
require_once __DIR__ . "/../../model/users.php";

class ResquesPromoflowAPI
{
    private $dot63WebhookUrl = "https://promoflow.net/controller/dot63/promoflow_webhook.php";

    public function handleResques63API()
    {
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');

        $input = file_get_contents('php://input');
        $data  = json_decode($input, true);

        if (!is_array($data)) {
            echo json_encode([
                'success' => false,
                'error' => 'Invalid JSON payload.'
            ]);
            exit;
        }

        Dot63Security::post();
        $supplierEmail = Dot63Security::supplierEmail();
        if (in_array($data['action'] ?? '', ['create_case', 'send_message', 'delete_message', 'rename_case', 'delete_case'], true)) Dot63Security::csrf($data);
        if (($data['action'] ?? '') === 'create_case') {
            $supplier = new Users(new Database());
            $supplier->setEmail($supplierEmail);
            $data['supplierId'] = $supplier->getIdSupplierByEmail();
            if (!$data['supplierId']) Dot63Security::fail(403, 'Supplier not found.');
        }

        switch ($data["action"] ?? null) {
            case 'get_cases_and_messages':
                $this->getCasesAndMessages($data);
                break;

            case 'get_cases':
                $this->getCases($data);
                break;

            case 'create_case':
                $this->createCase($data);
                break;

            case 'rename_case':
            case 'delete_case':
                $this->sendToDotPromoflow(['action' => $data['action'], 'caseId' => $data['caseId'] ?? null, 'name' => $data['name'] ?? null]);
                break;

            case 'delete_message':
                $this->deleteMessage($data);
                break;

            case 'send_message':
                $this->sendMessage($data);
                break;

            case 'get_suppliers':
                $this->getSuppliers($data);
                break;

            default:
                echo json_encode([
                    'success' => false,
                    'error' => 'Unsupported action.'
                ]);
                break;
        }

        exit;
    }

    public function sendToDotPromoflow($payload)
    {
        // Authenticate through the supplier session; no separately deployed shared key.
        $csrf = Dot63Security::csrfToken();
        $sessionId = session_id();
        session_write_close();
        $ch = curl_init($this->dot63WebhookUrl);

        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json; charset=utf-8',
                'X-Dot63-Session: ' . $sessionId,
                'X-Dot63-CSRF-Token: ' . $csrf,
            ],
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_TIMEOUT => 20,
        ]);

        $response = curl_exec($ch);
        $curlError = curl_error($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        curl_close($ch);

        if ($response === false || !empty($curlError)) {
            echo json_encode([
                'success' => false,
                'error' => 'Could not connect to DOT63 API.',
                'curl_error' => $curlError
            ]);
            exit;
        }

        if ($httpCode < 200 || $httpCode >= 300) {
            $remote = json_decode($response, true);
            Dot63Security::fail($httpCode >= 400 && $httpCode < 600 ? $httpCode : 502,
                is_array($remote) ? ($remote['message'] ?? 'Messaging request failed.') : 'Messaging request failed.');
        }

        echo $response;
        exit;
    }

    private function getCasesAndMessages($data)
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            Dot63Security::startSession();
        }

        $email = $_SESSION['email'] ?? null;

        if (!$email) {
            echo json_encode([
                "response" => false,
                "message" => "No email found in session."
            ]);
            exit;
        }

        $connection = new Database();

        $user = new Users($connection);
        $user->setEmail($email);

        $user_id = $user->getIdSupplierByEmail();

        if (!$user_id) {
            echo json_encode([
                "response" => false,
                "message" => "Supplier user not found."
            ]);
            exit;
        }

        $payload = [
            "action" => "get_cases_and_messages",
            "caseId" => $data["caseId"] ?? null,
            "user_id" => $user_id
        ];

        $this->sendToDotPromoflow($payload);
    }

    private function getCases($data)
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            Dot63Security::startSession();
        }

        $email = $_SESSION['email'] ?? null;

        if (!$email) {
            echo json_encode([
                "response" => false,
                "message" => "No email found in session."
            ]);
            exit;
        }

        $connection = new Database();

        $user = new Users($connection);
        $user->setEmail($email);

        $user_id = $user->getIdSupplierByEmail();

        if (!$user_id) {
            echo json_encode([
                "response" => false,
                "message" => "Supplier user not found."
            ]);
            exit;
        }

        $payload = [
            "action" => "get_cases",
            "user_id" => $user_id
        ];

        $this->sendToDotPromoflow($payload);
    }

    private function createCase($data)
    {
        $payload = [
            "action" => "create_case",
            "caseName" => $data["caseName"] ?? null,
            "supplierId" => $data["supplierId"] ?? null
        ];

        $this->sendToDotPromoflow($payload);
    }

    private function sendMessage($data)
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            Dot63Security::startSession();
        }

        $email = $_SESSION['email'] ?? null;
        $connection = new Database();

        $user = new Users($connection);
        $user->setEmail($email);

        $user_id = $user->getIdSupplierByEmail();

        $payload = [
            "action" => "send_message",
            "caseId" => $data["caseId"] ?? null,
            "message" => $data["message"] ?? null,
            "user_id" => $user_id
        ];

        $this->sendToDotPromoflow($payload);
    }

    private function deleteMessage($data)
    {
        $id = filter_var($data['messageId'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        $case = filter_var($data['caseId'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if (!$id || !$case) Dot63Security::fail(400, 'Invalid message or case.');
        $user = new Users(new Database());
        $user->setEmail(Dot63Security::supplierEmail());
        $supplierId = $user->getIdSupplierByEmail();
        if (!$supplierId) Dot63Security::fail(403, 'Supplier not found.');
        $this->sendToDotPromoflow(['action' => 'delete_message', 'messageId' => $id,
            'caseId' => $case, 'user_id' => $supplierId]);
    }

    private function getSuppliers($data)
    {
        $payload = [
            "action" => "get_suppliers",
            "sku" => $data["sku"] ?? null
        ];

        $this->sendToDotPromoflow($payload);
    }
}

$apiHandler = new ResquesPromoflowAPI();
$apiHandler->handleResques63API();

?>
