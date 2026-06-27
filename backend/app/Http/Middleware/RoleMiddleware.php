<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * Usage: ->middleware('role:super_admin,reseller')
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (! in_array($user->role, $roles)) {
            return response()->json(['message' => 'Insufficient permissions.'], 403);
        }

        if (! $user->isActive()) {
            return response()->json(['message' => 'Account suspended.'], 403);
        }

        return $next($request);
    }
}
