<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'order_number', 'user_id', 'email', 'phone', 'status', 'payment_method', 'payment_status',
    'subtotal_minor', 'shipping_minor', 'discount_minor', 'total_minor', 'currency',
    'shipping_name', 'shipping_phone', 'shipping_line1', 'shipping_line2',
    'shipping_district', 'shipping_city', 'shipping_postal', 'shipping_country',
    'customer_note', 'admin_note', 'tracking_number', 'shipped_at', 'delivered_at',
])]
class Order extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'subtotal_minor' => 'integer',
            'shipping_minor' => 'integer',
            'discount_minor' => 'integer',
            'total_minor' => 'integer',
            'shipped_at' => 'datetime',
            'delivered_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Random, non-sequential order numbers ("SB-48213") — order tracking
     * only asks for this number, so a guessable/sequential one would let
     * anyone enumerate other customers' orders. Starts at 5 digits and
     * only grows once that space gets crowded, so numbers stay short for
     * as long as possible. Retries on the rare unique-constraint collision.
     */
    public function assignOrderNumber(): void
    {
        for ($attempt = 0; $attempt < 10; $attempt++) {
            $this->order_number = static::generateOrderNumber();
            try {
                $this->saveQuietly();

                return;
            } catch (\Illuminate\Database\QueryException $e) {
                if ($attempt === 9) {
                    throw $e;
                }
            }
        }
    }

    private static function generateOrderNumber(): string
    {
        $digits = 5;

        while (true) {
            $min = (int) (10 ** ($digits - 1));
            $max = (int) (10 ** $digits) - 1;

            for ($attempt = 0; $attempt < 20; $attempt++) {
                $candidate = 'SB-'.random_int($min, $max);
                if (! static::where('order_number', $candidate)->exists()) {
                    return $candidate;
                }
            }

            $digits++;
        }
    }
}
