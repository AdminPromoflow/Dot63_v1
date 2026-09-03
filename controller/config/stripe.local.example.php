<?php

declare(strict_types=1);

if (!defined('DOT63_STRIPE_CONFIG_ALLOWED')) {
    http_response_code(404);
    exit;
}

return [
    'publishable_key' => 'pk_test_replace_me',
    'secret_key' => 'sk_test_replace_me',
    'webhook_secret' => 'whsec_replace_me',
];
