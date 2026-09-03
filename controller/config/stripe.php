<?php

declare(strict_types=1);

final class StripeConfig
{
    public static function publishableKey(): string
    {
        return self::environmentValue(['DOT63_STRIPE_PUBLISHABLE_KEY', 'STRIPE_PUBLISHABLE_KEY']);
    }

    public static function secretKey(): string
    {
        return self::environmentValue(['DOT63_STRIPE_SECRET_KEY', 'STRIPE_SECRET_KEY']);
    }

    public static function webhookSecret(): string
    {
        return self::environmentValue(['DOT63_STRIPE_WEBHOOK_SECRET', 'STRIPE_WEBHOOK_SECRET']);
    }

    public static function isConfigured(): bool
    {
        return preg_match('/^pk_(test|live)_/', self::publishableKey()) === 1
            && preg_match('/^sk_(test|live)_/', self::secretKey()) === 1;
    }

    public static function stripeClient(): \Stripe\StripeClient
    {
        $autoload = __DIR__ . '/../assets/vendor/autoload.php';
        if (!is_file($autoload)) {
            throw new RuntimeException('The Stripe PHP SDK is not installed.');
        }

        require_once $autoload;

        $secretKey = self::secretKey();
        if (preg_match('/^sk_(test|live)_/', $secretKey) !== 1) {
            throw new RuntimeException('The Stripe secret key is not configured.');
        }

        return new \Stripe\StripeClient($secretKey);
    }

    private static function environmentValue(array $names): string
    {
        foreach ($names as $name) {
            $value = getenv($name);
            if ($value !== false && trim((string)$value) !== '') {
                return trim((string)$value);
            }
        }

        return '';
    }
}
