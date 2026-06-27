<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Domain extends Model
{
    use HasFactory;

    protected $fillable = [
        'hosting_account_id',
        'domain',
        'ssl_enabled',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'ssl_enabled' => 'boolean',
        ];
    }

    public function hostingAccount(): BelongsTo
    {
        return $this->belongsTo(HostingAccount::class);
    }

    public function mailAccounts(): HasMany
    {
        return $this->hasMany(MailAccount::class);
    }

    public function dnsRecords(): HasMany
    {
        return $this->hasMany(DnsRecord::class);
    }

    public function subdomains(): HasMany
    {
        return $this->hasMany(Subdomain::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
