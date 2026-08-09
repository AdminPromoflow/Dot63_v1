<?php

class CatalogBrowser
{
    public function handleRequest(): void
    {
        header('Content-Type: application/json; charset=utf-8');

        $input = file_get_contents('php://input');
        $data = json_decode($input, true);

        if (!is_array($data)) {
            $this->respond(['success' => false, 'error' => 'Invalid JSON payload'], 400);
            return;
        }

        switch ($data['action'] ?? null) {
            case 'get_dashboard_categories':
                $this->getCategories();
                break;

            case 'get_dashboard_groups':
                $this->getGroups($data);
                break;

            case 'get_dashboard_products':
                $this->getProducts($data);
                break;

            default:
                $this->respond(['success' => false, 'error' => 'Unsupported action'], 400);
                break;
        }
    }

    private function getCategories(): void
    {
        $categories = new Categories(new Database());
        $this->respond($categories->getAllForDashboard());
    }

    private function getGroups(array $data): void
    {
        $categoryId = filter_var($data['category_id'] ?? null, FILTER_VALIDATE_INT, [
            'options' => ['min_range' => 1]
        ]);

        if ($categoryId === false) {
            $this->respond(['success' => false, 'error' => 'Valid category ID required'], 422);
            return;
        }

        $connection = new Database();
        $category = new Categories($connection);
        $category->setId($categoryId);
        $categoryResult = $category->getByIdForDashboard();

        if (!$categoryResult['success']) {
            $this->respond($categoryResult, $categoryResult['error'] === 'Category not found' ? 404 : 500);
            return;
        }

        $groups = new Groups($connection);
        $groups->setCategoryId($categoryId);
        $groupsResult = $groups->getByCategoryForDashboard();

        if (!$groupsResult['success']) {
            $this->respond($groupsResult, 500);
            return;
        }

        $this->respond([
            'success' => true,
            'category' => $categoryResult['data'],
            'data' => $groupsResult['data']
        ]);
    }

    private function getProducts(array $data): void
    {
        $groupId = filter_var($data['group_id'] ?? null, FILTER_VALIDATE_INT, [
            'options' => ['min_range' => 1]
        ]);

        if ($groupId === false) {
            $this->respond(['success' => false, 'error' => 'Valid group ID required'], 422);
            return;
        }

        $connection = new Database();
        $group = new Groups($connection);
        $group->setGroupId($groupId);
        $groupResult = $group->getByIdForDashboard();

        if (!$groupResult['success']) {
            $this->respond($groupResult, $groupResult['error'] === 'Group not found' ? 404 : 500);
            return;
        }

        $products = new Products($connection);
        $products->setGroupId($groupId);
        $productsResult = $products->getByGroupForDashboard();

        if (!$productsResult['success']) {
            $this->respond($productsResult, 500);
            return;
        }

        $this->respond([
            'success' => true,
            'group' => $groupResult['data'],
            'data' => $productsResult['data']
        ]);
    }

    private function respond(array $payload, int $status = 200): void
    {
        http_response_code($status);
        echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    }
}

include_once '../../controller/config/database.php';
include_once '../../model/categories.php';
include_once '../../model/groups.php';
include_once '../../model/products.php';

$catalogBrowser = new CatalogBrowser();
$catalogBrowser->handleRequest();
