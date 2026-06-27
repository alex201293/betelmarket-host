<?php

namespace App\Console\Commands;

use App\Models\Invoice;
use App\Models\Notification;
use Illuminate\Console\Command;

class CheckOverdueInvoices extends Command
{
    protected $signature = 'invoices:check-overdue';
    protected $description = 'Mark overdue invoices and send notifications';

    public function handle(): int
    {
        $overdueInvoices = Invoice::where('status', 'pending')
            ->where('due_date', '<', now())
            ->get();

        foreach ($overdueInvoices as $invoice) {
            $invoice->update(['status' => 'overdue']);

            Notification::send(
                $invoice->user_id,
                'invoice_overdue',
                'Invoice Overdue',
                "Invoice {$invoice->invoice_number} is overdue. Amount: \${$invoice->total}",
                'warning'
            );
        }

        $this->info("Processed {$overdueInvoices->count()} overdue invoices.");
        return 0;
    }
}
