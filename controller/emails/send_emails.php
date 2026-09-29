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
    private $currentProductStatus = '';
    private $requestedProductStatus = '';

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

    public function setProductStatusChange(string $current, string $requested): void
    {
        $this->currentProductStatus = $current;
        $this->requestedProductStatus = $requested;
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

            $statusChange = $this->requestedProductStatus !== '';
            $mail->Subject = $statusChange ? 'Product status change awaiting approval' : 'Product sent for approval';
            $mail->isHTML(true);
            $mail->Body = $this->htmlTemplate(
                'PromoFlow approval',
                $mail->Subject,
                '<p>A supplier has submitted a product and it is waiting for review in PromoFlow.</p>'
                . '<div style="margin:20px 0;padding:16px;background:#f8fafc;border:1px solid #dce3ea;border-radius:10px;">'
                . '<p><strong>Product:</strong> ' . $productName . '</p>'
                . '<p><strong>SKU:</strong> ' . $productSku . '</p>'
                . ($statusChange ? '<p><strong>Current status:</strong> ' . $this->escape($this->currentProductStatus) . '</p><p><strong>Requested status:</strong> ' . $this->escape($this->requestedProductStatus) . '</p>' : '')
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
                . ($statusChange ? "Current status: {$this->currentProductStatus}\nRequested status: {$this->requestedProductStatus}\n" : '')
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

    public function sendEmailOrderNotification(array $order, array $jobs): bool
    {
        try {
            $this->notificationType = 'supplier_order_notification';
            if (!filter_var($this->recipientEmail, FILTER_VALIDATE_EMAIL)) {
                throw new InvalidArgumentException('A valid order notification recipient is required.');
            }
            $orderId = (int)($order['order_id'] ?? 0);
            if ($orderId <= 0) {
                throw new InvalidArgumentException('A valid order ID is required.');
            }
            $currency = preg_replace('/[^A-Z]/', '', strtoupper((string)($order['currency'] ?? 'GBP'))) ?: 'GBP';
            $rows = '';
            $lines = [];
            $subtotal = 0.0;
            foreach ($jobs as $job) {
                $subtotal += (float)($job['subtotal'] ?? 0);
                $content = $this->orderJobContent($job, $orderId, $currency);
                $rows .= $content['html'];
                $lines[] = $content['text'];
            }
            $paidAt = trim((string)($order['paid_at'] ?? ''));
            $total = $currency . ' ' . number_format($subtotal, 2, '.', ',');
            $mail = $this->createMailer();
            $mail->addAddress(strtolower(trim($this->recipientEmail)), $this->recipientName);
            $mail->Subject = 'New order #' . $orderId;
            $mail->isHTML(true);
            $mail->Body = $this->htmlTemplate(
                '.63 order notification',
                'New order #' . $orderId,
                '<p>Hello ' . $this->escape($this->recipientName !== '' ? $this->recipientName : 'there') . ',</p>'
                . '<p>Payment has been confirmed. The following jobs are ready to process.</p>'
                . ($paidAt !== '' ? '<p><strong>Confirmed:</strong> ' . $this->escape($paidAt) . '</p>' : '')
                . $rows
                . '<p><strong>Included jobs subtotal:</strong> ' . $this->escape($total) . '</p>'
            );
            $mail->AltBody = "New order #{$orderId}\n\nPayment has been confirmed. These jobs are ready to process.\n"
                . ($paidAt !== '' ? "Confirmed: {$paidAt}\n" : '') . "\n"
                . implode("\n\n", $lines) . "\n\nIncluded jobs subtotal: {$total}";
            return $this->deliver($mail);
        } catch (Throwable $error) {
            error_log('EmailsSender::sendEmailOrderNotification error -> ' . $error->getMessage());
            return false;
        }
    }

    private function orderJobContent(array $job, int $orderId, string $currency): array
    {
        $jobId = (int)($job['job_id'] ?? 0);
        $name = trim((string)($job['product_name'] ?? '')) ?: 'Job #' . $jobId;
        $sku = trim((string)($job['product_sku'] ?? ''));
        $money = static fn($amount): string => $currency . ' ' . number_format((float)$amount, 2, '.', ',');
        $fields = [
            'Order' => '#' . (int)($job['order_id'] ?? $orderId),
            'Status' => trim((string)($job['status'] ?? '')) ?: 'Not recorded',
            'Created at' => trim((string)($job['created_at'] ?? '')) ?: 'Not recorded',
            'Quantity' => (string)(int)($job['quantity'] ?? 0),
            'Unit price' => $money($job['price_per_unit'] ?? 0),
        ];
        if (isset($job['id_order'])) {
            $fields['Legacy order reference'] = (string)$job['id_order'];
        }
        if (isset($job['discount_percentage'])) {
            $fields['Discount'] = number_format((float)$job['discount_percentage'], 2, '.', ',') . '%';
        }
        $fields['Subtotal'] = $money($job['subtotal'] ?? 0);
        $fields['Notes'] = trim((string)($job['notes'] ?? '')) ?: 'None';

        $html = '<div style="margin:20px 0;padding:16px;border:1px solid #dce3ea;border-radius:10px;overflow-wrap:anywhere;">'
            . '<h2 style="margin:0 0 8px;font-size:18px;">' . $this->escape($name) . '</h2>'
            . '<p style="margin:0 0 12px;">' . $this->escape('Job #' . $jobId . ($sku !== '' ? ' · ' . $sku : '')) . '</p>'
            . '<table role="presentation" style="width:100%;border-collapse:collapse;text-align:left;">';
        $lines = ["Job #{$jobId}: {$name}" . ($sku !== '' ? " ({$sku})" : '')];
        foreach ($fields as $label => $value) {
            $html .= '<tr><th style="padding:4px 12px 4px 0;vertical-align:top;text-align:left;">' . $this->escape($label)
                . '</th><td style="padding:4px 0;vertical-align:top;word-break:break-word;">' . nl2br($this->escape($value)) . '</td></tr>';
            $lines[] = $label . ': ' . $value;
        }
        $html .= '</table><p><strong>Selected options</strong></p>';
        $lines[] = 'Selected options:';
        $details = $job['details'] ?? [];
        if (!$details) {
            $html .= '<p>No options recorded.</p>';
            $lines[] = 'No options recorded.';
        }
        foreach ($details as $detail) {
            $variationId = (int)($detail['variation_id'] ?? 0);
            $optionName = trim((string)($detail['name'] ?? '')) ?: 'Variation #' . $variationId;
            $optionSku = trim((string)($detail['sku'] ?? ''));
            $price = isset($detail['price']) && is_numeric($detail['price']) ? $money($detail['price']) : 'Not recorded';
            $quantity = trim((string)($detail['quantity'] ?? ''));
            $description = $optionName . ' — Variation #' . $variationId . ($optionSku !== '' ? ' · ' . $optionSku : '')
                . ' — Unit price: ' . $price . ' — Quantity: ' . ($quantity !== '' ? $quantity : 'Not recorded');
            $html .= '<p style="margin:8px 0;">' . $this->escape($description);
            $lines[] = $description;
            $image = trim((string)($detail['image'] ?? ''));
            if ($image !== '') {
                $imageUrl = $this->publicFileUrl($image);
                $html .= '<br>Image: ' . ($imageUrl !== ''
                    ? '<a href="' . $this->escape($imageUrl) . '">View option image</a>'
                    : $this->escape($image));
                $lines[] = 'Image: ' . ($imageUrl !== '' ? $imageUrl : $image);
            }
            $html .= '</p>';
        }

        $artwork = trim((string)($job['pdf_artwork_link'] ?? ''));
        $artworkUrl = $this->publicFileUrl($artwork);
        if ($artworkUrl !== '') {
            $html .= '<p style="margin:18px 0 8px;"><a href="' . $this->escape($artworkUrl)
                . '" download style="display:inline-block;padding:12px 18px;background:#1f3551;color:#fff;text-decoration:none;border-radius:6px;">Download artwork PDF</a></p>'
                . '<p style="margin:0;font-size:12px;word-break:break-all;"><a href="' . $this->escape($artworkUrl) . '">'
                . $this->escape($artworkUrl) . '</a></p>';
            $lines[] = 'Download artwork PDF: ' . $artworkUrl;
        } else {
            $message = $artwork === '' ? 'Not supplied' : 'Unavailable';
            $html .= '<p><strong>Artwork PDF:</strong> ' . $message . '</p>';
            $lines[] = 'Artwork PDF: ' . $message;
        }
        return ['html' => $html . '</div>', 'text' => implode("\n", $lines)];
    }

    private function publicFileUrl(string $path): string
    {
        $path = trim($path);
        if ($path === '' || preg_match('/[\x00-\x1f\x7f\\\\]/', $path)) {
            return '';
        }
        if (preg_match('#^https?://#i', $path)) {
            return filter_var($path, FILTER_VALIDATE_URL) && !isset(parse_url($path)['user']) ? $path : '';
        }
        if (preg_match('#^(?:[a-z][a-z0-9+.-]*:|//)#i', $path) || strpbrk($path, '?#') !== false) {
            return '';
        }
        $segments = array_map('rawurldecode', explode('/', ltrim($path, '/')));
        foreach ($segments as $segment) {
            if ($segment === '.' || $segment === '..' || preg_match('/[\x00-\x1f\x7f\\\\\/]/', $segment)) {
                return '';
            }
        }
        // Email links must use a trusted public origin, never the webhook Host header.
        $baseUrl = rtrim($this->environmentValue('DOT63_PUBLIC_URL', 'https://lanyardsforyou.com'), '/');
        $parts = parse_url($baseUrl);
        if (!filter_var($baseUrl, FILTER_VALIDATE_URL) || !in_array(strtolower($parts['scheme'] ?? ''), ['http', 'https'], true)
            || isset($parts['user']) || isset($parts['query']) || isset($parts['fragment'])) {
            throw new RuntimeException('DOT63_PUBLIC_URL must be an absolute HTTP(S) site URL.');
        }
        return $baseUrl . '/' . implode('/', array_map('rawurlencode', $segments));
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
        $mail->Password = $this->environmentValue('DOT63_SMTP_PASSWORD', '');
        if ($mail->Password === '') {
            throw new RuntimeException('DOT63_SMTP_PASSWORD must be configured before sending email.');
        }
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
