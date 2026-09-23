@extends('emails.layout')

@section('title', 'Siparişiniz Onaylandı')
@section('recipient', $order->email)
@section('preheader'){{ $order->order_number }} numaralı siparişiniz onaylandı ve hazırlanıyor.@endsection

@section('content')
<p style="margin:0 0 6px; font-size:12px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:#c7175a;">Sipariş Onayı</p>
<h1 style="margin:0 0 6px; font-family:Georgia, 'Times New Roman', serif; font-size:24px; font-weight:600; color:#2b2422;">Siparişiniz onaylandı!</h1>
<p style="margin:0 0 28px; font-size:15px; line-height:1.6; color:#7a6b68;">
<strong style="color:#2b2422;">{{ $order->order_number }}</strong> numaralı siparişiniz onaylandı ve hazırlanıyor. Kargoya verildiğinde ayrıca haberdar edileceksiniz.
</p>

@include('emails.partials.status-steps', ['current' => 2])
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
