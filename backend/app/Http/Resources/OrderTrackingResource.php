<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Reduced view for guest order tracking. The order number is the only
 * thing the caller had to know to pass the lookup, so this must never
 * leak the address or phone.
 */
class OrderTrackingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'orderNumber' => $this->order_number,
            'status' => $this->status,
            'trackingNumber' => $this->tracking_number,
            'shippedAt' => $this->shipped_at?->toIso8601String(),
            'deliveredAt' => $this->delivered_at?->toIso8601String(),
            'createdAt' => $this->created_at->toIso8601String(),
            'total' => $this->total_minor / 100,
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($item) => [
                'name' => $item->product_name,
                'image' => $item->product_image,
                'size' => $item->size,
                'quantity' => $item->quantity,
                'lineTotal' => $item->line_total_minor / 100,
            ])),
        ];
    }
}
