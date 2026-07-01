<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MailAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'domain_id',
        'email',
        'quota_mb',
        'max_quota_mb',
        'usage_mb',
        'status',
        'password_hash',
    ];

    protected $hidden = [
        'password_hash',
    ];

    public function domain(): BelongsTo
    {
        return $this->belongsTo(Domain::class);
    }

    public function getUsagePercentage(): float
    {
        if ($this->quota_mb === 0) {
            return 0;
        }

        return round(($this->usage_mb / $this->quota_mb) * 100, 2);
    }

    /**
     * Check if this mailbox needs quota scaling (at 80%+).
     */
    public function needsQuotaScale(): bool
    {
        return $this->getUsagePercentage() >= 80;
    }

    /**
     * Scale up mailbox quota by 1GB if plan allows.
     * Returns true if scaled, false if at max.
     */
    public function scaleUpQuota(): bool
    {
        $maxAllowed = $this->max_quota_mb ?? 5120;
        $increment = 1024; // 1GB
        $newQuota = $this->quota_mb + $increment;

        if ($newQuota > $maxAllowed) {
            return false;
        }

        $this->update(['quota_mb' => $newQuota]);
        return true;
    }
}
