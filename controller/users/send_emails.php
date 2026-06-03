<?php
// Include PHPMailer and its dependencies
require '../assets/lib/send-email/PHPMailer/src/Exception.php';
require '../assets/lib/send-email/PHPMailer/src/PHPMailer.php';
require '../assets/lib/send-email/PHPMailer/src/SMTP.php';

// Import PHPMailer classes
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class EmailSender {
    private $message;
    private $recipientEmail;
    private $recipientName;
    private $recipientPassword;
    private $recipientTableOrder;

    // Setter for recipient email
    public function setRecipientEmail($recipientEmail) {
        $this->recipientEmail = $recipientEmail;

    }

    // Setter for recipient name
    public function setRecipientName($recipientName) {
        $this->recipientName = $recipientName;
    }

    // Setter for recipient password (optional)
    public function setRecipientPassword($recipientPassword) {
        $this->recipientPassword = $recipientPassword;
    }

    // Method to send a registration email
    public function sendEmailProductToApproval() {
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
        $mail->setFrom('admin@lanyardsforyou.com', 'Lanyards For You');
        $mail->addReplyTo('admin@lanyardsforyou.com', 'Lanyards For You');

        // PromoFlow administrator
        $mail->addAddress($this->recipientEmail, $this->recipientName);

        // ===== Subject =====
        $mail->Subject = 'Product submitted for approval';

        // ===== Safe escaped data =====
        $adminName   = htmlspecialchars((string)$this->recipientName, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $adminEmail  = htmlspecialchars((string)$this->recipientEmail, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

        $supplierName  = htmlspecialchars((string)($this->supplierName ?? 'A supplier'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $supplierEmail = htmlspecialchars((string)($this->supplierEmail ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

        $productName = htmlspecialchars((string)($this->productName ?? 'Product pending review'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $productSku  = htmlspecialchars((string)($this->productSku ?? 'N/A'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

        $approvalUrl = htmlspecialchars((string)($this->approvalUrl ?? 'https://lanyardsforyou.com/PromoFlow'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

        $year = date('Y');

        // ===== HTML body =====
        $mail->isHTML(true);
        $mail->Body = <<<HTML
    <!doctype html>
    <html lang="en-GB">
      <body style="margin:0; padding:0; background:#f4f6f8;">
        <!-- Hidden preheader -->
        <div style="display:none; max-height:0; overflow:hidden; line-height:1px; color:#f4f6f8; opacity:0;">
          A supplier has submitted a product for approval in PromoFlow.
        </div>

        <div style="width:100%; background:#f4f6f8; padding:28px 0;">
          <div style="max-width:680px; margin:0 auto; background:#ffffff; border:1px solid #dce3ea; border-radius:16px; overflow:hidden; box-sizing:border-box;">

            <div style="background:#1f3551; padding:24px 28px;">
              <p style="margin:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:1.4; color:#d8e2ec; letter-spacing:.08em; text-transform:uppercase;">
                PromoFlow Approval
              </p>

              <h1 style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:24px; line-height:1.3; color:#ffffff;">
                New product submitted for approval
              </h1>
            </div>

            <div style="padding:28px;">
              <p style="margin:0 0 16px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#1f2933;">
                Hello {$adminName},
              </p>

              <p style="margin:0 0 18px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.7; color:#1f2933;">
                A product has been submitted by a supplier and is now waiting for your review in PromoFlow.
              </p>

              <div style="margin:22px 0; padding:18px; background:#f8fafc; border:1px solid #dce3ea; border-radius:12px;">
                <p style="margin:0 0 12px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; color:#1f2933;">
                  <strong style="display:inline-block; width:130px; color:#1f3551;">Product:</strong>
                  <span>{$productName}</span>
                </p>

                <p style="margin:0 0 12px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; color:#1f2933;">
                  <strong style="display:inline-block; width:130px; color:#1f3551;">SKU:</strong>
                  <span>{$productSku}</span>
                </p>

                <p style="margin:0 0 12px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; color:#1f2933;">
                  <strong style="display:inline-block; width:130px; color:#1f3551;">Supplier:</strong>
                  <span>{$supplierName}</span>
                </p>

                <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:14px; color:#1f2933;">
                  <strong style="display:inline-block; width:130px; color:#1f3551;">Supplier email:</strong>
                  <span>{$supplierEmail}</span>
                </p>
              </div>

              <p style="margin:0 0 22px 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:1.7; color:#4b5563;">
                Please review the product details, images, variations, items and prices before approving it for the platform.
              </p>

              <div style="margin:24px 0;">
                <a href="{$approvalUrl}" style="display:inline-block; padding:12px 20px; background:#1f3551; color:#ffffff; font-family:Arial, Helvetica, sans-serif; font-size:14px; font-weight:bold; text-decoration:none; border-radius:999px;">
                  Review product in PromoFlow
                </a>
              </div>

              <div style="margin:24px 0 0 0; padding-top:18px; border-top:1px solid #dce3ea;">
                <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:1.6; color:#6b7280;">
                  This is an automatic notification from the .63 supplier approval workflow.
                </p>
              </div>

              <div style="margin:18px 0 0 0;">
                <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:1.6; color:#1f2933;">
                  Kind regards,<br>
                  Lanyards For You Team
                </p>
              </div>
            </div>
          </div>

          <div style="max-width:680px; margin:12px auto 0 auto; text-align:center;">
            <p style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:11px; color:#6b7280;">
              © {$year} Lanyards For You. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
    HTML;

        // ===== Plain text fallback =====
        $mail->AltBody =
          "Hello {$adminName},\n\n" .
          "A product has been submitted by a supplier and is now waiting for your review in PromoFlow.\n\n" .
          "Product: {$productName}\n" .
          "SKU: {$productSku}\n" .
          "Supplier: {$supplierName}\n" .
          "Supplier email: {$supplierEmail}\n\n" .
          "Please review the product details, images, variations, items and prices before approving it for the platform.\n\n" .
          "Review product in PromoFlow: {$approvalUrl}\n\n" .
          "Kind regards,\n" .
          ".63 Team\n\n" .
          "© {$year} Lanyards For You. All rights reserved.";

        // ===== Send =====
        return $mail->send();

      } catch (Exception $e) {
        error_log('EmailSender::sendEmailProductApproval error -> ' . $e->getMessage());
        return false;
      }
    }
  }

}
