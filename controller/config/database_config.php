<?php

declare(strict_types=1);

final class DatabaseConfig
{
    public static function load(string $directory, bool $allowLocalDefaults = false): array
    {
        $config = [];
        $file = $directory . '/database.local.php';
        $hasLocalFile = is_file($file);
        if ($hasLocalFile) {
            if (!defined('DOT63_DATABASE_CONFIG_ALLOWED')) {
                define('DOT63_DATABASE_CONFIG_ALLOWED', true);
            }
            $config = require $file;
            if (!is_array($config)) {
                throw new RuntimeException('Dot63 database.local.php must return a configuration array.');
            }
        }

        $hasEnvironment = false;
        foreach (['host', 'name', 'user', 'password', 'port'] as $key) {
            $name = 'DOT63_DB_' . strtoupper($key);
            $value = self::environmentValue($name);
            if ($value !== false) {
                $config[$key] = $value;
                $hasEnvironment = true;
            }
        }

        if (!$hasLocalFile && !$hasEnvironment && $allowLocalDefaults) {
            $config = ['host' => '127.0.0.1', 'name' => 'dot63', 'user' => 'root', 'password' => ''];
        }

        $missing = [];
        foreach (['host', 'name', 'user', 'password'] as $key) {
            if (!isset($config[$key]) || !is_string($config[$key])
                || ($key !== 'password' && trim($config[$key]) === '')) {
                $missing[] = 'DOT63_DB_' . strtoupper($key);
                continue;
            }
            if ($key !== 'password') {
                $config[$key] = trim($config[$key]);
            }
        }
        if ($missing) {
            // Log variable names only; never include credential values.
            throw new RuntimeException(
                'Dot63 database credentials are incomplete. Missing or invalid: ' . implode(', ', $missing)
                . '. Configure the PHP environment or controller/config/database.local.php.'
            );
        }

        // Do not let configuration values inject additional PDO DSN parameters.
        foreach (['host', 'name'] as $key) {
            if (preg_match('/[;\x00\r\n]/', $config[$key])) {
                throw new RuntimeException('Dot63 database host or name contains invalid characters.');
            }
        }
        $config['port'] = filter_var($config['port'] ?? 3306, FILTER_VALIDATE_INT, [
            'options' => ['min_range' => 1, 'max_range' => 65535],
        ]);
        if ($config['port'] === false) {
            throw new RuntimeException('Dot63 database port must be between 1 and 65535.');
        }

        return $config;
    }

    private static function environmentValue(string $name)
    {
        // Apache may prefix variables after internal redirects. Never read HTTP_ headers.
        foreach ([$name, 'REDIRECT_' . $name, 'REDIRECT_REDIRECT_' . $name] as $candidate) {
            $value = getenv($candidate);
            if ($value === false) {
                $value = $_ENV[$candidate] ?? $_SERVER[$candidate] ?? false;
            }
            if ($value !== false) {
                return $value;
            }
        }
        return false;
    }
}
