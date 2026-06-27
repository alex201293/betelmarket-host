<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * List users (filtered by role for resellers).
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = User::with('hostingAccounts');

        // Resellers can only see their clients (future: add parent_id relationship)
        if ($user->isReseller()) {
            $query->where('role', 'client');
        }

        $users = $query->paginate(20);

        return response()->json($users);
    }

    /**
     * Create a new user.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => 'required|in:super_admin,reseller,client',
        ]);

        $currentUser = $request->user();

        // Resellers can only create clients
        if ($currentUser->isReseller() && $request->role !== 'client') {
            return response()->json(['message' => 'Resellers can only create client accounts.'], 403);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $request->password,
            'role' => $request->role,
            'status' => 'active',
        ]);

        return response()->json($user, 201);
    }

    /**
     * Update a user.
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'status' => 'sometimes|in:active,suspended,pending,deleted',
            'role' => 'sometimes|in:super_admin,reseller,client',
        ]);

        $user->update($request->only(['name', 'email', 'status', 'role']));

        return response()->json($user);
    }

    /**
     * Delete a user.
     */
    public function destroy(User $user): JsonResponse
    {
        $user->update(['status' => 'deleted']);

        return response()->json(['message' => 'User deleted.']);
    }
}
