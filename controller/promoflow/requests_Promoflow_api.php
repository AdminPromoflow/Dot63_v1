<?php
echo json_encode(["ok"=> true]);exit;

include "../../model/users.php"
class ResquesPromoflowAPI
{
    private $dot63WebhookUrl = "https://promoflow.net/controller/dot63/promoflow_webhook.php";

    public function handleResques63API()
    {
        header('Content-Type: application/json; charset=utf-8');

        $input = file_get_contents('php://input');
        $data  = json_decode($input, true);

        if (!is_array($data)) {
            echo json_encode([
                'success' => false,
                'error' => 'Invalid JSON payload.'
            ]);
            exit;
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
        $ch = curl_init($this->dot63WebhookUrl);

        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json; charset=utf-8',
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
            echo json_encode([
                'success' => false,
                'error' => 'DOT63 API returned an invalid HTTP response.',
                'http_code' => $httpCode,
                'response' => $response
            ]);
            exit;
        }

        echo $response;
        exit;
    }

    private function getCasesAndMessages($data)
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_start();
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
            session_start();
        }

        $email = $_SESSION['email'] ?? null;

        $connection = new Database();

        $user = new Users($connection);
        $user->setEmail($email);

        $user_id = $user->getIdSupplierByEmail();

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
        $payload = [
            "action" => "send_message",
            "caseId" => $data["caseId"] ?? null,
            "message" => $data["message"] ?? null
        ];

        $this->sendToDotPromoflow($payload);
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

$payload = json_decode(file_get_contents("php://input"), true);

if (is_array($payload)) {
    $apiHandler = new ResquesPromoflowAPI();
    $apiHandler->handleResques63API();
} else {
    header('Content-Type: application/json; charset=utf-8');

    echo json_encode([
        'success' => false,
        'error' => 'No valid payload received.'
    ]);

    exit;
}

?>
