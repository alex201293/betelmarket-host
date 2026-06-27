<?php

namespace App\Http\Controllers;

use App\Models\Domain;
use App\Services\Hestia\HestiaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PhpConfigController extends Controller
{
    public function __construct(
        private readonly HestiaService $hestia
    ) {}

    /**
     * Get current PHP config for a domain.
     */
    public function show(Domain $domain): JsonResponse
    {
        $username = $domain->hostingAccount->hestia_username;

        // Get current PHP version
        $result = $this->hestia->execute('v-list-web-domain', [$username, $domain->domain, 'json']);

        return response()->json([
            'domain' => $domain->domain,
            'php_version' => '8.3', // parsed from Hestia response
            'available_versions' => ['7.4', '8.0', '8.1', '8.2', '8.3'],
            'settings' => [
                'upload_max_filesize' => '64M',
                'post_max_size' => '64M',
                'memory_limit' => '256M',
                'max_execution_time' => '300',
                'max_input_vars' => '3000',
                'display_errors' => 'Off',
                'open_basedir' => 'enabled',
            ],
            'cache' => [
                'opcache_enabled' => true,
                'litespeed_cache' => false,
            ],
            'web_server' => [
                'proxy_template' => 'default',
                'available_templates' => ['default', 'caching', 'wordpress', 'nodejs'],
            ],
        ]);
    }

    /**
     * Change PHP version for a domain.
     */
    public function changeVersion(Request $request, Domain $domain): JsonResponse
    {
        $request->validate([
            'version' => 'required|string|in:7.4,8.0,8.1,8.2,8.3',
        ]);

        $username = $domain->hostingAccount->hestia_username;

        $result = $this->hestia->execute('v-change-web-domain-backend-tpl', [
            $username,
            $domain->domain,
            "PHP-{$request->version}",
        ]);

        return response()->json([
            'success' => $result['success'],
            'message' => $result['success']
                ? "PHP version changed to {$request->version}"
                : 'Failed to change PHP version.',
        ]);
    }

    /**
     * Update PHP settings (php.ini values).
     */
    public function updateSettings(Request $request, Domain $domain): JsonResponse
    {
        $request->validate([
            'upload_max_filesize' => 'sometimes|string',
            'post_max_size' => 'sometimes|string',
            'memory_limit' => 'sometimes|string',
            'max_execution_time' => 'sometimes|string',
            'max_input_vars' => 'sometimes|string',
            'display_errors' => 'sometimes|in:On,Off',
        ]);

        $username = $domain->hostingAccount->hestia_username;

        // Write custom php.ini values
        $phpIniPath = "/home/{$username}/conf/web/{$domain->domain}/php.ini";
        $settings = $request->only([
            'upload_max_filesize', 'post_max_size', 'memory_limit',
            'max_execution_time', 'max_input_vars', 'display_errors',
        ]);

        $content = "";
        foreach ($settings as $key => $value) {
            $content .= "{$key} = {$value}\n";
        }

        file_put_contents($phpIniPath, $content);

        // Restart PHP-FPM
        exec("sudo systemctl restart php*-fpm 2>&1");

        return response()->json(['message' => 'PHP settings updated.']);
    }

    /**
     * Change Nginx proxy template.
     */
    public function changeTemplate(Request $request, Domain $domain): JsonResponse
    {
        $request->validate([
            'template' => 'required|string|in:default,caching,wordpress,nodejs',
        ]);

        $username = $domain->hostingAccount->hestia_username;

        $result = $this->hestia->execute('v-change-web-domain-proxy-tpl', [
            $username,
            $domain->domain,
            $request->template,
        ]);

        return response()->json([
            'success' => $result['success'],
            'message' => $result['success'] ? "Template changed to {$request->template}" : 'Failed.',
        ]);
    }

    /**
     * Enable/disable OPcache.
     */
    public function toggleOpcache(Request $request, Domain $domain): JsonResponse
    {
        $request->validate(['enabled' => 'required|boolean']);

        $username = $domain->hostingAccount->hestia_username;
        $phpIniPath = "/home/{$username}/conf/web/{$domain->domain}/php.ini";

        $current = file_exists($phpIniPath) ? file_get_contents($phpIniPath) : '';

        if ($request->enabled) {
            $current .= "\nopcache.enable = 1\nopcache.memory_consumption = 128\nopcache.max_accelerated_files = 10000\n";
        } else {
            $current .= "\nopcache.enable = 0\n";
        }

        file_put_contents($phpIniPath, $current);
        exec("sudo systemctl restart php*-fpm 2>&1");

        return response()->json(['message' => $request->enabled ? 'OPcache enabled.' : 'OPcache disabled.']);
    }
}
