<?php

namespace App\Http\Controllers;

use App\Models\App;
use App\Models\Domain;
use App\Jobs\DeployApp;
use App\Services\Hestia\AppManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AppController extends Controller
{
    public function __construct(
        private readonly AppManager $appManager
    ) {}

    /**
     * List apps.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = App::with('domain');

        if ($user->isClient()) {
            $query->where('user_id', $user->id);
        }

        $apps = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($apps);
    }

    /**
     * Create a new app.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'domain_id' => 'required|exists:domains,id',
            'name' => 'required|string|max:100|alpha_dash',
            'runtime' => 'required|string|in:' . implode(',', array_keys(App::runtimes())),
            'entry_point' => 'sometimes|string|max:255',
            'git_repo' => 'sometimes|url',
            'git_branch' => 'sometimes|string|max:100',
            'start_command' => 'sometimes|string|max:500',
            'build_command' => 'sometimes|string|max:500',
            'install_command' => 'sometimes|string|max:500',
            'env_vars' => 'sometimes|array',
        ]);

        $port = AppManager::assignPort();

        $app = App::create([
            'domain_id' => $request->domain_id,
            'user_id' => $request->user()->id,
            'name' => $request->name,
            'runtime' => $request->runtime,
            'entry_point' => $request->get('entry_point', 'index.js'),
            'port' => $port,
            'git_repo' => $request->git_repo,
            'git_branch' => $request->get('git_branch', 'main'),
            'start_command' => $request->start_command,
            'build_command' => $request->build_command,
            'install_command' => $request->install_command,
            'env_vars' => $request->get('env_vars', ['PORT' => (string) $port]),
            'status' => 'pending',
        ]);

        // Auto-deploy if git repo is provided
        if ($app->git_repo) {
            DeployApp::dispatch($app);
        }

        return response()->json($app, 201);
    }

    /**
     * Get app details.
     */
    public function show(App $app): JsonResponse
    {
        $app->load('domain');
        return response()->json($app);
    }

    /**
     * Update app config.
     */
    public function update(Request $request, App $app): JsonResponse
    {
        $request->validate([
            'entry_point' => 'sometimes|string|max:255',
            'git_repo' => 'sometimes|url',
            'git_branch' => 'sometimes|string|max:100',
            'start_command' => 'sometimes|string|max:500',
            'build_command' => 'sometimes|string|max:500',
            'install_command' => 'sometimes|string|max:500',
            'env_vars' => 'sometimes|array',
        ]);

        $app->update($request->only([
            'entry_point', 'git_repo', 'git_branch',
            'start_command', 'build_command', 'install_command', 'env_vars',
        ]));

        return response()->json($app);
    }

    /**
     * Deploy/redeploy the app.
     */
    public function deploy(App $app): JsonResponse
    {
        $app->update(['status' => 'deploying']);
        DeployApp::dispatch($app);

        return response()->json(['message' => 'Deploy initiated.']);
    }

    /**
     * Start the app.
     */
    public function start(App $app): JsonResponse
    {
        $result = $this->appManager->start($app);
        return response()->json($result);
    }

    /**
     * Stop the app.
     */
    public function stop(App $app): JsonResponse
    {
        $result = $this->appManager->stop($app);
        return response()->json($result);
    }

    /**
     * Restart the app.
     */
    public function restart(App $app): JsonResponse
    {
        $result = $this->appManager->restart($app);
        return response()->json($result);
    }

    /**
     * Get app logs.
     */
    public function logs(App $app, Request $request): JsonResponse
    {
        $lines = $request->get('lines', 100);
        $result = $this->appManager->getLogs($app, $lines);
        return response()->json($result);
    }

    /**
     * Delete app.
     */
    public function destroy(App $app): JsonResponse
    {
        $this->appManager->delete($app);
        $app->delete();

        return response()->json(['message' => 'App deleted.']);
    }

    /**
     * Get available runtimes.
     */
    public function runtimes(): JsonResponse
    {
        return response()->json(App::runtimes());
    }
}
