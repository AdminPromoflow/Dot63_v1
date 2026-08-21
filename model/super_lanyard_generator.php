<?php

/**
 * Generador exclusivo de productos cartesianos para el producto fuente
 * "Super Lanyard".
 *
 * No modifica el producto fuente. Cada combinación se identifica con un SKU
 * determinista SLY-* y guarda sus seis valores como variaciones tipadas.
 */
class SuperLanyardGenerator
{
    private const PRODUCT_SKU_PREFIX = 'SLY-';
    private const VARIATION_SKU_PREFIX = 'SLV-';
    private const PREVIEW_LIMIT = 50;
    private const MAX_COMBINATIONS = 50000;

    private const AXES = [
        'theme' => [
            'label' => 'Theme',
            'aliases' => ['theme'],
        ],
        'material' => [
            'label' => 'Material',
            'aliases' => ['material'],
        ],
        'width' => [
            'label' => 'Width',
            'aliases' => ['width'],
        ],
        'print_technique' => [
            'label' => 'Print Technique',
            'aliases' => ['printtechnique'],
        ],
        'printed_sides' => [
            'label' => 'Printed Sides',
            'aliases' => ['printedsides'],
        ],
        'colour' => [
            'label' => 'Colour',
            'aliases' => ['colour', 'color'],
        ],
    ];

    /** @var Database */
    private $connection;

    public function __construct($connection)
    {
        $this->connection = $connection;
    }

    public function preview(string $supplierEmail): array
    {
        try {
            $context = $this->buildContext($supplierEmail);
            if (!$context['success']) {
                return $context;
            }

            $existing = $this->getExistingCombinationMaps(
                $context['pdo'],
                (int)$context['source']['supplier_id']
            );

            $preview = [];
            $existingCount = 0;
            foreach ($context['combinations'] as $combination) {
                $row = $this->describeCombination((int)$context['source']['product_id'], $combination);
                $row['exists'] = $this->combinationExists($row, $existing);

                if ($row['exists']) {
                    $existingCount++;
                }

                if (count($preview) < self::PREVIEW_LIMIT) {
                    $preview[] = $row;
                }
            }

            $total = count($context['combinations']);

            return [
                'success' => true,
                'source' => [
                    'product_id' => (int)$context['source']['product_id'],
                    'sku' => $context['source']['SKU'],
                    'name' => $context['source']['name'],
                ],
                'dimensions' => $context['dimensions'],
                'total_combinations' => $total,
                'existing_combinations' => $existingCount,
                'pending_combinations' => $total - $existingCount,
                'preview' => $preview,
                'preview_limit' => self::PREVIEW_LIMIT,
                'preview_truncated' => $total > self::PREVIEW_LIMIT,
                'definition_signature' => $context['signature'],
            ];
        } catch (Throwable $error) {
            error_log('Super Lanyard preview error: ' . $error->getMessage());
            return ['success' => false, 'error' => 'The Super Lanyard preview could not be built.'];
        }
    }

    public function generate(
        string $supplierEmail,
        string $expectedSignature,
        int $expectedSourceProductId
    ): array {
        $pdo = null;
        $lockName = null;
        $lockAcquired = false;

        try {
            $context = $this->buildContext($supplierEmail);
            if (!$context['success']) {
                return $context;
            }

            if ((int)$context['source']['product_id'] !== $expectedSourceProductId
                || !hash_equals((string)$context['signature'], $expectedSignature)) {
                return [
                    'success' => false,
                    'error' => 'The active Super Lanyard variations changed. Create a new preview before generating products.',
                    'preview_required' => true,
                ];
            }

            $pdo = $context['pdo'];
            $supplierId = (int)$context['source']['supplier_id'];
            $lockName = 'super_lanyard_' . substr(hash('sha256', $supplierId . ':' . $expectedSourceProductId), 0, 40);

            $lockStatement = $pdo->prepare('SELECT GET_LOCK(:lock_name, 10)');
            $lockStatement->execute([':lock_name' => $lockName]);
            $lockAcquired = (int)$lockStatement->fetchColumn() === 1;

            if (!$lockAcquired) {
                return [
                    'success' => false,
                    'error' => 'Another Super Lanyard generation is already running. Try again in a moment.',
                ];
            }

            // Volver a consultar dentro del lock para que dos solicitudes no creen
            // la misma combinación al mismo tiempo.
            $existing = $this->getExistingCombinationMaps($pdo, $supplierId);

            $insertProduct = $pdo->prepare("
                INSERT INTO products (
                    SKU,
                    name,
                    description,
                    descriptive_tagline,
                    status,
                    date_status,
                    is_approved,
                    supplier_id,
                    group_id
                ) VALUES (
                    :sku,
                    :name,
                    :description,
                    :descriptive_tagline,
                    :status,
                    :date_status,
                    :is_approved,
                    :supplier_id,
                    :group_id
                )
            ");

            $insertVariation = $pdo->prepare("
                INSERT INTO variations (
                    name,
                    SKU,
                    parent_id,
                    product_id,
                    type_id
                ) VALUES (
                    :name,
                    :sku,
                    :parent_id,
                    :product_id,
                    :type_id
                )
            ");

            $created = 0;
            $skipped = 0;
            $errorCount = 0;
            $errors = [];
            $createdProducts = [];

            foreach ($context['combinations'] as $combination) {
                $row = $this->describeCombination($expectedSourceProductId, $combination);

                if ($this->combinationExists($row, $existing)) {
                    $skipped++;
                    continue;
                }

                try {
                    if (mb_strlen($row['title']) > 150) {
                        throw new RuntimeException('The generated title exceeds the 150-character product limit.');
                    }

                    $pdo->beginTransaction();

                    $insertProduct->execute([
                        ':sku' => $row['sku'],
                        ':name' => $row['title'],
                        ':description' => $context['source']['description'],
                        ':descriptive_tagline' => $context['source']['descriptive_tagline'],
                        ':status' => $context['source']['status'],
                        ':date_status' => $context['source']['date_status'],
                        ':is_approved' => (int)$context['source']['is_approved'],
                        ':supplier_id' => $supplierId,
                        ':group_id' => $context['source']['group_id'] !== null
                            ? (int)$context['source']['group_id']
                            : null,
                    ]);

                    $productId = (int)$pdo->lastInsertId();
                    $skuHash = substr($row['sku'], strlen(self::PRODUCT_SKU_PREFIX));

                    $insertVariation->execute([
                        ':name' => 'Default',
                        ':sku' => self::VARIATION_SKU_PREFIX . $skuHash . '-D',
                        ':parent_id' => null,
                        ':product_id' => $productId,
                        ':type_id' => null,
                    ]);
                    $parentVariationId = (int)$pdo->lastInsertId();

                    $position = 1;
                    foreach ($context['dimensions'] as $dimension) {
                        $axisKey = $dimension['key'];
                        $insertVariation->execute([
                            ':name' => $combination[$axisKey],
                            ':sku' => sprintf(
                                '%s%s-%02d',
                                self::VARIATION_SKU_PREFIX,
                                $skuHash,
                                $position
                            ),
                            ':parent_id' => $parentVariationId,
                            ':product_id' => $productId,
                            ':type_id' => (int)$dimension['type_id'],
                        ]);
                        $parentVariationId = (int)$pdo->lastInsertId();
                        $position++;
                    }

                    $pdo->commit();

                    $created++;
                    $existing['skus'][$this->normaliseValue($row['sku'])] = true;
                    $existing['titles'][$this->normaliseValue($row['title'])] = true;

                    if (count($createdProducts) < self::PREVIEW_LIMIT) {
                        $createdProducts[] = [
                            'product_id' => $productId,
                            'sku' => $row['sku'],
                            'title' => $row['title'],
                        ];
                    }
                } catch (Throwable $error) {
                    if ($pdo->inTransaction()) {
                        $pdo->rollBack();
                    }

                    $errorCount++;
                    error_log('Super Lanyard combination error (' . $row['sku'] . '): ' . $error->getMessage());
                    if (count($errors) < self::PREVIEW_LIMIT) {
                        $errors[] = [
                            'sku' => $row['sku'],
                            'title' => $row['title'],
                            'error' => $error instanceof RuntimeException
                                ? $error->getMessage()
                                : 'Database error while creating this combination.',
                        ];
                    }
                }
            }

            return [
                'success' => $errorCount === 0,
                'completed' => true,
                'total_combinations' => count($context['combinations']),
                'created' => $created,
                'skipped' => $skipped,
                'errors_count' => $errorCount,
                'errors' => $errors,
                'created_products' => $createdProducts,
                'message' => sprintf(
                    'Super Lanyard generation finished: %d created, %d skipped and %d errors.',
                    $created,
                    $skipped,
                    $errorCount
                ),
            ];
        } catch (Throwable $error) {
            if ($pdo instanceof PDO && $pdo->inTransaction()) {
                $pdo->rollBack();
            }
            error_log('Super Lanyard generation error: ' . $error->getMessage());
            return ['success' => false, 'error' => 'The Super Lanyard products could not be generated.'];
        } finally {
            if ($lockAcquired && $pdo instanceof PDO && $lockName !== null) {
                try {
                    $release = $pdo->prepare('SELECT RELEASE_LOCK(:lock_name)');
                    $release->execute([':lock_name' => $lockName]);
                } catch (Throwable $error) {
                    error_log('Super Lanyard lock release error: ' . $error->getMessage());
                }
            }
        }
    }

    private function buildContext(string $supplierEmail): array
    {
        $supplierEmail = strtolower(trim($supplierEmail));
        if ($supplierEmail === '') {
            return ['success' => false, 'error' => 'Supplier email is required.'];
        }

        $pdo = $this->connection->getConnection();
        if (!$pdo instanceof PDO) {
            return ['success' => false, 'error' => 'Database connection unavailable.'];
        }

        $sourceStatement = $pdo->prepare("
            SELECT
                p.product_id,
                p.SKU,
                p.name,
                p.description,
                p.descriptive_tagline,
                p.status,
                p.date_status,
                p.is_approved,
                p.supplier_id,
                p.group_id
            FROM products p
            INNER JOIN suppliers s ON s.supplier_id = p.supplier_id
            WHERE LOWER(TRIM(s.email)) = :email
              AND LOWER(REPLACE(TRIM(COALESCE(p.name, '')), ' ', '')) = 'superlanyard'
              AND COALESCE(p.SKU, '') NOT LIKE :generated_prefix
            ORDER BY p.product_id ASC
            LIMIT 2
        ");
        $sourceStatement->execute([
            ':email' => $supplierEmail,
            ':generated_prefix' => self::PRODUCT_SKU_PREFIX . '%',
        ]);
        $sources = $sourceStatement->fetchAll(PDO::FETCH_ASSOC);

        if (!$sources) {
            return [
                'success' => false,
                'error' => 'A source product named "Super Lanyard" was not found for this supplier.',
            ];
        }

        if (count($sources) > 1) {
            return [
                'success' => false,
                'error' => 'More than one source product named "Super Lanyard" exists. Keep only one source before generating combinations.',
            ];
        }

        $source = $sources[0];
        $optionsStatement = $pdo->prepare("
            SELECT
                v.type_id,
                tv.type_name,
                v.name AS option_name,
                MIN(v.variation_id) AS first_variation_id
            FROM variations v
            INNER JOIN type_variations tv ON tv.type_id = v.type_id
            WHERE v.product_id = :product_id
              AND v.type_id IS NOT NULL
              AND TRIM(COALESCE(v.name, '')) <> ''
              AND TRIM(COALESCE(tv.type_name, '')) <> ''
            GROUP BY v.type_id, tv.type_name, v.name
            ORDER BY first_variation_id ASC
        ");
        $optionsStatement->execute([':product_id' => (int)$source['product_id']]);
        $optionRows = $optionsStatement->fetchAll(PDO::FETCH_ASSOC);

        $axisRows = [];
        foreach (array_keys(self::AXES) as $axisKey) {
            $axisRows[$axisKey] = [];
        }

        foreach ($optionRows as $row) {
            $axisKey = $this->axisKeyForTypeName((string)$row['type_name']);
            if ($axisKey !== null) {
                $axisRows[$axisKey][] = $row;
            }
        }

        $dimensions = [];
        foreach (self::AXES as $axisKey => $definition) {
            $rows = $axisRows[$axisKey];
            $typeIds = [];
            foreach ($rows as $row) {
                $typeIds[(int)$row['type_id']] = true;
            }

            if (count($typeIds) !== 1) {
                return [
                    'success' => false,
                    'error' => sprintf(
                        'Super Lanyard must have exactly one active "%s" variation type.',
                        $definition['label']
                    ),
                ];
            }

            $options = [];
            $seenOptions = [];
            foreach ($rows as $row) {
                $option = preg_replace('/\s+/u', ' ', trim((string)$row['option_name']));
                $optionKey = $this->normaliseValue($option);
                if ($option === '' || isset($seenOptions[$optionKey])) {
                    continue;
                }
                $seenOptions[$optionKey] = true;
                $options[] = $option;
            }

            if (!$options) {
                return [
                    'success' => false,
                    'error' => sprintf('Super Lanyard has no active options for "%s".', $definition['label']),
                ];
            }

            $dimensions[] = [
                'key' => $axisKey,
                'label' => $definition['label'],
                'type_id' => (int)array_key_first($typeIds),
                'options' => $options,
                'options_count' => count($options),
            ];
        }

        $total = 1;
        foreach ($dimensions as $dimension) {
            $total *= count($dimension['options']);
            if ($total > self::MAX_COMBINATIONS) {
                return [
                    'success' => false,
                    'error' => sprintf(
                        'The active options produce more than %d combinations. Reduce the active Super Lanyard options before continuing.',
                        self::MAX_COMBINATIONS
                    ),
                ];
            }
        }

        $combinations = [[]];
        foreach ($dimensions as $dimension) {
            $expanded = [];
            foreach ($combinations as $combination) {
                foreach ($dimension['options'] as $option) {
                    $next = $combination;
                    $next[$dimension['key']] = $option;
                    $expanded[] = $next;
                }
            }
            $combinations = $expanded;
        }

        $signatureDefinition = [
            'source_product_id' => (int)$source['product_id'],
            'dimensions' => array_map(static function (array $dimension): array {
                return [
                    'key' => $dimension['key'],
                    'type_id' => $dimension['type_id'],
                    'options' => $dimension['options'],
                ];
            }, $dimensions),
        ];

        return [
            'success' => true,
            'pdo' => $pdo,
            'source' => $source,
            'dimensions' => $dimensions,
            'combinations' => $combinations,
            'signature' => hash(
                'sha256',
                json_encode($signatureDefinition, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
            ),
        ];
    }

    private function describeCombination(int $sourceProductId, array $combination): array
    {
        $orderedValues = [];
        foreach (array_keys(self::AXES) as $axisKey) {
            $orderedValues[] = (string)$combination[$axisKey];
        }

        $title = implode(' — ', array_merge(['Super Lanyard'], $orderedValues));
        $fingerprint = hash('sha256', json_encode([
            'source_product_id' => $sourceProductId,
            'values' => array_map([$this, 'normaliseValue'], $orderedValues),
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

        return [
            'sku' => self::PRODUCT_SKU_PREFIX . substr($fingerprint, 0, 40),
            'title' => $title,
            'values' => $combination,
        ];
    }

    private function getExistingCombinationMaps(PDO $pdo, int $supplierId): array
    {
        $statement = $pdo->prepare("
            SELECT SKU, name
            FROM products
            WHERE supplier_id = :supplier_id
              AND (
                  COALESCE(SKU, '') LIKE :sku_prefix
                  OR COALESCE(name, '') LIKE :title_prefix
              )
        ");
        $statement->execute([
            ':supplier_id' => $supplierId,
            ':sku_prefix' => self::PRODUCT_SKU_PREFIX . '%',
            ':title_prefix' => 'Super Lanyard — %',
        ]);

        $maps = ['skus' => [], 'titles' => []];
        foreach ($statement->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $sku = $this->normaliseValue((string)($row['SKU'] ?? ''));
            $title = $this->normaliseValue((string)($row['name'] ?? ''));
            if ($sku !== '') {
                $maps['skus'][$sku] = true;
            }
            if ($title !== '') {
                $maps['titles'][$title] = true;
            }
        }

        return $maps;
    }

    private function combinationExists(array $row, array $existing): bool
    {
        return isset($existing['skus'][$this->normaliseValue($row['sku'])])
            || isset($existing['titles'][$this->normaliseValue($row['title'])]);
    }

    private function axisKeyForTypeName(string $typeName): ?string
    {
        $normalised = $this->normaliseTypeName($typeName);
        foreach (self::AXES as $axisKey => $definition) {
            if (in_array($normalised, $definition['aliases'], true)) {
                return $axisKey;
            }
        }
        return null;
    }

    private function normaliseTypeName(string $value): string
    {
        $value = strtolower(trim($value));
        $ascii = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
        if ($ascii !== false) {
            $value = $ascii;
        }
        return preg_replace('/[^a-z0-9]+/', '', $value);
    }

    private function normaliseValue(string $value): string
    {
        return mb_strtolower(preg_replace('/\s+/u', ' ', trim($value)));
    }
}
