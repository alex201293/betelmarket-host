<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Subdomain extends Model
{
    use HasFactory;

    protected $fillable = [
        'domain_id',
        'subdomain',
        'full_domain',
        'document_root',
        'ssl_enabled',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'ssl_enabled' => 'boolean',
        ];
    }

    public function domain(): BelongsTo
    {
        return $this->belongsTo(Domain::class);
    }
}
