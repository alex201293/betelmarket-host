<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HostingAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'plan_id',
        'hestia_username',
        'status',
        'disk_used_mb',
        'disk_limit_mb',
        'real_disk_mb',
        'real_bandwidth_mb',
        'real_max_mailboxes',
        'real_max_domains',
        'real_mailbox_quota_mb',
        'auto_scale_enabled',
        'scale_threshold_percent',
        'scale_increment_mb',
        'scale_max_mb',
        'admin_notes',
        'extra_mailboxes',
        'extra_domains',
        'extra_disk_mb',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function domains(): HasMany
    {
        return $this->hasMany(Domain::class);
    }

    public function backups(): HasMany
    {
        return $this->hasMany(Backup::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function getDiskUsagePercentage(): float
    {
        if ($this->disk_limit_mb === 0) {
            return 0;
        }

        return round(($this->disk_used_mb / $this->disk_limit_mb) * 100, 2);
    }

    /**
     * Get real disk usage percentage (against actual Hestia quota).
     */
    public function getRealDiskUsagePercentage(): float
    {
        if ($this->real_disk_mb === 0) return 0;
        return round(($this->disk_used_mb / $this->real_disk_mb) * 100, 2);
    }

    /**
     * Check if this account needs scaling.
     */
    public function needsScaling(): bool
    {
        if (!$this->auto_scale_enabled) return false;
        return $this->getRealDiskUsagePercentage() >= $this->scale_threshold_percent;
    }

    /**
     * Scale up the real quota by one increment.
     */
    public function scaleUp(): bool
    {
        $maxAllowed = $this->scale_max_mb ?? $this->disk_limit_mb;
        $newQuota = $this->real_disk_mb + $this->scale_increment_mb;

        if ($newQuota > $maxAllowed) {
            return false; // Can't scale beyond plan limit
        }

        $this->update(['real_disk_mb' => $newQuota]);
        return true;
    }
}
