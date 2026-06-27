<?php

namespace App\Http\Controllers;

use App\Models\Domain;
use App\Jobs\EnableSsl;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SslController extends Controller
{
    /**
     * Enable SSL for a domain.
     */
    public function enable(Request $request, Domain $domain): JsonResponse
    {
        if ($domain->ssl_enabled) {
            return response()->json(['message' => 'SSL is already enabled.'], 422);
        }

        EnableSsl::dispatch($domain);

        return response()->json(['message' => 'SSL provisioning initiated.']);
    }

    /**
     * Disable SSL for a domain.
     */
    public function disable(Domain $domain): JsonResponse
    {
        $domain->update(['ssl_enabled' => false]);

        return response()->json(['message' => 'SSL disabled.']);
    }

    /**
     * Get SSL status for a domain.
     */
    public function status(Domain $domain): JsonResponse
    {
        return response()->json([
            'domain' => $domain->domain,
            'ssl_enabled' => $domain->ssl_enabled,
            'status' => $domain->status,
        ]);
    }
}
