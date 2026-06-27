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
}
