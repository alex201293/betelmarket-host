<?php

namespace Database\Seeders;

use App\Models\Plan;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create Super Admin
        User::create([
            'name' => 'Admin',
            'email' => 'admin@betelmarket.com',
            'password' => 'password123',
            'role' => 'super_admin',
            'status' => 'active',
        ]);

        // Create Reseller
        User::create([
            'name' => 'Reseller Demo',
            'email' => 'reseller@betelmarket.com',
            'password' => 'password123',
            'role' => 'reseller',
            'status' => 'active',
        ]);

        // Create Client
        User::create([
            'name' => 'Client Demo',
            'email' => 'client@betelmarket.com',
            'password' => 'password123',
            'role' => 'client',
            'status' => 'active',
        ]);

        // Create Plans
        Plan::create([
            'name' => 'Starter',
            'max_domains' => 1,
            'max_subdomains' => 3,
            'max_mailboxes' => 5,
            'disk_quota_mb' => 5120, // 5GB
            'bandwidth_quota_mb' => 51200, // 50GB
            'max_databases' => 1,
            'price' => 4.99,
            'status' => 'active',
        ]);

        Plan::create([
            'name' => 'Business',
            'max_domains' => 10,
            'max_subdomains' => 30,
            'max_mailboxes' => 50,
            'disk_quota_mb' => 51200, // 50GB
            'bandwidth_quota_mb' => 512000, // 500GB
            'max_databases' => 10,
            'price' => 14.99,
            'status' => 'active',
        ]);

        Plan::create([
            'name' => 'Enterprise',
            'max_domains' => 100,
            'max_subdomains' => 300,
            'max_mailboxes' => 500,
            'disk_quota_mb' => 256000, // 250GB
            'bandwidth_quota_mb' => 2048000, // 2TB
            'max_databases' => 100,
            'price' => 49.99,
            'status' => 'active',
        ]);
    }
}
