<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class SettingsController extends Controller
{
    /**
     * Get user profile.
     */
    public function profile(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }

    /**
     * Update user profile.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
        ]);

        $user->update($request->only(['name', 'email']));

        return response()->json($user);
    }

    /**
     * Change password.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (! Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Current password is incorrect.'],
            ]);
        }

        $user->update(['password' => $request->new_password]);

        return response()->json(['message' => 'Password changed successfully.']);
    }

    /**
     * Generate API key (creates a new personal access token).
     */
    public function generateApiKey(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $token = $request->user()->createToken($request->name)->plainTextToken;

        return response()->json([
            'token' => $token,
            'message' => 'API key generated. Store it safely, it will not be shown again.',
        ]);
    }

    /**
     * List API keys (tokens).
     */
    public function listApiKeys(Request $request): JsonResponse
    {
        $tokens = $request->user()->tokens()
            ->select('id', 'name', 'last_used_at', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($tokens);
    }

    /**
     * Revoke an API key.
     */
    public function revokeApiKey(Request $request, int $tokenId): JsonResponse
    {
        $request->user()->tokens()->where('id', $tokenId)->delete();

        return response()->json(['message' => 'API key revoked.']);
    }
}
