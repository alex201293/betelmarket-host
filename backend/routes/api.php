<?php

use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BackupController;
use App\Http\Controllers\DnsController;
use App\Http\Controllers\DomainController;
use App\Http\Controllers\DomainWizardController;
use App\Http\Controllers\HostingController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\MailController;
use App\Http\Controllers\MailMigrationController;
use App\Http\Controllers\MetricsController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PlanController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\SslController;
use App\Http\Controllers\SubdomainController;
use App\Http\Controllers\UsageController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WordPressController;
use App\Http\Controllers\SecurityController;
use App\Http\Controllers\AppController;
use App\Http\Controllers\QuotaController;
use App\Http\Controllers\FtpController;
use App\Http\Controllers\TempDomainController;
use App\Http\Controllers\DatabaseController;
use App\Http\Controllers\FileManagerController;
use App\Http\Controllers\PhpConfigController;
use App\Http\Controllers\WebhookController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/
Route::get('/health', fn () => ['ok' => true, 'timestamp' => now()]);

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
Route::get('/plans/public', [PlanController::class, 'index']);

// Webhooks (no auth required)
Route::post('/webhooks/deploy/{appId}/{secret}', [WebhookController::class, 'deploy']);

/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});

/*
|--------------------------------------------------------------------------
| Protected API Routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum'])->group(function () {

    // ─── Users (super_admin and reseller only) ────────────────
    Route::middleware('role:super_admin,reseller')->group(function () {
        Route::apiResource('users', UserController::class);
    });

    // ─── Plans ────────────────────────────────────────────────
    Route::get('/plans', [PlanController::class, 'index']);
    Route::middleware('role:super_admin')->group(function () {
        Route::post('/plans', [PlanController::class, 'store']);
        Route::patch('/plans/{plan}', [PlanController::class, 'update']);
    });

    // ─── Hosting Accounts ─────────────────────────────────────
    Route::get('/hosting', [HostingController::class, 'index']);
    Route::middleware('role:super_admin,reseller')->group(function () {
        Route::post('/hosting', [HostingController::class, 'store']);
        Route::patch('/hosting/{hostingAccount}', [HostingController::class, 'update']);
        Route::post('/hosting/{hostingAccount}/login-as', [HostingController::class, 'loginAs']);
    });

    // ─── Domains ──────────────────────────────────────────────
    Route::get('/domains', [DomainController::class, 'index']);
    Route::post('/domains', [DomainController::class, 'store']);
    Route::delete('/domains/{domain}', [DomainController::class, 'destroy']);

    // ─── Subdomains ───────────────────────────────────────────
    Route::get('/subdomains', [SubdomainController::class, 'index']);
    Route::post('/subdomains', [SubdomainController::class, 'store']);
    Route::delete('/subdomains/{subdomain}', [SubdomainController::class, 'destroy']);

    // ─── SSL ──────────────────────────────────────────────────
    Route::post('/domains/{domain}/ssl/enable', [SslController::class, 'enable']);
    Route::post('/domains/{domain}/ssl/disable', [SslController::class, 'disable']);
    Route::get('/domains/{domain}/ssl', [SslController::class, 'status']);

    // ─── Email Accounts ───────────────────────────────────────
    Route::get('/emails', [MailController::class, 'index']);
    Route::post('/emails', [MailController::class, 'store']);
    Route::patch('/emails/{mailAccount}', [MailController::class, 'update']);
    Route::delete('/emails/{mailAccount}', [MailController::class, 'destroy']);

    // ─── DNS Records ──────────────────────────────────────────
    Route::get('/dns', [DnsController::class, 'index']);
    Route::post('/dns', [DnsController::class, 'store']);
    Route::patch('/dns/{dnsRecord}', [DnsController::class, 'update']);
    Route::delete('/dns/{dnsRecord}', [DnsController::class, 'destroy']);

    // ─── Backups ──────────────────────────────────────────────
    Route::get('/backups', [BackupController::class, 'index']);
    Route::post('/backups', [BackupController::class, 'store']);
    Route::post('/backups/{backup}/restore', [BackupController::class, 'restore']);

    // ─── Usage / Metrics ──────────────────────────────────────
    Route::get('/usage', [UsageController::class, 'index']);

    // ─── Server Metrics (admin only) ─────────────────────────
    Route::middleware('role:super_admin')->prefix('metrics')->group(function () {
        Route::get('/current', [MetricsController::class, 'current']);
        Route::get('/history', [MetricsController::class, 'history']);
        Route::get('/top-domains', [MetricsController::class, 'topDomains']);
    });

    // ─── Notifications ────────────────────────────────────────
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
        Route::patch('/{notification}/read', [NotificationController::class, 'markRead']);
        Route::post('/mark-all-read', [NotificationController::class, 'markAllRead']);
        Route::delete('/{notification}', [NotificationController::class, 'destroy']);
    });

    // ─── Billing / Invoices ───────────────────────────────────
    Route::prefix('invoices')->group(function () {
        Route::get('/', [InvoiceController::class, 'index']);
        Route::get('/summary', [InvoiceController::class, 'summary']);
        Route::get('/{invoice}', [InvoiceController::class, 'show']);
        Route::middleware('role:super_admin,reseller')->group(function () {
            Route::post('/', [InvoiceController::class, 'store']);
            Route::post('/{invoice}/pay', [InvoiceController::class, 'markPaid']);
            Route::post('/{invoice}/cancel', [InvoiceController::class, 'cancel']);
        });
    });

    // ─── Settings ─────────────────────────────────────────────
    Route::prefix('settings')->group(function () {
        Route::get('/profile', [SettingsController::class, 'profile']);
        Route::patch('/profile', [SettingsController::class, 'updateProfile']);
        Route::post('/change-password', [SettingsController::class, 'changePassword']);
        Route::get('/api-keys', [SettingsController::class, 'listApiKeys']);
        Route::post('/api-keys', [SettingsController::class, 'generateApiKey']);
        Route::delete('/api-keys/{tokenId}', [SettingsController::class, 'revokeApiKey']);
    });

    // ─── Audit Logs (admin only) ─────────────────────────────
    Route::middleware('role:super_admin')->group(function () {
        Route::get('/audit-logs', [AuditLogController::class, 'index']);
    });

    // ─── Domain Wizard ────────────────────────────────────────
    Route::prefix('wizard')->group(function () {
        Route::post('/domain', [DomainWizardController::class, 'createDomain']);
        Route::get('/domain/{domain}/dns', [DomainWizardController::class, 'getDnsInstructions']);
        Route::post('/domain/{domain}/verify', [DomainWizardController::class, 'verifyDns']);
    });

    // ─── Mail Migration ───────────────────────────────────────
    Route::prefix('migrations')->group(function () {
        Route::get('/', [MailMigrationController::class, 'index']);
        Route::post('/', [MailMigrationController::class, 'store']);
        Route::get('/{mailMigration}', [MailMigrationController::class, 'show']);
        Route::post('/{mailMigration}/retry', [MailMigrationController::class, 'retry']);
        Route::post('/{mailMigration}/cancel', [MailMigrationController::class, 'cancel']);
    });

    // ─── WordPress ────────────────────────────────────────────
    Route::prefix('wordpress')->group(function () {
        Route::get('/{domain}/status', [WordPressController::class, 'status']);
        Route::post('/{domain}/install', [WordPressController::class, 'install']);
        Route::post('/{domain}/update-core', [WordPressController::class, 'updateCore']);
        Route::post('/{domain}/plugins/install', [WordPressController::class, 'installPlugin']);
        Route::post('/{domain}/plugins/deactivate', [WordPressController::class, 'deactivatePlugin']);
        Route::post('/{domain}/plugins/delete', [WordPressController::class, 'deletePlugin']);
        Route::post('/{domain}/plugins/update-all', [WordPressController::class, 'updatePlugins']);
        Route::post('/{domain}/reset-password', [WordPressController::class, 'resetPassword']);
        Route::post('/{domain}/maintenance', [WordPressController::class, 'maintenance']);
        Route::post('/{domain}/flush-cache', [WordPressController::class, 'flushCache']);
        Route::post('/{domain}/uninstall', [WordPressController::class, 'uninstall']);
    });

    // ─── Security ─────────────────────────────────────────────
    Route::prefix('security')->group(function () {
        // Mail security
        Route::get('/mail/{domain}', [SecurityController::class, 'mailStatus']);
        Route::post('/mail/{domain}/antispam/enable', [SecurityController::class, 'enableAntispam']);
        Route::post('/mail/{domain}/antispam/disable', [SecurityController::class, 'disableAntispam']);
        Route::post('/mail/{domain}/antivirus/enable', [SecurityController::class, 'enableAntivirus']);
        Route::post('/mail/{domain}/antivirus/disable', [SecurityController::class, 'disableAntivirus']);
        Route::post('/mail/{domain}/dkim/enable', [SecurityController::class, 'enableDkim']);
        Route::get('/mail/{domain}/dkim', [SecurityController::class, 'getDkimRecord']);
        Route::post('/mail/{domain}/spf', [SecurityController::class, 'configureSpf']);
        Route::post('/mail/{domain}/dmarc', [SecurityController::class, 'configureDmarc']);
        // Web security
        Route::post('/web/{domain}/force-https', [SecurityController::class, 'forceHttps']);
        Route::post('/web/{domain}/hsts', [SecurityController::class, 'enableHsts']);
        // Firewall (admin only)
        Route::middleware('role:super_admin')->group(function () {
            Route::post('/firewall/ban', [SecurityController::class, 'banIp']);
            Route::post('/firewall/unban', [SecurityController::class, 'unbanIp']);
            Route::get('/firewall/banned', [SecurityController::class, 'listBanned']);
        });
    });

    // ─── Apps (Node.js, Python, etc.) ─────────────────────────
    Route::prefix('apps')->group(function () {
        Route::get('/', [AppController::class, 'index']);
        Route::get('/runtimes', [AppController::class, 'runtimes']);
        Route::post('/', [AppController::class, 'store']);
        Route::get('/{app}', [AppController::class, 'show']);
        Route::patch('/{app}', [AppController::class, 'update']);
        Route::delete('/{app}', [AppController::class, 'destroy']);
        Route::post('/{app}/deploy', [AppController::class, 'deploy']);
        Route::post('/{app}/start', [AppController::class, 'start']);
        Route::post('/{app}/stop', [AppController::class, 'stop']);
        Route::post('/{app}/restart', [AppController::class, 'restart']);
        Route::get('/{app}/logs', [AppController::class, 'logs']);
    });

    // ─── Quotas (admin — overprovisioning) ────────────────────
    Route::middleware('role:super_admin')->prefix('quotas')->group(function () {
        Route::get('/', [QuotaController::class, 'index']);
        Route::get('/{hostingAccount}', [QuotaController::class, 'show']);
        Route::patch('/{hostingAccount}', [QuotaController::class, 'update']);
        Route::post('/{hostingAccount}/scale-up', [QuotaController::class, 'scaleUp']);
    });

    // ─── FTP ──────────────────────────────────────────────────
    Route::prefix('ftp')->group(function () {
        Route::get('/', [FtpController::class, 'index']);
        Route::post('/', [FtpController::class, 'store']);
        Route::post('/change-password', [FtpController::class, 'changePassword']);
        Route::delete('/', [FtpController::class, 'destroy']);
    });

    // ─── Temporary Domains ────────────────────────────────────
    Route::prefix('temp-domains')->group(function () {
        Route::get('/', [TempDomainController::class, 'index']);
        Route::post('/', [TempDomainController::class, 'store']);
        Route::post('/{domain}/connect', [TempDomainController::class, 'connect']);
        Route::middleware('role:super_admin')->group(function () {
            Route::post('/settings', [TempDomainController::class, 'updateSettings']);
        });
    });

    // ─── Databases ────────────────────────────────────────────
    Route::prefix('databases')->group(function () {
        Route::get('/', [DatabaseController::class, 'index']);
        Route::post('/', [DatabaseController::class, 'store']);
        Route::get('/{database}/stats', [DatabaseController::class, 'stats']);
        Route::patch('/{database}/connections', [DatabaseController::class, 'updateConnections']);
        Route::delete('/{database}', [DatabaseController::class, 'destroy']);
    });

    // ─── File Manager ─────────────────────────────────────────
    Route::prefix('files')->group(function () {
        Route::get('/', [FileManagerController::class, 'list']);
        Route::get('/read', [FileManagerController::class, 'read']);
        Route::post('/save', [FileManagerController::class, 'save']);
        Route::post('/create', [FileManagerController::class, 'create']);
        Route::post('/delete', [FileManagerController::class, 'delete']);
        Route::post('/rename', [FileManagerController::class, 'rename']);
    });

    // ─── PHP & Server Config ──────────────────────────────────
    Route::prefix('config')->group(function () {
        Route::get('/{domain}', [PhpConfigController::class, 'show']);
        Route::post('/{domain}/php-version', [PhpConfigController::class, 'changeVersion']);
        Route::patch('/{domain}/php-settings', [PhpConfigController::class, 'updateSettings']);
        Route::post('/{domain}/template', [PhpConfigController::class, 'changeTemplate']);
        Route::post('/{domain}/opcache', [PhpConfigController::class, 'toggleOpcache']);
    });
});
