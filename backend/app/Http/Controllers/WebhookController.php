<?php

namespace App\Http\Controllers;

use App\Models\App;
use App\Jobs\DeployApp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    /**
     * Handle GitHub/GitLab webhook for auto-deploy.
     * URL: /api/webhooks/deploy/{app_id}/{secret}
     */
    public function deploy(Request $request, int $appId, string $secret): JsonResponse
    {
        $app = App::find($appId);

        if (!$app || $app->deploy_secret !== $secret) {
            return response()->json(['message' => 'Invalid webhook.'], 403);
        }

        // Verify it's a push to the configured branch
        $payload = $request->all();
        $ref = $payload['ref'] ?? '';
        $branch = str_replace('refs/heads/', '', $ref);

        if ($branch && $branch !== $app->git_branch) {
            return response()->json(['message' => "Ignored push to {$branch}. Watching: {$app->git_branch}"]);
        }

        // Get commit info
        $commitMessage = $payload['head_commit']['message'] ?? $payload['commits'][0]['message'] ?? 'Auto deploy';
        $commitAuthor = $payload['head_commit']['author']['name'] ?? $payload['user_username'] ?? 'unknown';

        Log::info("Webhook deploy triggered for {$app->name} by {$commitAuthor}: {$commitMessage}");

        $app->update(['status' => 'deploying']);
        DeployApp::dispatch($app);

        return response()->json([
            'message' => 'Deploy initiated.',
            'app' => $app->name,
            'branch' => $app->git_branch,
            'triggered_by' => $commitAuthor,
        ]);
    }
}
