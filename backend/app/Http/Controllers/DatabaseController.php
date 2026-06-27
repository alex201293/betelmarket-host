<?php

namespace App\Http\Controllers;

use App\Models\Database as DatabaseModel;
use App\Models\HostingAccount;
use App\Services\Hestia\HestiaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;

class DatabaseController extends Controller
{
    public function __construct(
        private readonly HestiaService $hestia
    ) {}

    /**
     * List databases.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = DatabaseModel::with('hostingAccount.user');

        if ($user->isClient()) {
            $query->whereHas('hostingAccount', fn($q) => $q->where('user_id', $user->id));
        }

        $databases = $query->where('status', '!=', 'deleted')->get();

        return response()->json($databases);
    }

    /**
     * Create a database.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'hosting_account_id' => 'required|exists:hosting_accounts,id',
            'db_name' => 'required|string|max:32|alpha_dash',
            'db_user' => 'sometimes|string|max:32|alpha_dash',
            'db_password' => 'sometimes|string|min:8',
            'db_type' => 'sometimes|in:mysql,pgsql',
        ]);

        $account = HostingAccount::with('plan')->findOrFail($request->hosting_account_id);

        // Check ownership
        $user = $request->user();
        if ($user->isClient() && $account->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Check plan limits
        $currentDbs = DatabaseModel::where('hosting_account_id', $account->id)
            ->where('status', '!=', 'deleted')
            ->count();

        if ($currentDbs >= $account->plan->max_databases) {
            return response()->json(['message' => 'Database limit reached for this plan.'], 422);
        }

        $hestiaUsername = $account->hestia_username;
        $dbName = $request->db_name;
        $dbUser = $request->get('db_user', $dbName);
        $dbPassword = $request->get('db_password', Str::random(16));
        $dbType = $request->get('db_type', 'mysql');
        $maxConnections = $account->plan->max_db_connections;

        // Create DB in HestiaCP
        $result = $this->hestia->execute('v-add-database', [
            $hestiaUsername,
            $dbName,
            $dbUser,
            $dbPassword,
            $dbType,
        ]);

        if (!$result['success']) {
            return response()->json(['message' => 'Failed to create database.', 'error' => $result['response'] ?? ''], 422);
        }

        // Apply connection limit via SQL
        $fullDbUser = "{$hestiaUsername}_{$dbUser}";
        $this->applyConnectionLimit($fullDbUser, $maxConnections, $dbType);

        $database = DatabaseModel::create([
            'hosting_account_id' => $account->id,
            'db_name' => "{$hestiaUsername}_{$dbName}",
            'db_user' => $fullDbUser,
            'db_password_encrypted' => Crypt::encryptString($dbPassword),
            'db_type' => $dbType,
            'max_connections' => $maxConnections,
            'status' => 'active',
        ]);

        return response()->json([
            'database' => $database,
            'credentials' => [
                'host' => '127.0.0.1',
                'port' => $dbType === 'mysql' ? 3306 : 5432,
                'database' => "{$hestiaUsername}_{$dbName}",
                'username' => $fullDbUser,
                'password' => $dbPassword,
                'max_connections' => $maxConnections,
            ],
            'message' => "Database created with {$maxConnections} max connections.",
        ], 201);
    }

    /**
     * Delete a database.
     */
    public function destroy(DatabaseModel $database): JsonResponse
    {
        $account = $database->hostingAccount;
        $hestiaUsername = $account->hestia_username;

        // Extract short names from full names
        $shortDbName = str_replace("{$hestiaUsername}_", '', $database->db_name);

        $this->hestia->execute('v-delete-database', [
            $hestiaUsername,
            $shortDbName,
        ]);

        $database->update(['status' => 'deleted']);

        return response()->json(['message' => 'Database deleted.']);
    }

    /**
     * Change connection limit for a database.
     */
    public function updateConnections(Request $request, DatabaseModel $database): JsonResponse
    {
        $request->validate([
            'max_connections' => 'required|integer|min:1|max:100',
        ]);

        $this->applyConnectionLimit($database->db_user, $request->max_connections, $database->db_type);
        $database->update(['max_connections' => $request->max_connections]);

        return response()->json([
            'message' => "Connection limit updated to {$request->max_connections}.",
        ]);
    }

    /**
     * Get database size/stats.
     */
    public function stats(DatabaseModel $database): JsonResponse
    {
        // Query actual size from MySQL/PostgreSQL
        $size = $this->getDatabaseSize($database);

        $database->update(['size_mb' => $size]);

        return response()->json([
            'db_name' => $database->db_name,
            'size_mb' => $size,
            'max_connections' => $database->max_connections,
            'status' => $database->status,
        ]);
    }

    /**
     * Apply MAX_USER_CONNECTIONS limit via SQL.
     */
    private function applyConnectionLimit(string $dbUser, int $maxConnections, string $dbType): void
    {
        if ($dbType === 'mysql') {
            $sql = "ALTER USER '{$dbUser}'@'localhost' WITH MAX_USER_CONNECTIONS {$maxConnections};";
            exec("mysql -e " . escapeshellarg($sql) . " 2>&1");
        }
        // PostgreSQL uses connection_limit
        if ($dbType === 'pgsql') {
            $sql = "ALTER ROLE \"{$dbUser}\" CONNECTION LIMIT {$maxConnections};";
            exec("sudo -u postgres psql -c " . escapeshellarg($sql) . " 2>&1");
        }
    }

    /**
     * Get database size in MB.
     */
    private function getDatabaseSize(DatabaseModel $database): int
    {
        if ($database->db_type === 'mysql') {
            $output = [];
            $sql = "SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 0) AS size FROM information_schema.TABLES WHERE table_schema = '{$database->db_name}';";
            exec("mysql -N -e " . escapeshellarg($sql) . " 2>&1", $output);
            return (int) ($output[0] ?? 0);
        }

        if ($database->db_type === 'pgsql') {
            $output = [];
            $sql = "SELECT pg_database_size('{$database->db_name}') / 1024 / 1024;";
            exec("sudo -u postgres psql -t -c " . escapeshellarg($sql) . " 2>&1", $output);
            return (int) trim($output[0] ?? '0');
        }

        return 0;
    }
}
