<?php

namespace App\Http\Controllers;

use App\Models\Backup;
use App\Models\HostingAccount;
use App\Jobs\CreateBackup;
use App\Jobs\RestoreBackup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BackupController extends Controller
{
    /**
     * List backups.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Backup::with('hostingAccount');

        if ($user->isClient()) {
            $query->whereHas('hostingAccount', fn($q) => $q->where('user_id', $user->id));
        }

        $backups = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($backups);
    }

    /**
     * Create a backup (async).
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'hosting_account_id' => 'required|exists:hosting_accounts,id',
        ]);

        $account = HostingAccount::findOrFail($request->hosting_account_id);

        $backup = Backup::create([
            'hosting_account_id' => $account->id,
            'status' => 'pending',
        ]);

        // Dispatch async backup job
        CreateBackup::dispatch($backup);

        return response()->json($backup, 201);
    }

    /**
     * Restore a backup (async).
     */
    public function restore(Backup $backup): JsonResponse
    {
        if (! $backup->isCompleted()) {
            return response()->json(['message' => 'Backup is not in a restorable state.'], 422);
        }

        RestoreBackup::dispatch($backup);

        return response()->json(['message' => 'Backup restoration initiated.']);
    }
}
