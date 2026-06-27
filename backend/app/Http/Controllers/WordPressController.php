<?php

namespace App\Http\Controllers;

use App\Models\Domain;
use App\Jobs\InstallWordPress;
use App\Services\Hestia\WordPressManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WordPressController extends Controller
{
    public function __construct(
        private readonly WordPressManager $wpManager
    ) {}

    /**
     * Get WordPress status for a domain.
     */
    public function status(Domain $domain): JsonResponse
    {
        $username = $domain->hostingAccount->hestia_username;
        $info = $this->wpManager->getSiteInfo($username, $domain->domain);

        return response()->json($info);
    }

    /**
     * Install WordPress on a domain.
     */
    public function install(Request $request, Domain $domain): JsonResponse
    {
        $request->validate([
            'site_title' => 'required|string|max:255',
            'admin_user' => 'required|string|max:60',
            'admin_password' => 'required|string|min:8',
            'admin_email' => 'required|email',
            'locale' => 'sometimes|string|max:10',
        ]);

        // Dispatch async installation
        InstallWordPress::dispatch(
            $domain,
            $request->site_title,
            $request->admin_user,
            $request->admin_password,
            $request->admin_email,
            $request->get('locale', 'en_US')
        );

        return response()->json([
            'message' => 'WordPress installation initiated. This may take a few minutes.',
        ], 202);
    }

    /**
     * Update WordPress core.
     */
    public function updateCore(Domain $domain): JsonResponse
    {
        $username = $domain->hostingAccount->hestia_username;
        $result = $this->wpManager->updateCore($username, $domain->domain);

        return response()->json($result);
    }

    /**
     * Install a plugin.
     */
    public function installPlugin(Request $request, Domain $domain): JsonResponse
    {
        $request->validate([
            'plugin' => 'required|string|max:255',
        ]);

        $username = $domain->hostingAccount->hestia_username;
        $result = $this->wpManager->installPlugin($username, $domain->domain, $request->plugin);

        return response()->json($result);
    }

    /**
     * Deactivate a plugin.
     */
    public function deactivatePlugin(Request $request, Domain $domain): JsonResponse
    {
        $request->validate([
            'plugin' => 'required|string|max:255',
        ]);

        $username = $domain->hostingAccount->hestia_username;
        $result = $this->wpManager->deactivatePlugin($username, $domain->domain, $request->plugin);

        return response()->json($result);
    }

    /**
     * Delete a plugin.
     */
    public function deletePlugin(Request $request, Domain $domain): JsonResponse
    {
        $request->validate([
            'plugin' => 'required|string|max:255',
        ]);

        $username = $domain->hostingAccount->hestia_username;
        $result = $this->wpManager->deletePlugin($username, $domain->domain, $request->plugin);

        return response()->json($result);
    }

    /**
     * Update all plugins.
     */
    public function updatePlugins(Domain $domain): JsonResponse
    {
        $username = $domain->hostingAccount->hestia_username;
        $result = $this->wpManager->updatePlugins($username, $domain->domain);

        return response()->json($result);
    }

    /**
     * Reset admin password.
     */
    public function resetPassword(Request $request, Domain $domain): JsonResponse
    {
        $request->validate([
            'new_password' => 'required|string|min:8',
        ]);

        $username = $domain->hostingAccount->hestia_username;
        $result = $this->wpManager->resetAdminPassword($username, $domain->domain, $request->new_password);

        return response()->json($result);
    }

    /**
     * Toggle maintenance mode.
     */
    public function maintenance(Request $request, Domain $domain): JsonResponse
    {
        $request->validate([
            'enabled' => 'required|boolean',
        ]);

        $username = $domain->hostingAccount->hestia_username;
        $result = $this->wpManager->setMaintenanceMode($username, $domain->domain, $request->enabled);

        return response()->json($result);
    }

    /**
     * Flush cache.
     */
    public function flushCache(Domain $domain): JsonResponse
    {
        $username = $domain->hostingAccount->hestia_username;
        $result = $this->wpManager->flushCache($username, $domain->domain);

        return response()->json($result);
    }
}
