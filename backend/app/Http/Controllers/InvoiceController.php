<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\HostingAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    /**
     * List invoices.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Invoice::with('items');

        if ($user->isClient()) {
            $query->where('user_id', $user->id);
        }

        $invoices = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($invoices);
    }

    /**
     * Show a single invoice.
     */
    public function show(Invoice $invoice): JsonResponse
    {
        $invoice->load('items.plan', 'user');

        return response()->json($invoice);
    }

    /**
     * Create an invoice.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.plan_id' => 'nullable|exists:plans,id',
            'items.*.hosting_account_id' => 'nullable|exists:hosting_accounts,id',
            'due_date' => 'required|date|after:today',
            'tax' => 'sometimes|numeric|min:0',
            'notes' => 'sometimes|string',
        ]);

        $amount = collect($request->items)->sum(fn($item) =>
            $item['quantity'] * $item['unit_price']
        );
        $tax = $request->get('tax', 0);
        $total = $amount + $tax;

        $invoice = Invoice::create([
            'user_id' => $request->user_id,
            'invoice_number' => Invoice::generateNumber(),
            'amount' => $amount,
            'tax' => $tax,
            'total' => $total,
            'status' => 'pending',
            'issue_date' => now(),
            'due_date' => $request->due_date,
            'notes' => $request->notes,
        ]);

        foreach ($request->items as $item) {
            InvoiceItem::create([
                'invoice_id' => $invoice->id,
                'description' => $item['description'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'total' => $item['quantity'] * $item['unit_price'],
                'plan_id' => $item['plan_id'] ?? null,
                'hosting_account_id' => $item['hosting_account_id'] ?? null,
            ]);
        }

        return response()->json($invoice->load('items'), 201);
    }

    /**
     * Mark invoice as paid.
     */
    public function markPaid(Request $request, Invoice $invoice): JsonResponse
    {
        $request->validate([
            'payment_method' => 'required|string',
        ]);

        $invoice->update([
            'status' => 'paid',
            'paid_at' => now(),
            'payment_method' => $request->payment_method,
        ]);

        return response()->json($invoice);
    }

    /**
     * Cancel an invoice.
     */
    public function cancel(Invoice $invoice): JsonResponse
    {
        if ($invoice->isPaid()) {
            return response()->json(['message' => 'Cannot cancel a paid invoice.'], 422);
        }

        $invoice->update(['status' => 'cancelled']);

        return response()->json($invoice);
    }

    /**
     * Get billing summary.
     */
    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Invoice::query();
        if ($user->isClient()) {
            $query->where('user_id', $user->id);
        }

        $totalRevenue = (clone $query)->where('status', 'paid')->sum('total');
        $pendingAmount = (clone $query)->where('status', 'pending')->sum('total');
        $overdueAmount = (clone $query)->where('status', 'pending')
            ->where('due_date', '<', now())->sum('total');
        $invoiceCount = (clone $query)->count();

        return response()->json([
            'total_revenue' => $totalRevenue,
            'pending_amount' => $pendingAmount,
            'overdue_amount' => $overdueAmount,
            'total_invoices' => $invoiceCount,
        ]);
    }
}
