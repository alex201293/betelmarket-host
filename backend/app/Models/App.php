<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class App extends Model
{
    use HasFactory;

    protected $fillable = [
        'domain_id',
        'user_id',
        'name',
        'runtime',
        'entry_point',
        'port',
        'git_repo',
        'git_branch',
        'deploy_path',
        'env_vars',
        'start_command',
        'build_command',
        'install_command',
        'status',
        'last_deploy_log',
        'last_deployed_at',
        'deploy_secret',
        'auto_deploy',
        'deploy_history',
    ];

    protected function casts(): array
    {
        return [
            'env_vars' => 'array',
            'deploy_history' => 'array',
            'last_deployed_at' => 'datetime',
            'auto_deploy' => 'boolean',
        ];
    }

    public function domain(): BelongsTo
    {
        return $this->belongsTo(Domain::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isRunning(): bool
    {
        return $this->status === 'running';
    }

    /**
     * Get the full URL for this app.
     */
    public function getUrl(): string
    {
        return "https://{$this->domain->domain}";
    }

    /**
     * Available runtimes.
     */
    public static function runtimes(): array
    {
        return [
            'nodejs_18' => ['name' => 'Node.js 18 LTS', 'binary' => '/usr/bin/node', 'install' => 'npm install', 'start' => 'node'],
            'nodejs_20' => ['name' => 'Node.js 20 LTS', 'binary' => '/usr/bin/node', 'install' => 'npm install', 'start' => 'node'],
            'nodejs_22' => ['name' => 'Node.js 22', 'binary' => '/usr/bin/node', 'install' => 'npm install', 'start' => 'node'],
            'python_311' => ['name' => 'Python 3.11', 'binary' => '/usr/bin/python3.11', 'install' => 'pip install -r requirements.txt', 'start' => 'python3.11'],
            'python_312' => ['name' => 'Python 3.12', 'binary' => '/usr/bin/python3.12', 'install' => 'pip install -r requirements.txt', 'start' => 'python3.12'],
            'ruby_33' => ['name' => 'Ruby 3.3', 'binary' => '/usr/bin/ruby', 'install' => 'bundle install', 'start' => 'ruby'],
            'go_122' => ['name' => 'Go 1.22', 'binary' => '/usr/local/go/bin/go', 'install' => 'go mod download', 'start' => 'go run'],
            'bun_1' => ['name' => 'Bun 1.x', 'binary' => '/usr/local/bin/bun', 'install' => 'bun install', 'start' => 'bun run'],
            'deno_1' => ['name' => 'Deno 1.x', 'binary' => '/usr/local/bin/deno', 'install' => '', 'start' => 'deno run --allow-all'],
        ];
    }
}
