<?php

namespace App\Mail;

use App\Models\Order;
use App\Support\StoreSettings;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderDelivered extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Siparişiniz Teslim Edildi — {$this->order->order_number}",
            replyTo: [StoreSettings::all()['store_email']],
        );
    }

    public function content(): Content
    {
        $this->order->loadMissing('items');

        return new Content(
            view: 'emails.order-delivered',
            with: ['order' => $this->order],
        );
    }
}
