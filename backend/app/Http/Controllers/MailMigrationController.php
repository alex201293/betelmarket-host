<?php

namespace App\Http\Controllers;

use App\Models\MailMigration;
use App\Models\Domain;
use App\Jobs\RunMailMigration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;

class MailMigrationController extends Controller
{
    /**
     * List migrations.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = MailMigration::with('domain');

        if ($user->isClient()) {
            $query->where('user_id', $user->id);
        }

        $migrations = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($migrations);
    }

    /**
     * Create a new mail migration.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'domain_id' => 'required|exists:domains,id',
            'source_host' => 'required|string',
            'source_port' => 'sometimes|integer|min:1|max:65535',
            'source_email' => 'required|email',
            'source_password' => 'required|string',
            'destination_email' => 'required|email',
        ]);

        $migration = MailMigration::create([
            'user_id' => $request->user()->id,
            'domain_id' => $request->domain_id,
            'source_host' => $request->source_host,
            'source_port' => $request->get('source_port', 993),
            'source_email' => $request->source_email,
            'source_password_encrypted' => Crypt::encryptString($request->source_password),
            'destination_email' => $request->destination_email,
            'status' => 'pending',
        ]);

        // Dispatch the migration job
        RunMailMigration::dispatch($migration);

        return response()->json($migration, 201);
    }

    /**
     * Get migration details.
     */
    public function show(MailMigration $mailMigration): JsonResponse
    {
        $mailMigration->load('domain');

        return response()->json($mailMigration);
    }

    /**
     * Retry a failed migration.
     */
    public function retry(MailMigration $mailMigration): JsonResponse
    {
        if ($mailMigration->status !== 'failed') {
            return response()->json(['message' => 'Only failed migrations can be retried.'], 422);
        }

        $mailMigration->update([
            'status' => 'pending',
            'error_log' => null,
            'messages_migrated' => 0,
        ]);

        RunMailMigration::dispatch($mailMigration);

        return response()->json(['message' => 'Migration retry initiated.']);
    }

    /**
     * Cancel a pending migration.
     */
    public function cancel(MailMigration $mailMigration): JsonResponse
    {
        if (!in_array($mailMigration->status, ['pending'])) {
            return response()->json(['message' => 'Only pending migrations can be cancelled.'], 422);
        }

        $mailMigration->update(['status' => 'failed', 'error_log' => 'Cancelled by user.']);

        return response()->json(['message' => 'Migration cancelled.']);
    }
}
