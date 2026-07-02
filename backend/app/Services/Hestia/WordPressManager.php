<?php

namespace App\Services\Hestia;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class WordPressManager
{
    public function __construct(
        private readonly HestiaService $hestia
    ) {}

    /**
     * Install WordPress on a domain via WP-CLI.
     */
    public function install(
        string $username,
        string $domain,
        string $siteTitle,
        string $adminUser,
        string $adminPassword,
        string $adminEmail,
        string $locale = 'en_US'
    ): array {
        // Step 1: Create database for WordPress
        $dbName = 'wp_' . Str::lower(Str::random(8));
        $dbUser = 'wpu_' . Str::lower(Str::random(6));
        $dbPassword = Str::random(20);

        $dbResult = $this->hestia->execute('v-add-database', [
            $username,
            $dbName,
            $dbUser,
            $dbPassword,
            'mysql',
        ]);

        if (!$dbResult['success']) {
            Log::error("Failed to create DB for WordPress", $dbResult);
            return ['success' => false, 'error' => 'Database creation failed', 'step' => 'database'];
        }

        // Step 2: Download WordPress via WP-CLI
        $docRoot = "/home/{$username}/web/{$domain}/public_html";

        $downloadCmd = "wp --allow-root core download --path={$docRoot} --locale={$locale} 2>&1";
        $downloadOutput = [];
        exec($downloadCmd, $downloadOutput, $downloadCode);

        if ($downloadCode !== 0) {
            return ['success' => false, 'error' => 'WordPress download failed', 'step' => 'download', 'output' => implode("\n", $downloadOutput)];
        }

        // Step 3: Create wp-config.php
        $fullDbName = "{$username}_{$dbName}";
        $fullDbUser = "{$username}_{$dbUser}";

        $configCmd = sprintf(
            "wp --allow-root config create --path=%s --dbname=%s --dbuser=%s --dbpass=%s --dbhost=localhost 2>&1",
            $docRoot,
            escapeshellarg($fullDbName),
            escapeshellarg($fullDbUser),
            escapeshellarg($dbPassword)
        );
        exec($configCmd, $configOutput, $configCode);

        if ($configCode !== 0) {
            return ['success' => false, 'error' => 'wp-config creation failed', 'step' => 'config'];
        }

        // Step 4: Run WordPress install
        $installCmd = sprintf(
            "wp --allow-root core install --path=%s --url=%s --title=%s --admin_user=%s --admin_password=%s --admin_email=%s 2>&1",
            $docRoot,
            escapeshellarg("https://{$domain}"),
            escapeshellarg($siteTitle),
            escapeshellarg($adminUser),
            escapeshellarg($adminPassword),
            escapeshellarg($adminEmail)
        );
        exec($installCmd, $installOutput, $installCode);

        if ($installCode !== 0) {
            return ['success' => false, 'error' => 'WordPress install failed', 'step' => 'install', 'output' => implode("\n", $installOutput)];
        }

        Log::info("WordPress installed on {$domain} for user {$username}");

        return [
            'success' => true,
            'admin_url' => "https://{$domain}/wp-admin",
            'database' => $fullDbName,
        ];
    }

    /**
     * Get WordPress site info.
     */
    public function getSiteInfo(string $username, string $domain): array
    {
        $docRoot = "/home/{$username}/web/{$domain}/public_html";

        // Check if WordPress is installed
        $checkCmd = "wp --allow-root core is-installed --path={$docRoot} 2>&1";
        exec($checkCmd, $checkOutput, $checkCode);

        if ($checkCode !== 0) {
            return ['installed' => false];
        }

        // Get WP version
        $versionCmd = "wp --allow-root core version --path={$docRoot} 2>&1";
        exec($versionCmd, $versionOutput, $versionCode);
        $version = trim($versionOutput[0] ?? '');

        // Get site URL
        $urlCmd = "wp --allow-root option get siteurl --path={$docRoot} 2>&1";
        exec($urlCmd, $urlOutput, $urlCode);
        $siteUrl = trim($urlOutput[0] ?? '');

        // Get plugins list
        $pluginsCmd = "wp --allow-root plugin list --format=json --path={$docRoot} 2>&1";
        exec($pluginsCmd, $pluginsOutput, $pluginsCode);
        $plugins = json_decode(implode('', $pluginsOutput), true) ?: [];

        // Get themes
        $themesCmd = "wp --allow-root theme list --format=json --path={$docRoot} 2>&1";
        exec($themesCmd, $themesOutput, $themesCode);
        $themes = json_decode(implode('', $themesOutput), true) ?: [];

        // Check updates
        $updatesCmd = "wp --allow-root core check-update --format=json --path={$docRoot} 2>&1";
        exec($updatesCmd, $updatesOutput, $updatesCode);
        $updates = json_decode(implode('', $updatesOutput), true) ?: [];

        return [
            'installed' => true,
            'version' => $version,
            'site_url' => $siteUrl,
            'plugins' => $plugins,
            'themes' => $themes,
            'updates_available' => count($updates) > 0,
            'updates' => $updates,
        ];
    }

    /**
     * Update WordPress core.
     */
    public function updateCore(string $username, string $domain): array
    {
        $docRoot = "/home/{$username}/web/{$domain}/public_html";
        $cmd = "wp --allow-root core update --path={$docRoot} 2>&1";
        exec($cmd, $output, $code);

        return ['success' => $code === 0, 'output' => implode("\n", $output)];
    }

    /**
     * Install a plugin.
     */
    public function installPlugin(string $username, string $domain, string $plugin): array
    {
        $docRoot = "/home/{$username}/web/{$domain}/public_html";
        $cmd = sprintf("wp --allow-root plugin install %s --activate --path=%s 2>&1", escapeshellarg($plugin), $docRoot);
        exec($cmd, $output, $code);

        return ['success' => $code === 0, 'output' => implode("\n", $output)];
    }

    /**
     * Deactivate a plugin.
     */
    public function deactivatePlugin(string $username, string $domain, string $plugin): array
    {
        $docRoot = "/home/{$username}/web/{$domain}/public_html";
        $cmd = sprintf("wp --allow-root plugin deactivate %s --path=%s 2>&1", escapeshellarg($plugin), $docRoot);
        exec($cmd, $output, $code);

        return ['success' => $code === 0, 'output' => implode("\n", $output)];
    }

    /**
     * Delete a plugin.
     */
    public function deletePlugin(string $username, string $domain, string $plugin): array
    {
        $docRoot = "/home/{$username}/web/{$domain}/public_html";
        $cmd = sprintf("wp --allow-root plugin delete %s --path=%s 2>&1", escapeshellarg($plugin), $docRoot);
        exec($cmd, $output, $code);

        return ['success' => $code === 0, 'output' => implode("\n", $output)];
    }

    /**
     * Update all plugins.
     */
    public function updatePlugins(string $username, string $domain): array
    {
        $docRoot = "/home/{$username}/web/{$domain}/public_html";
        $cmd = "wp --allow-root plugin update --all --path={$docRoot} 2>&1";
        exec($cmd, $output, $code);

        return ['success' => $code === 0, 'output' => implode("\n", $output)];
    }

    /**
     * Change WordPress admin password.
     */
    public function resetAdminPassword(string $username, string $domain, string $newPassword): array
    {
        $docRoot = "/home/{$username}/web/{$domain}/public_html";
        // Get admin user ID (usually 1)
        $cmd = sprintf("wp --allow-root user update 1 --user_pass=%s --path=%s 2>&1", escapeshellarg($newPassword), $docRoot);
        exec($cmd, $output, $code);

        return ['success' => $code === 0, 'output' => implode("\n", $output)];
    }

    /**
     * Enable/disable maintenance mode.
     */
    public function setMaintenanceMode(string $username, string $domain, bool $enable): array
    {
        $docRoot = "/home/{$username}/web/{$domain}/public_html";
        $action = $enable ? 'activate' : 'deactivate';
        $cmd = "wp --allow-root maintenance-mode {$action} --path={$docRoot} 2>&1";
        exec($cmd, $output, $code);

        return ['success' => $code === 0, 'output' => implode("\n", $output)];
    }

    /**
     * Flush cache.
     */
    public function flushCache(string $username, string $domain): array
    {
        $docRoot = "/home/{$username}/web/{$domain}/public_html";
        $cmd = "wp --allow-root cache flush --path={$docRoot} 2>&1";
        exec($cmd, $output, $code);

        return ['success' => $code === 0, 'output' => implode("\n", $output)];
    }

    /**
     * Search and replace in database (useful for domain changes).
     */
    public function searchReplace(string $username, string $domain, string $oldUrl, string $newUrl): array
    {
        $docRoot = "/home/{$username}/web/{$domain}/public_html";
        $cmd = sprintf(
            "wp --allow-root search-replace %s %s --path=%s 2>&1",
            escapeshellarg($oldUrl),
            escapeshellarg($newUrl),
            $docRoot
        );
        exec($cmd, $output, $code);

        return ['success' => $code === 0, 'output' => implode("\n", $output)];
    }
}
