<?php

require_once __DIR__ . '/../assets/lib/send-email/PHPMailer/src/Exception.php';
require_once __DIR__ . '/../assets/lib/send-email/PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/../assets/lib/send-email/PHPMailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;

class EmailsSender
{
    private $recipientEmail = '';
    private $recipientName = '';
    private $recipientPassword = '';
    private $supplierName = '';
    private $supplierEmail = '';
    private $productName = '';
    private $productSku = '';
    private $approvalUrl = '';
    private $notificationType = 'unknown';

    public function setRecipientEmail($recipientEmail): void
    {
        $this->recipientEmail = trim((string)$recipientEmail);
    }

    public function setRecipientName($recipientName): void
    {
        $this->recipientName = trim((string)$recipientName);
    }

    /**
     * Retained for backwards compatibility. Passwords are deliberately never emailed.
     */
    public function setRecipientPassword($recipientPassword): void
    {
        $this->recipientPassword = (string)$recipientPassword;
    }

    public function setSupplierName($supplierName): void
    {
        $this->supplierName = trim((string)$supplierName);
    }

    public function setSupplierEmail($supplierEmail): void
    {
        $this->supplierEmail = trim((string)$supplierEmail);
    }

    public function setProductName($productName): void
    {
        $this->productName = trim((string)$productName);
    }

    public function setProductSku($productSku): void
    {
        $this->productSku = trim((string)$productSku);
    }

    public function setApprovalUrl($approvalUrl): void
    {
        $this->approvalUrl = trim((string)$approvalUrl);
    }

    public function sendEmailProductApprovalNotice(): bool
    {
        try {
            $this->notificationType = 'product_approval';
            $mail = $this->createMailer();
            $seen = [];
            $this->addUniqueAddress(
                $mail,
                $seen,
                $this->recipientEmail !== '' ? $this->recipientEmail : 'admin@promoflow.net',
                $this->recipientName !== '' ? $this->recipientName : 'PromoFlow Admin'
            );
            $this->addUniqueAddress($mail, $seen, 'ian@kan-do-it.com', 'Ian Southworth');
            $this->addUniqueAddress($mail, $seen, 'aleinarossui@gmail.com', 'Alexandra Rozo');

            $productName = $this->escape($this->productName !== '' ? $this->productName : 'Product pending review');
            $productSku = $this->escape($this->productSku !== '' ? $this->productSku : 'N/A');
            $supplierName = $this->escape($this->supplierName !== '' ? $this->supplierName : 'A supplier');
            $supplierEmail = $this->escape($this->supplierEmail);
            $approvalUrl = $this->escape(
                $this->approvalUrl !== '' ? $this->approvalUrl : 'https://promoflow.net'
            );

            $mail->Subject = 'Product sent for approval';
            $mail->isHTML(true);
            $mail->Body = $this->htmlTemplate(
                'PromoFlow approval',
                'Product sent for approval',
                '<p>A supplier has submitted a product and it is waiting for review in PromoFlow.</p>'
                . '<div style="margin:20px 0;padding:16px;background:#f8fafc;border:1px solid #dce3ea;border-radius:10px;">'
                . '<p><strong>Product:</strong> ' . $productName . '</p>'
                . '<p><strong>SKU:</strong> ' . $productSku . '</p>'
                . '<p><strong>Supplier:</strong> ' . $supplierName . '</p>'
                . '<p><strong>Supplier email:</strong> ' . $supplierEmail . '</p>'
                . '</div>'
                . '<p>Please review the product details, variations, images and prices before approving it.</p>'
                . '<p><a href="' . $approvalUrl . '" style="display:inline-block;padding:12px 18px;background:#1f3551;color:#fff;text-decoration:none;border-radius:999px;">Review product in PromoFlow</a></p>'
            );
            $mail->AltBody =
                "A product is waiting for approval in PromoFlow.\n\n"
                . "Product: {$this->productName}\n"
                . "SKU: {$this->productSku}\n"
                . "Supplier: {$this->supplierName}\n"
                . "Supplier email: {$this->supplierEmail}\n\n"
                . 'Review product: ' . ($this->approvalUrl !== '' ? $this->approvalUrl : 'https://promoflow.net');

            return $this->deliver($mail);
        } catch (Throwable $error) {
            error_log('EmailsSender::sendEmailProductApprovalNotice error -> ' . $error->getMessage());
            return false;
        }
    }

    public function sendEmailSupplierRegistration(): bool
    {
        $this->notificationType = 'supplier_registration';

        return $this->sendRegistrationNotice(
            'Supplier account created',
            'Your supplier account has been created successfully. You can now sign in and start preparing products for approval.',
            'https://lanyardsforyou.com/view/log_inSupplier/index.php'
        );
    }

    public function sendEmailCustomerRegistration(): bool
    {
        $this->notificationType = 'customer_registration';

        return $this->sendRegistrationNotice(
            'Welcome to .63',
            'Your customer account has been created successfully. You can now browse products, save your cart and complete orders.',
            'https://lanyardsforyou.com/view/log_in/index.php'
        );
    }

    public function sendEmailPaymentConfirmation(array $order): bool
    {
        try {
            $this->notificationType = 'payment_confirmation';
            if (!filter_var($this->recipientEmail, FILTER_VALIDATE_EMAIL)) {
                throw new InvalidArgumentException('A valid payment confirmation recipient is required.');
            }

            $orderId = (int)($order['order_id'] ?? 0);
            if ($orderId <= 0) {
                throw new InvalidArgumentException('A valid order ID is required.');
            }

            $currency = strtoupper(trim((string)($order['currency'] ?? 'GBP')));
            $currency = preg_replace('/[^A-Z]/', '', $currency) ?: 'GBP';
            $total = number_format((float)($order['total_amount'] ?? 0), 2, '.', ',');
            $paidAt = trim((string)($order['paid_at'] ?? ''));
            $safeName = $this->escape($this->recipientName !== '' ? $this->recipientName : 'there');
            $safeOrderId = $this->escape((string)$orderId);
            $safeTotal = $this->escape($currency . ' ' . $total);
            $safePaidAt = $this->escape($paidAt !== '' ? $paidAt : date('Y-m-d H:i:s'));

            $mail = $this->createMailer();
            $mail->addAddress($this->recipientEmail, $this->recipientName);
            $mail->Subject = 'Payment received for order #' . $orderId;
            $mail->isHTML(true);
            $mail->Body = $this->htmlTemplate(
                '.63 payment notification',
                'Payment received',
                '<p>Hello ' . $safeName . ',</p>'
                . '<p>Your payment was completed successfully. Your order is now being processed.</p>'
                . '<div style="margin:20px 0;padding:16px;background:#f8fafc;border:1px solid #dce3ea;border-radius:10px;">'
                . '<p><strong>Order:</strong> #' . $safeOrderId . '</p>'
                . '<p><strong>Total paid:</strong> ' . $safeTotal . '</p>'
                . '<p><strong>Payment date:</strong> ' . $safePaidAt . '</p>'
                . '</div>'
                . '<p>This confirmation is sent directly by .63. Stripe may send a separate payment receipt in live mode.</p>'
            );
            $mail->AltBody =
                "Hello {$this->recipientName},\n\n"
                . "Your payment was completed successfully. Your order is now being processed.\n\n"
                . "Order: #{$orderId}\n"
                . "Total paid: {$currency} {$total}\n"
                . 'Payment date: ' . ($paidAt !== '' ? $paidAt : date('Y-m-d H:i:s')) . "\n\n"
                . 'This confirmation is sent directly by .63. Stripe may send a separate payment receipt in live mode.';

            return $this->deliver($mail);
        } catch (Throwable $error) {
            error_log('EmailsSender::sendEmailPaymentConfirmation error -> ' . $error->getMessage());
            return false;
        }
    }

    /**
     * Legacy alias used by the original supplier registration controller.
     */
    public function sendEmailRegistration(): bool
    {
        return $this->sendEmailSupplierRegistration();
    }

    private function sendRegistrationNotice(string $subject, string $message, string $loginUrl): bool
    {
        try {
            if (!filter_var($this->recipientEmail, FILTER_VALIDATE_EMAIL)) {
                throw new InvalidArgumentException('A valid registration recipient is required.');
            }

            $mail = $this->createMailer();
            $mail->addAddress($this->recipientEmail, $this->recipientName);

            $name = $this->escape($this->recipientName !== '' ? $this->recipientName : 'there');
            $email = $this->escape($this->recipientEmail);
            $safeMessage = $this->escape($message);
            $safeLoginUrl = $this->escape($loginUrl);

            $mail->Subject = $subject;
            $mail->isHTML(true);
            $mail->Body = $this->htmlTemplate(
                '.63 account notification',
                $subject,
                '<p>Hello ' . $name . ',</p>'
                . '<p>' . $safeMessage . '</p>'
                . '<div style="margin:20px 0;padding:16px;background:#f8fafc;border:1px solid #dce3ea;border-radius:10px;">'
                . '<p><strong>Account email:</strong> ' . $email . '</p>'
                . '</div>'
                . '<p><a href="' . $safeLoginUrl . '" style="display:inline-block;padding:12px 18px;background:#1f3551;color:#fff;text-decoration:none;border-radius:999px;">Sign in to .63</a></p>'
                . '<p style="font-size:13px;color:#6b7280;">If you did not create this account, reply to this email so our team can help.</p>'
            );
            $mail->AltBody =
                "Hello {$this->recipientName},\n\n"
                . $message . "\n\n"
                . "Account email: {$this->recipientEmail}\n"
                . "Sign in: {$loginUrl}\n\n"
                . 'If you did not create this account, reply to this email so our team can help.';

            return $this->deliver($mail);
        } catch (Throwable $error) {
            error_log('EmailsSender::sendRegistrationNotice error -> ' . $error->getMessage());
            return false;
        }
    }

    protected function createMailer(): PHPMailer
    {
        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $mail->SMTPDebug = 0;
        $mail->Host = $this->environmentValue('DOT63_SMTP_HOST', 'smtp.hostinger.com');
        $mail->Port = (int)$this->environmentValue('DOT63_SMTP_PORT', '587');
        $mail->SMTPAuth = true;
        $mail->Username = $this->environmentValue('DOT63_SMTP_USERNAME', 'admin@lanyardsforyou.com');
        $mail->Password = $this->environmentValue('DOT63_SMTP_PASSWORD', '32skiff32!CI');
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Timeout = max(5, (int)$this->environmentValue('DOT63_SMTP_TIMEOUT', '15'));
        $mail->CharSet = 'UTF-8';
        $mail->Encoding = 'base64';
        $mail->Hostname = $this->environmentValue('DOT63_SMTP_HELO_HOST', 'lanyardsforyou.com');

        $fromEmail = $this->environmentValue('DOT63_SMTP_FROM_EMAIL', $mail->Username);
        $fromName = $this->environmentValue('DOT63_SMTP_FROM_NAME', '.63');
        $mail->setFrom($fromEmail, $fromName);
        $mail->Sender = $fromEmail;
        $mail->addReplyTo($fromEmail, $fromName);

        return $mail;
    }

    protected function deliver(PHPMailer $mail): bool
    {
        $sent = $mail->send();
        $recipients = array_map(
            static fn(array $recipient): string => (string)$recipient[0],
            $mail->getToAddresses()
        );

        if ($sent) {
            error_log(sprintf(
                'Dot63 email accepted by SMTP [%s] to %s; message_id=%s',
                $this->notificationType,
                implode(', ', $recipients),
                $mail->getLastMessageID()
            ));
        } else {
            error_log(sprintf(
                'Dot63 email rejected [%s] to %s; error=%s',
                $this->notificationType,
                implode(', ', $recipients),
                $mail->ErrorInfo
            ));
        }

        return $sent;
    }

    private function addUniqueAddress(PHPMailer $mail, array &$seen, string $email, string $name): void
    {
        $email = strtolower(trim($email));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || isset($seen[$email])) {
            return;
        }

        $seen[$email] = true;
        $mail->addAddress($email, $name);
    }

    private function htmlTemplate(string $eyebrow, string $title, string $content): string
    {
        $safeEyebrow = $this->escape($eyebrow);
        $safeTitle = $this->escape($title);
        $year = date('Y');

        return '<!doctype html><html lang="en-GB"><body style="margin:0;padding:0;background:#f4f6f8;">'
            . '<div style="width:100%;padding:28px 0;background:#f4f6f8;">'
            . '<div style="max-width:680px;margin:0 auto;background:#fff;border:1px solid #dce3ea;border-radius:16px;overflow:hidden;">'
            . '<div style="padding:24px 28px;background:#1f3551;color:#fff;">'
            . '<p style="margin:0 0 8px;font:12px Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;">' . $safeEyebrow . '</p>'
            . '<h1 style="margin:0;font:700 24px Arial,sans-serif;">' . $safeTitle . '</h1>'
            . '</div><div style="padding:28px;font:15px/1.7 Arial,sans-serif;color:#1f2933;">'
            . $content
            . '<div style="margin-top:24px;padding-top:18px;border-top:1px solid #dce3ea;font-size:13px;color:#6b7280;">'
            . 'This is an automatic notification from .63.</div>'
            . '</div></div><p style="text-align:center;font:11px Arial,sans-serif;color:#6b7280;">© ' . $year . ' Lanyards For You.</p>'
            . '</div></body></html>';
    }

    private function escape(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    private function environmentValue(string $name, string $fallback): string
    {
        $value = getenv($name);
        return $value !== false && trim((string)$value) !== '' ? trim((string)$value) : $fallback;
    }
}
