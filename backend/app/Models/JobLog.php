<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobLog extends Model
{
    use HasFactory;

    protected $table = 'jobs_log';

    protected $fillable = [
        'job_type',
        'payload',
        'status',
        'output',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
        ];
    }
}
