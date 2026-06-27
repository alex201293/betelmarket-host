<?php

namespace App\Http\Controllers;

use App\Models\Domain;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FileManagerController extends Controller
{
    /**
     * List files in a directory.
     */
    public function list(Request $request): JsonResponse
    {
        $request->validate([
            'domain_id' => 'required|exists:domains,id',
            'path' => 'sometimes|string',
        ]);

        $domain = Domain::with('hostingAccount')->findOrFail($request->domain_id);

        // Check ownership
        $user = $request->user();
        if ($user->isClient() && $domain->hostingAccount->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $username = $domain->hostingAccount->hestia_username;
        $basePath = "/home/{$username}/web/{$domain->domain}/public_html";
        $relativePath = $request->get('path', '/');

        // Sanitize path to prevent directory traversal
        $relativePath = str_replace('..', '', $relativePath);
        $fullPath = rtrim($basePath, '/') . '/' . ltrim($relativePath, '/');

        if (!is_dir($fullPath)) {
            return response()->json(['message' => 'Directory not found.'], 404);
        }

        $items = [];
        $entries = scandir($fullPath);

        foreach ($entries as $entry) {
            if ($entry === '.') continue;

            $entryPath = $fullPath . '/' . $entry;
            $isDir = is_dir($entryPath);

            $items[] = [
                'name' => $entry,
                'path' => rtrim($relativePath, '/') . '/' . $entry,
                'is_dir' => $isDir,
                'size' => $isDir ? 0 : filesize($entryPath),
                'modified' => date('Y-m-d H:i:s', filemtime($entryPath)),
                'permissions' => substr(sprintf('%o', fileperms($entryPath)), -4),
            ];
        }

        // Sort: dirs first, then files
        usort($items, function ($a, $b) {
            if ($a['is_dir'] === $b['is_dir']) return strcmp($a['name'], $b['name']);
            return $a['is_dir'] ? -1 : 1;
        });

        return response()->json([
            'path' => $relativePath,
            'items' => $items,
            'base' => $basePath,
        ]);
    }

    /**
     * Read a file's content.
     */
    public function read(Request $request): JsonResponse
    {
        $request->validate([
            'domain_id' => 'required|exists:domains,id',
            'path' => 'required|string',
        ]);

        $domain = Domain::with('hostingAccount')->findOrFail($request->domain_id);
        $user = $request->user();
        if ($user->isClient() && $domain->hostingAccount->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $username = $domain->hostingAccount->hestia_username;
        $basePath = "/home/{$username}/web/{$domain->domain}/public_html";
        $filePath = $basePath . '/' . str_replace('..', '', $request->path);

        if (!file_exists($filePath) || is_dir($filePath)) {
            return response()->json(['message' => 'File not found.'], 404);
        }

        // Limit file size to 2MB for reading
        if (filesize($filePath) > 2 * 1024 * 1024) {
            return response()->json(['message' => 'File too large to display. Use FTP to download.'], 422);
        }

        $content = file_get_contents($filePath);

        return response()->json([
            'path' => $request->path,
            'content' => $content,
            'size' => filesize($filePath),
            'modified' => date('Y-m-d H:i:s', filemtime($filePath)),
        ]);
    }

    /**
     * Save file content.
     */
    public function save(Request $request): JsonResponse
    {
        $request->validate([
            'domain_id' => 'required|exists:domains,id',
            'path' => 'required|string',
            'content' => 'required|string',
        ]);

        $domain = Domain::with('hostingAccount')->findOrFail($request->domain_id);
        $user = $request->user();
        if ($user->isClient() && $domain->hostingAccount->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $username = $domain->hostingAccount->hestia_username;
        $basePath = "/home/{$username}/web/{$domain->domain}/public_html";
        $filePath = $basePath . '/' . str_replace('..', '', $request->path);

        file_put_contents($filePath, $request->content);

        return response()->json(['message' => 'File saved.']);
    }

    /**
     * Create a new file or directory.
     */
    public function create(Request $request): JsonResponse
    {
        $request->validate([
            'domain_id' => 'required|exists:domains,id',
            'path' => 'required|string',
            'type' => 'required|in:file,directory',
        ]);

        $domain = Domain::with('hostingAccount')->findOrFail($request->domain_id);
        $user = $request->user();
        if ($user->isClient() && $domain->hostingAccount->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $username = $domain->hostingAccount->hestia_username;
        $basePath = "/home/{$username}/web/{$domain->domain}/public_html";
        $fullPath = $basePath . '/' . str_replace('..', '', $request->path);

        if (file_exists($fullPath)) {
            return response()->json(['message' => 'File already exists.'], 422);
        }

        if ($request->type === 'directory') {
            mkdir($fullPath, 0755, true);
        } else {
            touch($fullPath);
        }

        // Set ownership
        exec("chown {$username}:{$username} " . escapeshellarg($fullPath));

        return response()->json(['message' => ucfirst($request->type) . ' created.'], 201);
    }

    /**
     * Delete a file or directory.
     */
    public function delete(Request $request): JsonResponse
    {
        $request->validate([
            'domain_id' => 'required|exists:domains,id',
            'path' => 'required|string',
        ]);

        $domain = Domain::with('hostingAccount')->findOrFail($request->domain_id);
        $user = $request->user();
        if ($user->isClient() && $domain->hostingAccount->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $username = $domain->hostingAccount->hestia_username;
        $basePath = "/home/{$username}/web/{$domain->domain}/public_html";
        $fullPath = $basePath . '/' . str_replace('..', '', $request->path);

        if (!file_exists($fullPath)) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        if (is_dir($fullPath)) {
            exec("rm -rf " . escapeshellarg($fullPath));
        } else {
            unlink($fullPath);
        }

        return response()->json(['message' => 'Deleted.']);
    }

    /**
     * Rename/move a file.
     */
    public function rename(Request $request): JsonResponse
    {
        $request->validate([
            'domain_id' => 'required|exists:domains,id',
            'path' => 'required|string',
            'new_name' => 'required|string|max:255',
        ]);

        $domain = Domain::with('hostingAccount')->findOrFail($request->domain_id);
        $user = $request->user();
        if ($user->isClient() && $domain->hostingAccount->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $username = $domain->hostingAccount->hestia_username;
        $basePath = "/home/{$username}/web/{$domain->domain}/public_html";
        $oldPath = $basePath . '/' . str_replace('..', '', $request->path);
        $dir = dirname($oldPath);
        $newPath = $dir . '/' . basename(str_replace('..', '', $request->new_name));

        if (!file_exists($oldPath)) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        rename($oldPath, $newPath);

        return response()->json(['message' => 'Renamed.']);
    }
}
