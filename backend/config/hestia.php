<?php

return [
    /*
    |--------------------------------------------------------------------------
    | HestiaCP Server Configuration
    |--------------------------------------------------------------------------
    */

    'host' => env('HESTIA_HOST', '127.0.0.1'),

    'port' => env('HESTIA_PORT', 8083),

    'admin_user' => env('HESTIA_ADMIN_USER', 'admin'),

    'admin_password' => env('HESTIA_ADMIN_PASSWORD', ''),

    /*
    |--------------------------------------------------------------------------
    | API Mode
    |--------------------------------------------------------------------------
    | When true, uses HTTP API. When false, uses CLI (local exec).
    */

    'use_api' => env('HESTIA_USE_API', true),
];
