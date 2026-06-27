<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;

class MailMigration extends Model
{
    protected $fillable = [
        'user_id',
        'domain_id',
        'source_host',
        'source_port',
        'source_email',
        'source_password_encrypted',
        'destination_email',
        'status',
        'messages_migrated',
        'messages_total',
        'error_log',
        'started_at',
        'completed_at',
    ];

    protected $hidden = [
        'source_password_encrypted',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function domain(): BelongsTo
    {
        return $this->belongsTo(Domain::class);
    }

    public function setSourcePasswordAttribute(string $value): void
    {
        $this->attributes['source_password_encrypted'] = Crypt::encryptString($value);
    }

    public function getSourcePasswordAttribute(): string
    {
        return Crypt::decryptString($this->attributes['source_password_encrypted']);
    }

    public function getProgressPercentage(): float
    {
        if ($this->messages_total === 0) return 0;
        return round(($this->messages_migrated / $this->messages_total) * 100, 1);
    }
}
