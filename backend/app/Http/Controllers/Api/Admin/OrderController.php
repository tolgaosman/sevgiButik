<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(private readonly OrderService $orders) {}

    /**
     * Raw DB enum values go over the wire now — Türkçe etiketler
     * (ORDER_STATUS_LABELS) live in exactly one place, the frontend, instead
     * of being round-tripped through a lossy label here and reverse-mapped
     * in updateStatus() (that reverse map had no "refunded" branch, so
     * setting it always silently fell through to "pending").
     */
    public function index(Request $request)
    {
        $orders = Order::with(['user', 'items'])->orderBy('created_at', 'desc')->get();

        $formattedOrders = $orders->map(fn (Order $order) => $this->format($order));

        return response()->json($formattedOrders);
    }

    public function update(Request $request, string $orderNumber)
    {
        $order = Order::where('order_number', $orderNumber)->firstOrFail();

        $validated = $request->validate([
            'status' => 'sometimes|in:pending,confirmed,shipped,delivered,cancelled,refunded',
            'tracking_number' => 'sometimes|nullable|string|max:64',
            'payment_status' => 'sometimes|in:unpaid,paid,refunded',
            'admin_note' => 'sometimes|nullable|string|max:2000',
        ]);

        $updated = $this->orders->updateByAdmin($order, $validated);

        return response()->json($this->format($updated));
    }

    private function format(Order $order): array
    {
        return [
            'id' => $order->order_number,
            'orderNumber' => $order->order_number,
            'customer' => $order->shipping_name ?? ($order->user ? $order->user->name : 'Misafir'),
            'email' => $order->email,
            'phone' => $order->phone,
            'date' => $order->created_at ? $order->created_at->format('d M Y, H:i') : '-',
            'createdAt' => $order->created_at?->toIso8601String(),
            'status' => $order->status,
            'paymentMethod' => $order->payment_method,
            'paymentStatus' => $order->payment_status,
            'trackingNumber' => $order->tracking_number,
            'shippedAt' => $order->shipped_at?->toIso8601String(),
            'deliveredAt' => $order->delivered_at?->toIso8601String(),
            'customerNote' => $order->customer_note,
            'adminNote' => $order->admin_note,
            'shippingAddress' => [
                'name' => $order->shipping_name,
                'phone' => $order->shipping_phone,
                'line1' => $order->shipping_line1,
                'line2' => $order->shipping_line2,
                'district' => $order->shipping_district,
                'city' => $order->shipping_city,
                'postalCode' => $order->shipping_postal,
            ],
            'subtotal' => $order->subtotal_minor / 100,
            'shipping' => $order->shipping_minor / 100,
            'discount' => $order->discount_minor / 100,
            'total' => '₺' . number_format($order->total_minor / 100, 2, ',', '.'),
            'totalValue' => $order->total_minor / 100,
            'items' => $order->items->sum('quantity'),
            'lineItems' => $order->items->map(fn ($item) => [
                'name' => $item->product_name,
                'slug' => $item->product_slug,
                'image' => $item->product_image,
                'size' => $item->size,
                'quantity' => $item->quantity,
                'unitPrice' => $item->unit_price_minor / 100,
                'lineTotal' => $item->line_total_minor / 100,
            ]),
        ];
    }
}
