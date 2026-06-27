<?php

namespace App\Services\Hestia;

use App\Models\App;
use Illuminate\Support\Facades\Log;

class AppManager
{
    public function __construct(
        private readonly HestiaService $hestia
    ) {}

    /**
     * Deploy an app: clone repo, install deps, build, start with PM2.
     */
    public function deploy(App $app): array
    {
        $username = $app->domain->hostingAccount->hestia_username;
        $deployPath = "/home/{$username}/apps/{$app->name}";
        $logs = [];

        try {
            // Step 1: Clone or pull git repo
            if ($app->git_repo) {
                if (is_dir($deployPath)) {
                    $gitCmd = "sudo -u {$username} git -C {$deployPath} pull origin {$app->git_branch} 2>&1";
                } else {
                    $gitCmd = "sudo -u {$username} git clone -b {$app->git_branch} {$app->git_repo} {$deployPath} 2>&1";
                }
                exec($gitCmd, $output, $code);
                $logs[] = "Git: " . implode("\n", $output);
                if ($code !== 0) {
                    return ['success' => false, 'step' => 'git', 'logs' => implode("\n", $logs)];
                }
            }

            // Step 2: Install dependencies
            $installCmd = $app->install_command ?: $this->getDefaultInstallCommand($app->runtime);
            if ($installCmd) {
                $cmd = "cd {$deployPath} && sudo -u {$username} {$installCmd} 2>&1";
                exec($cmd, $installOutput, $installCode);
                $logs[] = "Install: " . implode("\n", $installOutput);
                if ($installCode !== 0) {
                    return ['success' => false, 'step' => 'install', 'logs' => implode("\n", $logs)];
                }
            }

            // Step 3: Build (if configured)
            if ($app->build_command) {
                $cmd = "cd {$deployPath} && sudo -u {$username} {$app->build_command} 2>&1";
                exec($cmd, $buildOutput, $buildCode);
                $logs[] = "Build: " . implode("\n", $buildOutput);
                if ($buildCode !== 0) {
                    return ['success' => false, 'step' => 'build', 'logs' => implode("\n", $logs)];
                }
            }

            // Step 4: Start/restart with PM2
            $startCmd = $app->start_command ?: "{$this->getDefaultStartBinary($app->runtime)} {$app->entry_point}";
            $this->stopProcess($app);

            $envString = $this->buildEnvString($app);
            $pm2Cmd = "cd {$deployPath} && sudo -u {$username} {$envString} pm2 start \"{$startCmd}\" --name \"{$app->name}\" -- 2>&1";
            exec($pm2Cmd, $pm2Output, $pm2Code);
            $logs[] = "PM2: " . implode("\n", $pm2Output);

            // Step 5: Configure Nginx proxy
            $this->configureProxy($username, $app->domain->domain, $app->port);

            $app->update([
                'deploy_path' => $deployPath,
                'status' => $pm2Code === 0 ? 'running' : 'error',
                'last_deploy_log' => implode("\n---\n", $logs),
                'last_deployed_at' => now(),
            ]);

            return ['success' => $pm2Code === 0, 'logs' => implode("\n", $logs)];

        } catch (\Exception $e) {
            Log::error("App deploy failed: " . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage(), 'logs' => implode("\n", $logs)];
        }
    }

    /**
     * Start an app process.
     */
    public function start(App $app): array
    {
        $username = $app->domain->hostingAccount->hestia_username;
        $cmd = "sudo -u {$username} pm2 start {$app->name} 2>&1";
        exec($cmd, $output, $code);

        if ($code === 0) {
            $app->update(['status' => 'running']);
        }

        return ['success' => $code === 0, 'output' => implode("\n", $output)];
    }

    /**
     * Stop an app process.
     */
    public function stop(App $app): array
    {
        $username = $app->domain->hostingAccount->hestia_username;
        $cmd = "sudo -u {$username} pm2 stop {$app->name} 2>&1";
        exec($cmd, $output, $code);

        $app->update(['status' => 'stopped']);

        return ['success' => $code === 0, 'output' => implode("\n", $output)];
    }

    /**
     * Restart an app.
     */
    public function restart(App $app): array
    {
        $username = $app->domain->hostingAccount->hestia_username;
        $cmd = "sudo -u {$username} pm2 restart {$app->name} 2>&1";
        exec($cmd, $output, $code);

        if ($code === 0) {
            $app->update(['status' => 'running']);
        }

        return ['success' => $code === 0, 'output' => implode("\n", $output)];
    }

    /**
     * Get logs from PM2.
     */
    public function getLogs(App $app, int $lines = 100): array
    {
        $username = $app->domain->hostingAccount->hestia_username;
        $cmd = "sudo -u {$username} pm2 logs {$app->name} --nostream --lines {$lines} 2>&1";
        exec($cmd, $output, $code);

        return ['success' => $code === 0, 'logs' => implode("\n", $output)];
    }

    /**
     * Delete app and cleanup.
     */
    public function delete(App $app): array
    {
        $username = $app->domain->hostingAccount->hestia_username;

        // Stop process
        exec("sudo -u {$username} pm2 delete {$app->name} 2>&1");

        // Remove deploy directory
        if ($app->deploy_path && is_dir($app->deploy_path)) {
            exec("rm -rf {$app->deploy_path}");
        }

        // Remove proxy config
        $this->removeProxy($username, $app->domain->domain);

        return ['success' => true];
    }

    /**
     * Configure Nginx reverse proxy for the app.
     */
    private function configureProxy(string $username, string $domain, int $port): void
    {
        // HestiaCP proxy template
        $this->hestia->execute('v-change-web-domain-proxy-tpl', [
            $username, $domain, 'default', 'yes',
        ]);

        // Custom proxy config
        $proxyConf = "location / {\n    proxy_pass http://127.0.0.1:{$port};\n    proxy_http_version 1.1;\n    proxy_set_header Upgrade \$http_upgrade;\n    proxy_set_header Connection 'upgrade';\n    proxy_set_header Host \$host;\n    proxy_set_header X-Real-IP \$remote_addr;\n    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;\n    proxy_set_header X-Forwarded-Proto \$scheme;\n    proxy_cache_bypass \$http_upgrade;\n}\n";

        $confPath = "/home/{$username}/conf/web/{$domain}/nginx.conf_custom";
        file_put_contents($confPath, $proxyConf);

        // Restart nginx
        exec("sudo systemctl reload nginx 2>&1");
    }

    /**
     * Remove proxy config.
     */
    private function removeProxy(string $username, string $domain): void
    {
        $confPath = "/home/{$username}/conf/web/{$domain}/nginx.conf_custom";
        if (file_exists($confPath)) {
            unlink($confPath);
            exec("sudo systemctl reload nginx 2>&1");
        }
    }

    private function stopProcess(App $app): void
    {
        $username = $app->domain->hostingAccount->hestia_username;
        exec("sudo -u {$username} pm2 delete {$app->name} 2>&1");
    }

    private function buildEnvString(App $app): string
    {
        $envVars = $app->env_vars ?? [];
        $envVars['PORT'] = (string) $app->port;
        $parts = [];
        foreach ($envVars as $key => $value) {
            $parts[] = "{$key}=" . escapeshellarg($value);
        }
        return implode(' ', $parts);
    }

    private function getDefaultInstallCommand(string $runtime): string
    {
        return match (true) {
            str_starts_with($runtime, 'nodejs') => 'npm install --production',
            str_starts_with($runtime, 'python') => 'pip install -r requirements.txt',
            str_starts_with($runtime, 'ruby') => 'bundle install',
            str_starts_with($runtime, 'go') => 'go mod download',
            str_starts_with($runtime, 'bun') => 'bun install',
            default => '',
        };
    }

    private function getDefaultStartBinary(string $runtime): string
    {
        return match (true) {
            str_starts_with($runtime, 'nodejs') => 'node',
            str_starts_with($runtime, 'python') => 'python3',
            str_starts_with($runtime, 'ruby') => 'ruby',
            str_starts_with($runtime, 'go') => 'go run',
            str_starts_with($runtime, 'bun') => 'bun run',
            str_starts_with($runtime, 'deno') => 'deno run --allow-all',
            default => 'node',
        };
    }

    /**
     * Assign next available port for a new app (range 3001-4000).
     */
    public static function assignPort(): int
    {
        $usedPorts = App::pluck('port')->toArray();
        for ($port = 3001; $port <= 4000; $port++) {
            if (!in_array($port, $usedPorts)) {
                return $port;
            }
        }
        throw new \Exception('No available ports');
    }
}
