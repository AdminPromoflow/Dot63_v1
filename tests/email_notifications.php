<?php

declare(strict_types=1);

require_once __DIR__ . '/../controller/emails/send_emails.php';

use PHPMailer\PHPMailer\PHPMailer;

final class RecordingEmailsSender extends EmailsSender
{
    public array $messages = [];

    protected function deliver(PHPMailer $mail): bool
    {
        $this->messages[] = [
            'subject' => $mail->Subject,
            'recipients' => $mail->getToAddresses(),
            'body' => $mail->Body,
            'alt_body' => $mail->AltBody,
            'hostname' => $mail->Hostname,
            'sender' => $mail->Sender,
        ];

        return true;
    }
}

function assertEmailNotification(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

function recipientEmails(array $message): array
{
    return array_map(
        static fn(array $recipient): string => strtolower((string)$recipient[0]),
        $message['recipients']
    );
}

$product = new RecordingEmailsSender();
$product->setRecipientEmail('admin@promoflow.net');
$product->setRecipientName('Admin');
$product->setProductName('Test product');
$product->setProductSku('TEST-001');
$product->setSupplierName('Test supplier');
$product->setSupplierEmail('supplier@example.test');
assertEmailNotification($product->sendEmailProductApprovalNotice(), 'Product notification was not prepared.');
assertEmailNotification(count($product->messages) === 1, 'Product notification was prepared more than once.');
$productRecipients = recipientEmails($product->messages[0]);
assertEmailNotification(in_array('admin@promoflow.net', $productRecipients, true), 'PromoFlow admin recipient is missing.');
assertEmailNotification(in_array('ian@kan-do-it.com', $productRecipients, true), 'Ian recipient is missing.');
assertEmailNotification(in_array('aleinarossui@gmail.com', $productRecipients, true), 'Alexandra recipient is missing.');

$supplier = new RecordingEmailsSender();
$supplier->setRecipientEmail('supplier@example.test');
$supplier->setRecipientName('Supplier Test');
$supplier->setRecipientPassword('NeverEmailThisPassword!');
assertEmailNotification($supplier->sendEmailSupplierRegistration(), 'Supplier registration notification was not prepared.');
assertEmailNotification(
    recipientEmails($supplier->messages[0]) === ['supplier@example.test'],
    'Supplier registration notification has an unexpected recipient.'
);
assertEmailNotification(
    strpos($supplier->messages[0]['body'] . $supplier->messages[0]['alt_body'], 'NeverEmailThisPassword!') === false,
    'Supplier password leaked into the registration notification.'
);

$customer = new RecordingEmailsSender();
$customer->setRecipientEmail('customer@example.test');
$customer->setRecipientName('Customer Test');
assertEmailNotification($customer->sendEmailCustomerRegistration(), 'Customer registration notification was not prepared.');
assertEmailNotification(
    recipientEmails($customer->messages[0]) === ['customer@example.test'],
    'Customer registration notification has an unexpected recipient.'
);
assertEmailNotification(
    $customer->messages[0]['hostname'] === 'lanyardsforyou.com',
    'The public SMTP HELO hostname is not configured.'
);
assertEmailNotification(
    $customer->messages[0]['sender'] === 'admin@lanyardsforyou.com',
    'The SMTP envelope sender is not configured.'
);

$payment = new RecordingEmailsSender();
$payment->setRecipientEmail('customer@example.test');
$payment->setRecipientName('Customer Test');
assertEmailNotification($payment->sendEmailPaymentConfirmation([
    'order_id' => 123,
    'currency' => 'gbp',
    'total_amount' => '42.50',
    'paid_at' => '2026-09-03 17:00:00',
]), 'Payment confirmation notification was not prepared.');
assertEmailNotification(
    recipientEmails($payment->messages[0]) === ['customer@example.test'],
    'Payment confirmation notification has an unexpected recipient.'
);
assertEmailNotification(
    $payment->messages[0]['subject'] === 'Payment received for order #123',
    'Payment confirmation subject is incorrect.'
);
assertEmailNotification(
    strpos($payment->messages[0]['body'], 'GBP 42.50') !== false,
    'Payment confirmation total is missing.'
);

fwrite(STDOUT, "Email notification tests passed.\n");
