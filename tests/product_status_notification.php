<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
// Isolated regression test: no MySQL changes and no real email delivery.
class StatusMemoryPDO extends PDO {
    public function prepare($query, $options = []) {
        return parent::prepare(str_replace(' FOR UPDATE', '', $query), $options);
    }
}
class Database {
    private PDO $pdo;
    public function __construct(PDO $pdo) { $this->pdo = $pdo; }
    public function getConnection(): PDO { return $this->pdo; }
}
require_once __DIR__ . '/../model/product_status.php';
function ensureStatus($condition, $message) { if (!$condition) throw new RuntimeException($message); }
$pdo = new StatusMemoryPDO('sqlite::memory:', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$pdo->sqliteCreateFunction('NOW', static fn() => '2026-11-09 12:00:00');
$pdo->exec("CREATE TABLE suppliers (supplier_id INTEGER, email TEXT, company_name TEXT, contact_name TEXT);
CREATE TABLE categories (category_id INTEGER, name TEXT);
CREATE TABLE `groups` (group_id INTEGER, category_id INTEGER, name TEXT);
CREATE TABLE products (product_id INTEGER PRIMARY KEY, supplier_id INTEGER, group_id INTEGER, SKU TEXT, name TEXT, description TEXT, descriptive_tagline TEXT, status INTEGER, pending_status INTEGER, status_request_version INTEGER, status_requested_at TEXT, is_approved INTEGER);
INSERT INTO suppliers VALUES (1,'supplier@example.test','Supplier','Test');
INSERT INTO products VALUES (1,1,NULL,'TEST','Original','Description','',0,NULL,0,NULL,0)");
$workflow = new ProductStatus(new Database($pdo));
foreach ([false, 'throw', true] as $index => $outcome) {
    $result = $workflow->saveDetails('TEST','supplier@example.test',[
        'status'=>1, 'status_request_version'=>$index, 'name'=>'Saved '.$index,
    ], static function ($notice) use ($pdo,$outcome) {
        ensureStatus(!$pdo->inTransaction(), 'Mail must run after commit.');
        if ($outcome === 'throw') throw new RuntimeException('Simulated SMTP failure');
        return $outcome;
    });
    ensureStatus($result['success'] === true, 'Save must succeed.');
    ensureStatus($result['notification_sent'] === ($outcome === true), 'Mail outcome must be accurate.');
    $saved = $workflow->getOwned('TEST','supplier@example.test');
    ensureStatus($saved['name']==='Saved '.$index && $saved['pending_status']===1 && $saved['status']===0, 'Keep details and pending review without approving.');
    ensureStatus($saved['status_request_version']===$index+1, 'Retain review version.');
}
$unchanged=$workflow->saveDetails('TEST','supplier@example.test',['status'=>1,'status_request_version'=>3],static function(){throw new LogicException('Unchanged request must not resend.');});
ensureStatus($unchanged['notification_sent']===null,'No notification for unchanged request.');
try {
    $workflow->saveDetails('TEST','supplier@example.test',['status'=>1,'status_request_version'=>0,'name'=>'Stale edit'],static fn()=>true);
    throw new LogicException('Stale edit accepted.');
} catch (RuntimeException $error) { ensureStatus($error->getCode()===409, 'Version conflict must still be rejected.'); }
ensureStatus($workflow->getOwned('TEST','supplier@example.test')['name']==='Saved 2','Rejected edit must not overwrite.');
echo "Approval notification regression passed: failed/throwing mail, successful mail, persisted review, no auto-approval, stale edits.\n";
