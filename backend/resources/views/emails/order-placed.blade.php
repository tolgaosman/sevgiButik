@extends('emails.layout')

@section('title', 'Siparişiniz Alındı')
@section('recipient', $order->email)
@section('preheader'){{ $order->order_number }} · {{ $order->items->sum('quantity') }} ürün · {{ \App\Support\Money::tl($order->total_minor) }}@endsection

@section('content')
<p style="margin:0 0 6px; font-size:12px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:#c7175a;">Sipariş Onayı</p>
<h1 style="margin:0 0 6px; font-family:Georgia, 'Times New Roman', serif; font-size:24px; font-weight:600; color:#2b2422;">Teşekkürler!</h1>
<p style="margin:0 0 28px; font-size:15px; line-height:1.6; color:#7a6b68;">
<strong style="color:#2b2422;">{{ $order->order_number }}</strong> numaralı siparişiniz alındı ve hazırlanmaya başlayacak. Her adımda size haber vereceğiz.
</p>

@include('emails.partials.status-steps', ['current' => 1])
@include('emails.partials.order-summary', ['order' => $order])
@include('emails.partials.order-meta', ['order' => $order])

<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
<tr>
<td style="border-radius:999px; background-color:#f53380;">
<a href="https://sevgibutik.com/siparis/{{ $order->order_number }}" style="display:inline-block; padding:13px 30px; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none;">Siparişimi Görüntüle</a>
</td>
</tr>
</table>
<p style="margin:16px 0 0; text-align:center; font-size:12px;">
<a href="https://sevgibutik.com/siparis-takibi" style="color:#7a6b68; text-decoration:underline;">Siparişimi takip et</a>
</p>
@endsection
