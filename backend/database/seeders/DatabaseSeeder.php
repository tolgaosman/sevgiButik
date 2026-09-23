<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // No default: a real admin password has no business being in source
        // control. Local dev sets ADMIN_SEED_PASSWORD in .env; prod sets it
        // once at seed time and can drop it from .env afterward.
        User::updateOrCreate(
            ['email' => 'karabasaksevgi4@gmail.com'],
            [
                'name' => 'Sevgi Karabaşak',
                'phone' => '5000000000',
                'password' => bcrypt(env('ADMIN_SEED_PASSWORD') ?? Str::random(32)),
                'is_admin' => true,
            ],
        );

        $this->call([
            CategorySeeder::class,
            ProductSeeder::class,
        ]);
    }
}
