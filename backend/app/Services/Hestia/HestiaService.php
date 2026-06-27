<?php

namespace App\Services\Hestia;

use Illuminate\Support\Facades\Log;

class HestiaService
{
    private string $host;
    private int $port;
    private string $adminUser;
    private string $adminPassword;
    private bool $useApi;

    public function __construct()
    {
        $this->host = config('hestia.host', '127.0.0.1');
        $this->port = (int) config('hestia.port', 8083);
        $this->adminUser = config('hestia.admin_user', 'admin');
        $this->adminPassword = config('hestia.admin_password', '');
        $this->useApi = config('hestia.use_api', true);
    }

    /**
     * Execute a HestiaCP API command.
     */
    public function execute(string $command, array $params = []): array
    {
        if ($this->useApi) {
            return $this->executeViaApi($command, $params);
        }

        return $this->executeViaCli($command, $params);
    }

    /**
     * Execute via HestiaCP REST API.
     */
    private function executeViaApi(string $command, array $params): array
    {
        $postData = array_merge([
            'user' => $this->adminUser,
            'password' => $this->adminPassword,
            'returncode' => 'yes',
            'cmd' => $command,
        ], $this->formatApiParams($params));

        $url = "https://{$this->host}:{$this->port}/api/";

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query($postData),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT => 120,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            Log::error("Hestia API error: {$error}", compact('command', 'params'));
            return ['success' => false, 'error' => $error, 'code' => 0];
        }

        Log::info("Hestia API response", compact('command', 'httpCode', 'response'));

        return [
            'success' => $httpCode === 200 && (int) trim($response) === 0,
            'response' => $response,
            'code' => (int) trim($response),
        ];
    }

    /**
     * Execute via CLI (SSH or local exec).
     */
    private function executeViaCli(string $command, array $params): array
    {
        $paramString = implode(' ', array_map('escapeshellarg', $params));
        $fullCommand = "/usr/local/hestia/bin/{$command} {$paramString}";

        $output = [];
        $returnCode = 0;

        exec($fullCommand . ' 2>&1', $output, $returnCode);

        $outputString = implode("\n", $output);

        Log::info("Hestia CLI executed", compact('fullCommand', 'returnCode', 'outputString'));

        return [
            'success' => $returnCode === 0,
            'response' => $outputString,
            'code' => $returnCode,
        ];
    }

    /**
     * Format params for the API (arg1, arg2, arg3...).
     */
    private function formatApiParams(array $params): array
    {
        $formatted = [];
        foreach (array_values($params) as $index => $value) {
            $formatted['arg' . ($index + 1)] = $value;
        }
        return $formatted;
    }

    /**
     * Health check.
     */
    public function health(): bool
    {
        $result = $this->execute('v-list-sys-info', []);
        return $result['success'];
    }
}
