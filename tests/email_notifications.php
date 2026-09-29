<?php

declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }


putenv('DOT63_SMTP_PASSWORD=non-secret-test-value');
putenv('DOT63_PUBLIC_URL=https://lanyardsforyou.com');
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

$orderNotice = new RecordingEmailsSender();
$orderNotice->setRecipientEmail(' SUPPLIER@example.test ');
$orderNotice->setRecipientName('Supplier <Test>');
assertEmailNotification($orderNotice->sendEmailOrderNotification([
    'order_id' => 124,
    'currency' => 'gbp',
    'paid_at' => '2026-09-17 12:00:00',
], [[
    'job_id' => 15,
    'order_id' => 124,
    'id_order' => 900,
    'status' => 'ordered',
    'created_at' => '2026-09-17 11:45:00',
    'notes' => "Front: <script>logo</script> & text\nBack: white",
    'product_name' => 'Lanyard <script>test</script>',
    'product_sku' => 'ORDER-TEST',
    'quantity' => 10,
    'price_per_unit' => 6,
    'discount_percentage' => 9,
    'subtotal' => 54.60,
    'pdf_artwork_link' => 'controller/uploads/job-artworks/15/customer artwork.pdf',
    'details' => [[
        'variation_id' => 31, 'name' => 'Blue <lanyard>', 'sku' => 'BLUE-20',
        'image' => 'controller/uploads/blue.jpg', 'price' => '6.00', 'quantity' => '10',
    ], [
        'variation_id' => 32, 'name' => 'Safety clip', 'sku' => 'CLIP',
        'image' => null, 'price' => '0.00', 'quantity' => '10',
    ]],
]]), 'Supplier order notification was not prepared.');
assertEmailNotification(recipientEmails($orderNotice->messages[0]) === ['supplier@example.test'], 'Order notification recipient is incorrect.');
assertEmailNotification($orderNotice->messages[0]['subject'] === 'New order #124', 'Order notification subject is incorrect.');
assertEmailNotification(strpos($orderNotice->messages[0]['body'], '<script>') === false, 'Order notification HTML was not escaped.');
assertEmailNotification(strpos($orderNotice->messages[0]['body'], 'GBP 54.60') !== false, 'Order subtotal is missing.');
assertEmailNotification(strpos($orderNotice->messages[0]['alt_body'], 'Quantity: 10') !== false, 'Plain-text order details are missing.');
$orderMessage = $orderNotice->messages[0];
foreach (['ordered', '2026-09-17 11:45:00', 'GBP 6.00', '9.00%', '900', 'Safety clip', 'Variation #31', 'BLUE-20'] as $value) {
    assertEmailNotification(strpos($orderMessage['body'], $value) !== false && strpos($orderMessage['alt_body'], $value) !== false, 'Missing job information: ' . $value);
}
assertEmailNotification(strpos($orderMessage['body'], 'Front: &lt;script&gt;logo&lt;/script&gt; &amp; text<br') !== false, 'Multiline job notes were not safely rendered.');
assertEmailNotification(strpos($orderMessage['body'], 'Blue &lt;lanyard&gt;') !== false, 'Option name was not escaped.');
assertEmailNotification(strpos($orderMessage['body'], 'href="https://lanyardsforyou.com/controller/uploads/blue.jpg"') !== false, 'Option image link is missing.');
$artworkUrl = 'https://lanyardsforyou.com/controller/uploads/job-artworks/15/customer%20artwork.pdf';
assertEmailNotification(strpos($orderMessage['body'], 'href="' . $artworkUrl . '" download') !== false, 'Relative artwork path is not a downloadable absolute link.');
assertEmailNotification(strpos($orderMessage['alt_body'], 'Download artwork PDF: ' . $artworkUrl) !== false, 'Plain-text artwork download link is missing.');

$customerOrder = new RecordingEmailsSender();
$customerOrder->setRecipientEmail('CUSTOMER@example.test');
$customerOrder->setRecipientName('Customer <Test>');
assertEmailNotification($customerOrder->sendEmailOrderNotification(['order_id' => 124, 'currency' => 'GBP'], [[
    'job_id' => 15, 'quantity' => 10, 'price_per_unit' => 6, 'subtotal' => 60,
    'pdf_artwork_link' => 'controller/uploads/job-artworks/15/customer artwork.pdf',
], ['job_id' => 16, 'pdf_artwork_link' => null]], true), 'Customer order copy was not prepared.');
$customerMessage = $customerOrder->messages[0];
assertEmailNotification(recipientEmails($customerMessage) === ['customer@example.test'], 'Customer order copy has an unexpected recipient.');
assertEmailNotification($customerMessage['subject'] === 'Your order #124', 'Customer order subject is incorrect.');
assertEmailNotification(strpos($customerMessage['body'], 'Customer &lt;Test&gt;') !== false, 'Customer greeting was not escaped.');
foreach (['Thank you for your order.', 'Quantity: 10', 'Download artwork PDF: ' . $artworkUrl, 'Artwork PDF: Not supplied'] as $value) {
    assertEmailNotification(strpos($customerMessage['alt_body'], $value) !== false, 'Customer order copy is missing: ' . $value);
}
assertEmailNotification(strpos($customerMessage['body'], 'href="' . $artworkUrl . '" download') !== false, 'Customer HTML artwork download link is missing.');

// Paths from old orders, missing PDFs, and hostile values must not break email links.
$renderArtwork = static function (?string $path): array {
    $sender = new RecordingEmailsSender();
    $sender->setRecipientEmail('supplier@example.test');
    assertEmailNotification($sender->sendEmailOrderNotification(['order_id' => 125], [[
        'job_id' => 16, 'pdf_artwork_link' => $path,
    ]]), 'Artwork email could not be prepared.');
    return $sender->messages[0];
};
$absoluteUrl = 'https://files.example.test/artwork.pdf?download=1&token=test';
$absoluteMessage = $renderArtwork($absoluteUrl);
assertEmailNotification(strpos($absoluteMessage['body'], 'href="https://files.example.test/artwork.pdf?download=1&amp;token=test"') !== false, 'Absolute artwork URL was not preserved and escaped.');
assertEmailNotification(strpos($absoluteMessage['alt_body'], $absoluteUrl) !== false, 'Absolute plain-text URL was altered.');
foreach ([null, ''] as $missing) {
    $message = $renderArtwork($missing);
    assertEmailNotification(strpos($message['body'], 'Download artwork PDF') === false && strpos($message['alt_body'], 'Artwork PDF: Not supplied') !== false, 'Missing PDF generated a broken download link.');
}
foreach (['javascript:alert(1)', 'data:text/html,test', '//untrusted.example/a.pdf', '../private.pdf', 'controller/%2e%2e/private.pdf', "controller/uploads/a\n.pdf", 'controller/uploads/a%00.pdf', 'controller\\uploads\\a.pdf'] as $unsafe) {
    $message = $renderArtwork($unsafe);
    assertEmailNotification(strpos($message['body'], 'Download artwork PDF') === false && strpos($message['alt_body'], 'Artwork PDF: Unavailable') !== false, 'Unsafe artwork link was rendered: ' . $unsafe);
}
putenv('DOT63_PUBLIC_URL=https://shop.example.test/dot63/');
$subdirectoryMessage = $renderArtwork('/controller/uploads/job-artworks/16/artwork.pdf');
assertEmailNotification(strpos($subdirectoryMessage['alt_body'], 'https://shop.example.test/dot63/controller/uploads/job-artworks/16/artwork.pdf') !== false, 'Configured site subdirectory was lost.');
putenv('DOT63_PUBLIC_URL');
$defaultOriginMessage = $renderArtwork('controller/uploads/job-artworks/16/artwork.pdf');
assertEmailNotification(strpos($defaultOriginMessage['alt_body'], 'https://lanyardsforyou.com/controller/uploads/job-artworks/16/artwork.pdf') !== false, 'Default public origin is incorrect.');

$statusNotice = new RecordingEmailsSender();
$statusNotice->setProductName('Status test');
$statusNotice->setProductSku('STATUS-TEST');
$statusNotice->setProductStatusChange('Published', 'Draft');
assertEmailNotification($statusNotice->sendEmailProductApprovalNotice(), 'Status approval notice was not prepared.');
assertEmailNotification($statusNotice->messages[0]['subject'] === 'Product status change awaiting approval', 'Incorrect approval subject.');
assertEmailNotification(strpos($statusNotice->messages[0]['body'], 'Current status:</strong> Published') !== false, 'Current status missing from approval email.');
assertEmailNotification(strpos($statusNotice->messages[0]['alt_body'], 'Requested status: Draft') !== false, 'Requested status missing from approval email.');

fwrite(STDOUT, "Email notification tests passed.\n");
