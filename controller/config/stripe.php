<?php

declare(strict_types=1);

final class StripeConfig
{
    private static ?array $localConfig = null;

    public static function publishableKey(): string
    {
        return self::configuredValue(
            ['DOT63_STRIPE_PUBLISHABLE_KEY', 'STRIPE_PUBLISHABLE_KEY'],
            'publishable_key'
        );
    }

    public static function secretKey(): string
    {
        return self::configuredValue(
            ['DOT63_STRIPE_SECRET_KEY', 'STRIPE_SECRET_KEY'],
            'secret_key'
        );
    }

    public static function webhookSecret(): string
    {
        return self::configuredValue(
            ['DOT63_STRIPE_WEBHOOK_SECRET', 'STRIPE_WEBHOOK_SECRET'],
            'webhook_secret'
        );
    }

    public static function isConfigured(): bool
    {
        $publishableMatches = [];
        $secretMatches = [];
        $publishableValid = preg_match('/^pk_(test|live)_/', self::publishableKey(), $publishableMatches) === 1;
        $secretValid = preg_match('/^sk_(test|live)_/', self::secretKey(), $secretMatches) === 1;
        $webhookValid = preg_match('/^whsec_/', self::webhookSecret()) === 1;

        return $publishableValid
            && $secretValid
            && $webhookValid
            && ($publishableMatches[1] ?? null) === ($secretMatches[1] ?? null);
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

    private static function configuredValue(array $environmentNames, string $fileKey): string
    {
        foreach ($environmentNames as $name) {
            $value = getenv($name);
            if ($value !== false && trim((string)$value) !== '') {
                return trim((string)$value);
            }
        }

        $config = self::localConfig();
        return trim((string)($config[$fileKey] ?? ''));
    }

    private static function localConfig(): array
    {
        if (self::$localConfig !== null) {
            return self::$localConfig;
        }

        $configFile = __DIR__ . '/stripe.local.php';
        if (!is_file($configFile)) {
            self::$localConfig = [];
            return self::$localConfig;
        }

        if (!defined('DOT63_STRIPE_CONFIG_ALLOWED')) {
            define('DOT63_STRIPE_CONFIG_ALLOWED', true);
        }
        $config = require $configFile;
        self::$localConfig = is_array($config) ? $config : [];
        return self::$localConfig;
    }
}
