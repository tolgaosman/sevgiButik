@extends('emails.layout')

@section('title', 'Siparişiniz Teslim Edildi')
@section('recipient', $order->email)
@section('preheader')Bizi tercih ettiğiniz için teşekkür ederiz! Siparişiniz teslim edilmiştir.@endsection

@section('content')
<p style="margin:0 0 6px; font-size:12px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:#c7175a;">Teslimat Tamamlandı</p>
<h1 style="margin:0 0 6px; font-family:Georgia, 'Times New Roman', serif; font-size:24px; font-weight:600; color:#2b2422;">Bizi tercih ettiğiniz için çok teşekkür ederiz!</h1>
<p style="margin:0 0 28px; font-size:15px; line-height:1.6; color:#7a6b68;">
<strong style="color:#2b2422;">{{ $order->order_number }}</strong> numaralı siparişiniz başarıyla teslim edilmiştir. Ürünlerinizi güzel günlerde kullanmanızı dileriz. 
</p>

@include('emails.partials.status-steps', ['current' => 4])
@include('emails.partials.order-summary', ['order' => $order])

<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto; padding-top:20px;">
<tr>
<td style="border-radius:999px; background-color:#f53380;">
<a href="https://sevgibutik.com/siparis/{{ $order->order_number }}" style="display:inline-block; padding:13px 30px; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none;">Siparişi Değerlendir</a>
</td>
</tr>
</table>
@endsection
