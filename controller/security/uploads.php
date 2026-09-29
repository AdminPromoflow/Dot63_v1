<?php
require_once __DIR__ . '/bootstrap.php';

final class SafeUpload
{
    public const MAX_BYTES = 8 * 1024 * 1024;
    private const IMAGES = ['image/jpeg' => ['jpg', 'jpeg'], 'image/png' => ['png'], 'image/gif' => ['gif'], 'image/webp' => ['webp']];

    public static function inspect(string $path, string $name, string $kind): string
    {
        $size = is_file($path) ? filesize($path) : 0;
        if ($size <= 0 || $size > self::MAX_BYTES) throw new InvalidArgumentException('Files must be between 1 byte and 8 MB.');
        $extension = strtolower(pathinfo($name, PATHINFO_EXTENSION));
        if (preg_match('/\.(?:php\d*|phtml|phar|cgi|pl|sh|html?|svg)(?:\.|$)/i', $name)) {
            throw new InvalidArgumentException('This file type is not allowed.');
        }
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($path);
        if ($kind === 'pdf') {
            if ($extension !== 'pdf' || $mime !== 'application/pdf') throw new InvalidArgumentException('Upload a valid PDF.');
            return 'pdf';
        }
        $allowed = self::IMAGES[$mime] ?? [];
        $image = @getimagesize($path);
        if (!in_array($extension, $allowed, true) || !$image || ($image['mime'] ?? '') !== $mime
            || $image[0] <= 0 || $image[1] <= 0 || $image[0] * $image[1] > 25000000) {
            throw new InvalidArgumentException('Upload a valid JPEG, PNG, GIF or WebP image of at most 25 megapixels.');
        }
        return $allowed[0];
    }

    public static function validate(array $file, string $kind = 'image'): string
    {
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK
            || !is_string($file['tmp_name'] ?? null) || !is_uploaded_file($file['tmp_name'])) {
            throw new InvalidArgumentException('The upload failed. Please choose the file again.');
        }
        return self::inspect($file['tmp_name'], (string)($file['name'] ?? ''), $kind);
    }

    public static function store(array $file, string $kind, string $product, string $variation): string
    {
        $extension = self::validate($file, $kind);
        // Only server-generated names; product ownership is checked by CatalogAccess first.
        $relative = 'controller/uploads/' . hash('sha256', $product) . '/' . hash('sha256', $variation);
        $directory = dirname(__DIR__, 2) . '/' . $relative;
        if (!is_dir($directory) && !mkdir($directory, 0755, true) && !is_dir($directory)) {
            throw new RuntimeException('Unable to create the upload directory.');
        }
        $name = bin2hex(random_bytes(24)) . '.' . $extension;
        if (!move_uploaded_file($file['tmp_name'], $directory . '/' . $name)) {
            throw new RuntimeException('Unable to save the upload.');
        }
        chmod($directory . '/' . $name, 0644);
        return $relative . '/' . $name;
    }
}
