<?php

namespace App\Console\Commands;

use App\Jobs\CollectServerMetrics;
use Illuminate\Console\Command;

class CollectMetricsCommand extends Command
{
    protected $signature = 'metrics:collect';
    protected $description = 'Collect server metrics and store them';

    public function handle(): int
    {
        CollectServerMetrics::dispatch();
        $this->info('Metrics collection job dispatched.');
        return 0;
    }
}
