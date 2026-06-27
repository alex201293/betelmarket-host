<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;

class Database extends Model
{
    protected $fillable = [
        'hosting_account_id',
        'db_name',
        'db_user',
        'db_password_encrypted',
        'db_type',
        'size_mb',
        'max_connections',
        'status',
    ];

    protected $hidden = ['db_password_encrypted'];

    public function hostingAccount(): BelongsTo
    {
        return $this->belongsTo(HostingAccount::class);
    }

    public function getPasswordAttribute(): string
    {
        return Crypt::decryptString($this->db_password_encrypted);
    }
}
