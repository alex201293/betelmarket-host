<?php

namespace App\Http\Controllers;

use App\Models\Domain;
use App\Services\Hestia\HestiaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FtpController extends Controller
{
    public function __construct(
        private readonly HestiaService $hestia
    ) {}

    /**
     * List FTP accounts for a domain.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Get all domains for this user
        $domains = Domain::whereHas('hostingAccount', fn($q) =>
            $user->isSuperAdmin() ? $q : $q->where('user_id', $user->id)
        )->with('hostingAccount')->get();

        $ftpAccounts = [];

        foreach ($domains as $domain) {
            $username = $domain->hostingAccount->hestia_username;
            $result = $this->hestia->execute('v-list-web-domain-ftp', [$username, $domain->domain, 'json']);

            if ($result['success'] && $result['response']) {
                $accounts = json_decode($result['response'], true) ?: [];
                foreach ($accounts as $ftpUser => $info) {
                    $ftpAccounts[] = [
                        'username' => $ftpUser,
                        'domain' => $domain->domain,
                        'domain_id' => $domain->id,
                        'path' => $info['path'] ?? "/home/{$username}/web/{$domain->domain}/public_html",
                        'status' => 'active',
                    ];
                }
            }
        }

        return response()->json($ftpAccounts);
    }

    /**
     * Create FTP account.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'domain_id' => 'required|exists:domains,id',
            'ftp_user' => 'required|string|max:32|alpha_dash',
            'ftp_password' => 'required|string|min:8',
            'path' => 'sometimes|string|max:255',
        ]);

        $domain = Domain::with('hostingAccount')->findOrFail($request->domain_id);

        // Check ownership
        $user = $request->user();
        if ($user->isClient() && $domain->hostingAccount->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $username = $domain->hostingAccount->hestia_username;
        $path = $request->get('path', "/home/{$username}/web/{$domain->domain}/public_html");

        $result = $this->hestia->execute('v-add-web-domain-ftp', [
            $username,
            $domain->domain,
            $request->ftp_user,
            $request->ftp_password,
            $path,
        ]);

        if ($result['success']) {
            return response()->json([
                'message' => 'FTP account created.',
                'ftp_host' => config('hestia.host'),
                'ftp_port' => 21,
                'ftp_user' => "{$username}_{$request->ftp_user}",
                'path' => $path,
            ], 201);
        }

        return response()->json(['message' => 'Failed to create FTP account.', 'error' => $result['response'] ?? ''], 422);
    }

    /**
     * Change FTP password.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'domain_id' => 'required|exists:domains,id',
            'ftp_user' => 'required|string',
            'new_password' => 'required|string|min:8',
        ]);

        $domain = Domain::with('hostingAccount')->findOrFail($request->domain_id);
        $username = $domain->hostingAccount->hestia_username;

        $result = $this->hestia->execute('v-change-web-domain-ftp-password', [
            $username,
            $domain->domain,
            $request->ftp_user,
            $request->new_password,
        ]);

        return response()->json([
            'success' => $result['success'],
            'message' => $result['success'] ? 'Password changed.' : 'Failed to change password.',
        ]);
    }

    /**
     * Delete FTP account.
     */
    public function destroy(Request $request): JsonResponse
    {
        $request->validate([
            'domain_id' => 'required|exists:domains,id',
            'ftp_user' => 'required|string',
        ]);

        $domain = Domain::with('hostingAccount')->findOrFail($request->domain_id);
        $username = $domain->hostingAccount->hestia_username;

        $result = $this->hestia->execute('v-delete-web-domain-ftp', [
            $username,
            $domain->domain,
            $request->ftp_user,
        ]);

        return response()->json([
            'success' => $result['success'],
            'message' => $result['success'] ? 'FTP account deleted.' : 'Failed.',
        ]);
    }
}
