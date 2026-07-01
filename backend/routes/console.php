<?php

use Illuminate\Support\Facades\Schedule;

/*
|--------------------------------------------------------------------------
| Scheduled Tasks
|--------------------------------------------------------------------------
*/

// Collect server metrics every 5 minutes
Schedule::command('metrics:collect')->everyFiveMinutes();

// Check disk quota usage every hour
Schedule::command('quota:check')->hourly();

// Auto-scale quotas every 30 minutes
Schedule::command('quota:auto-scale')->everyThirtyMinutes();

// Auto-scale mail quotas every 30 minutes (adds 1GB when at 80%)
Schedule::command('quota:auto-scale-mail')->everyThirtyMinutes();

// Check overdue invoices daily
Schedule::command('invoices:check-overdue')->daily();
