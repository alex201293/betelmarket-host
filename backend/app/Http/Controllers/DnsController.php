<?php

namespace App\Http\Controllers;

use App\Models\DnsRecord;
use App\Models\Domain;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DnsController extends Controller
{
    /**
     * List DNS records.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = DnsRecord::with('domain.hostingAccount');

        if ($user->isClient()) {
            $query->whereHas('domain.hostingAccount', fn($q) => $q->where('user_id', $user->id));
        }

        if ($request->has('domain_id')) {
            $query->where('domain_id', $request->domain_id);
        }

        $records = $query->paginate(50);

        return response()->json($records);
    }

    /**
     * Create a DNS record.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'domain_id' => 'required|exists:domains,id',
            'type' => 'required|in:A,AAAA,CNAME,MX,TXT,NS,SRV',
            'name' => 'required|string',
            'value' => 'required|string',
            'ttl' => 'sometimes|integer|min:60',
            'priority' => 'sometimes|integer|min:0',
        ]);

        $record = DnsRecord::create([
            'domain_id' => $request->domain_id,
            'type' => $request->type,
            'name' => $request->name,
            'value' => $request->value,
            'ttl' => $request->get('ttl', 3600),
            'priority' => $request->priority,
        ]);

        return response()->json($record, 201);
    }

    /**
     * Update a DNS record.
     */
    public function update(Request $request, DnsRecord $dnsRecord): JsonResponse
    {
        $request->validate([
            'type' => 'sometimes|in:A,AAAA,CNAME,MX,TXT,NS,SRV',
            'name' => 'sometimes|string',
            'value' => 'sometimes|string',
            'ttl' => 'sometimes|integer|min:60',
            'priority' => 'sometimes|integer|min:0',
        ]);

        $dnsRecord->update($request->only(['type', 'name', 'value', 'ttl', 'priority']));

        return response()->json($dnsRecord);
    }

    /**
     * Delete a DNS record.
     */
    public function destroy(DnsRecord $dnsRecord): JsonResponse
    {
        $dnsRecord->delete();

        return response()->json(['message' => 'DNS record deleted.']);
    }
}
