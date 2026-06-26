<?php
// Include PHPMailer and its dependencies
require '../assets/lib/send-email/PHPMailer/src/Exception.php';
require '../assets/lib/send-email/PHPMailer/src/PHPMailer.php';
require '../assets/lib/send-email/PHPMailer/src/SMTP.php';

// Import PHPMailer classes
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;


class EmailsSender {
    private $message;
    private $recipientEmail;
    private $recipientName;
    private $recipientPassword;
    private $recipientTableOrder;

    private $supplierName;
    private $supplierEmail;

    private $productName;
    private $productSku;

    private $approvalUrl;

    // Setter for recipient email
    public function setRecipientEmail($recipientEmail) {
        $this->recipientEmail = $recipientEmail;
    }

    // Setter for recipient password
    public function setRecipientPassword($recipientPassword) {
        $this->recipientPassword = $recipientPassword;
    }

    // Setter for supplier name
    public function setSupplierName($supplierName) {
        $this->supplierName = $supplierName;
    }

    // Setter for supplier email
    public function setSupplierEmail($supplierEmail) {
        $this->supplierEmail = $supplierEmail;
    }

    // Setter for product name
    public function setProductName($productName) {
        $this->productName = $productName;
    }

    // Setter for product SKU
    public function setProductSku($productSku) {
        $this->productSku = $productSku;
    }

    // Setter for approval URL
    public function setApprovalUrl($approvalUrl) {
        $this->approvalUrl = $approvalUrl;
    }

    // Setter for recipient name
    public function setRecipientName($recipientName) {
        $this->recipientName = $recipientName;
    }

    // Method to send a registration email
    public function sendEmailProductApprovalNotice() {
        try {
            $mail = new PHPMailer(true);

            // ===== SMTP (Hostinger) =====
            $mail->isSMTP();
            $mail->SMTPDebug = 0;
            $mail->Host       = 'smtp.hostinger.com';
            $mail->Port       = 587; // STARTTLS
            $mail->SMTPAuth   = true;
            $mail->Username   = 'admin@lanyardsforyou.com';
            $mail->Password   = '32skiff32!CI';
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;

            $mail->CharSet    = 'UTF-8';
            $mail->Encoding   = 'base64';

            // ===== Sender and recipient =====
            $mail->setFrom('admin@lanyardsforyou.com', 'Ian Southworth');
            $mail->addReplyTo('admin@lanyardsforyou.com', 'Ian Southworth');
            $mail->addAddress('admin@promoflow.net', 'Alexandra Rozo');
            $mail->addAddress('ian@kan-do-it.com', 'Alexandra Rozo');

            $mail->addAddress('aleinarossui@gmail.com', 'Alexandra Rozo');

            // ===== Safe escaped data =====
            $name          = htmlspecialchars((string)$this->recipientName, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $productName   = htmlspecialchars((string)$this->productName, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $productSku    = htmlspecialchars((string)$this->productSku, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $supplierName  = htmlspecialchars((string)$this->supplierName, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $supplierEmail = htmlspecialchars((string)$this->supplierEmail, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $year          = date('Y');

            // ===== Subject =====
            $mail->Subject = 'Product sent for approval';

            // ===== HTML body =====
            $mail->isHTML(true);
            $mail->Body = <<<HTML
    <!doctype html>
    <html lang="en-GB">
      <body style="margin:0; padding:0; background:#ffffff;">
        <div style="display:none; max-height:0; overflow:hidden; line-height:1px; color:#ffffff; opacity:0;">
          A product has been sent for approval. Please review it in PromoFlow.
        </div>

        <div style="width:100%; background:#ffffff;">
          <div style="max-width:640px; margin:0 auto; padding:24px; border:1px solid #000000; box-sizing:border-box;">

            <div style="margin:0 0 8px 0;">
              <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:1.4; color:#000000;">
                .63
              </p>
            </div>

            <div style="margin:0 0 16px 0;">
              <h1 style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:22px; line-height:1.3; color:#000000;">
                Product sent for approval
              </h1>
            </div>

            <div style="margin:0 0 12px 0;">
              <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.6; color:#000000;">
                Hello {$name},
              </p>
            </div>

            <div style="margin:0 0 16px 0;">
              <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.6; color:#000000;">
                The product <strong>{$productName}</strong> has been sent for approval.
              </p>
            </div>

            <div style="margin:16px 0; padding:12px 0; border-top:1px solid #000000; border-bottom:1px solid #000000;">
              <p style="margin:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; color:#000000;">
                <strong style="display:inline-block; width:130px;">Product:</strong>
                <span>{$productName}</span>
              </p>

              <p style="margin:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; color:#000000;">
                <strong style="display:inline-block; width:130px;">SKU:</strong>
                <span>{$productSku}</span>
              </p>

              <p style="margin:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; color:#000000;">
                <strong style="display:inline-block; width:130px;">Supplier:</strong>
                <span>{$supplierName}</span>
              </p>

              <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:14px; color:#000000;">
                <strong style="display:inline-block; width:130px;">Supplier email:</strong>
                <span>{$supplierEmail}</span>
              </p>
            </div>

            <div style="margin:0 0 16px 0;">
              <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.6; color:#000000;">
                Please review this product in PromoFlow and approve it or send a message to the supplier if changes are needed.
              </p>
            </div>

            <div style="margin:16px 0 0 0;">
              <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:13px; color:#000000;">
                Kind regards,<br>
                .63 For You Team
              </p>
            </div>
          </div>

          <div style="max-width:640px; margin:8px auto 0 auto; text-align:center;">
            <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:11px; color:#000000;">
              © {$year} Lanyards For You. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
    HTML;

            // ===== Plain text fallback =====
            $mail->AltBody =
                "Hello {$name},\n\n" .
                "The product {$productName} has been sent for approval.\n\n" .
                "Product: {$productName}\n" .
                "SKU: {$productSku}\n" .
                "Supplier: {$supplierName}\n" .
                "Supplier email: {$supplierEmail}\n\n" .
                "Please review this product in PromoFlow and approve it or send a message to the supplier if changes are needed.\n\n" .
                "Kind regards,\n" .
                ".63 For You Team\n" .
                "© {$year} Lanyards For You";

            // ===== Send =====
            return $mail->send();

        } catch (Exception $e) {
            error_log('EmailsSender::sendEmailProductApprovalNotice error -> ' . $e->getMessage());
            return false;
        }
    }

}
