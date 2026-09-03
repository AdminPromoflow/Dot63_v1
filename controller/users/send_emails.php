<?php

require_once __DIR__ . '/../emails/send_emails.php';

/**
 * Backwards-compatible name for older supplier registration code.
 */
class EmailSender extends EmailsSender
{
    public function sendEmailProductToApproval(): bool
    {
        return $this->sendEmailProductApprovalNotice();
    }
}
