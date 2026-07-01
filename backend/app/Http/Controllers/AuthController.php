<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Verify reCAPTCHA token if secret key is configured.
     */
    private function verifyCaptcha(Request $request): bool
    {
        $secret = env('RECAPTCHA_SECRET_KEY');
        if (!$secret) return true; // Skip if not configured

        $token = $request->input('captcha_token');
        if (!$token) return false;

        $response = Http::asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
            'secret' => $secret,
            'response' => $token,
            'remoteip' => $request->ip(),
        ]);

        return $response->json('success', false);
    }

    /**
     * Login and return a token.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if (!$this->verifyCaptcha($request)) {
            return response()->json(['message' => 'Verificación de captcha fallida.'], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (! $user->isActive()) {
            return response()->json([
                'message' => 'Account is not active. Please contact support.',
            ], 403);
        }

        $token = $user->createToken('api-token', [$user->role])->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user,
        ]);
    }

    /**
     * Logout (revoke current token).
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    /**
     * Get authenticated user profile.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['hostingAccounts.plan', 'hostingAccounts.domains']);

        return response()->json($user);
    }

    /**
     * Register a new client user.
     */
    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if (!$this->verifyCaptcha($request)) {
            return response()->json(['message' => 'Verificación de captcha fallida.'], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $request->password,
            'role' => 'client',
            'status' => 'active',
        ]);

        $token = $user->createToken('api-token', ['client'])->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user,
        ], 201);
    }
}
