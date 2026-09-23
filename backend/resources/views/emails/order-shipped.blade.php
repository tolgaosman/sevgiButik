@extends('emails.layout')

@section('title', 'Siparişiniz Kargoya Verildi')
@section('recipient', $order->email)
@section('preheader'){{ $order->order_number }} numaralı siparişiniz yola çıktı@if($order->tracking_number) · Takip: {{ $order->tracking_number }}@endif@endsection

@section('content')
<p style="margin:0 0 6px; font-size:12px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:#c7175a;">Kargo Bildirimi</p>
<h1 style="margin:0 0 6px; font-family:Georgia, 'Times New Roman', serif; font-size:24px; font-weight:600; color:#2b2422;">Siparişiniz yola çıktı!</h1>
<p style="margin:0 0 28px; font-size:15px; line-height:1.6; color:#7a6b68;">
<strong style="color:#2b2422;">{{ $order->order_number }}</strong> numaralı siparişiniz kargoya verildi.
</p>

@include('emails.partials.status-steps', ['current' => 3])

@if($order->tracking_number)
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdf4f7; border-radius:14px; margin-bottom:28px;">
<tr>
<td style="padding:20px 24px;">
<p style="margin:0 0 4px; font-size:11px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:#7a6b68;">Kargo Takip No</p>
<p style="margin:0; font-size:18px; font-weight:600; letter-spacing:.04em; color:#2b2422;">{{ $order->tracking_number }}</p>
</td>
</tr>
</table>
@else
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdf4f7; border-radius:14px; margin-bottom:28px;">
<tr>
<td style="padding:20px 24px;">
<p style="margin:0; font-size:13px; line-height:1.5; color:#7a6b68;">Takip numarası hazır olduğunda size ayrıca bildireceğiz.</p>
</td>
</tr>
</table>
@endif

@include('emails.partials.order-summary', ['order' => $order])
@include('emails.partials.order-meta', ['order' => $order])

<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
<tr>
<td style="border-radius:999px; background-color:#f53380;">
<a href="https://sevgibutik.com/siparis/{{ $order->order_number }}" style="display:inline-block; padding:13px 30px; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none;">Siparişimi Görüntüle</a>
</td>
</tr>
</table>
@endsection
