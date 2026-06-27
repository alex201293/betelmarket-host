<?php

namespace App\Providers;

use App\Services\Hestia\BackupManager;
use App\Services\Hestia\DnsManager;
use App\Services\Hestia\DomainManager;
use App\Services\Hestia\HestiaService;
use App\Services\Hestia\MailManager;
use App\Services\Hestia\UserManager;
use Illuminate\Support\ServiceProvider;

class HestiaServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(HestiaService::class);
        $this->app->singleton(UserManager::class);
        $this->app->singleton(DomainManager::class);
        $this->app->singleton(MailManager::class);
        $this->app->singleton(DnsManager::class);
        $this->app->singleton(BackupManager::class);
    }

    public function boot(): void
    {
        //
    }
}
