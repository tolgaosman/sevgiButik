<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'karabasaksevgi4@gmail.com'],
            [
                'name' => 'Sevgi Karabaşak',
                'phone' => '5000000000',
                'password' => bcrypt('sevgibutik2002'),
                'is_admin' => true,
            ],
        );

        $this->call([
            CategorySeeder::class,
            ProductSeeder::class,
        ]);
    }
}
