<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('apps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('domain_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name'); // My Node App
            $table->string('runtime'); // nodejs_20, python_312, ruby_33, go_122
            $table->string('entry_point')->default('index.js'); // main file or start command
            $table->integer('port'); // internal port assigned
            $table->string('git_repo')->nullable(); // https://github.com/user/repo.git
            $table->string('git_branch')->default('main');
            $table->string('deploy_path')->nullable(); // /home/user/apps/appname
            $table->json('env_vars')->nullable(); // {"NODE_ENV": "production", "PORT": "3001"}
            $table->string('start_command')->nullable(); // npm start, python app.py
            $table->string('build_command')->nullable(); // npm run build, pip install -r requirements.txt
            $table->string('install_command')->nullable(); // npm install, pip install -r requirements.txt
            $table->enum('status', ['stopped', 'running', 'deploying', 'error', 'pending'])->default('pending');
            $table->text('last_deploy_log')->nullable();
            $table->timestamp('last_deployed_at')->nullable();
            $table->timestamps();

            $table->unique('port'); // Each app gets a unique port
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('apps');
    }
};
