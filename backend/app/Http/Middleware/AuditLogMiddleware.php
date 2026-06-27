<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuditLogMiddleware
{
    /**
     * Log write operations (POST, PATCH, PUT, DELETE) for audit trail.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only log mutating requests that succeeded
        if (in_array($request->method(), ['POST', 'PATCH', 'PUT', 'DELETE'])
            && $response->getStatusCode() < 400
        ) {
            $user = $request->user();

            AuditLog::create([
                'user_id' => $user?->id,
                'action' => strtolower($request->method()) . '.' . $request->path(),
                'resource_type' => $this->guessResourceType($request->path()),
                'resource_id' => $this->guessResourceId($request->path()),
                'metadata' => [
                    'method' => $request->method(),
                    'path' => $request->path(),
                    'status' => $response->getStatusCode(),
                ],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        }

        return $response;
    }

    private function guessResourceType(string $path): ?string
    {
        $segments = explode('/', trim($path, '/'));
        // api/users/1 -> User, api/domains/1 -> Domain
        foreach ($segments as $segment) {
            if (in_array($segment, ['users', 'domains', 'emails', 'dns', 'backups', 'hosting', 'plans', 'invoices', 'subdomains'])) {
                return ucfirst(rtrim($segment, 's'));
            }
        }
        return null;
    }

    private function guessResourceId(string $path): ?int
    {
        $segments = explode('/', trim($path, '/'));
        foreach ($segments as $segment) {
            if (is_numeric($segment)) {
                return (int) $segment;
            }
        }
        return null;
    }
}
