@extends('emails.layout')

@section('title', 'Sevgi Butik\'e Hoş Geldiniz')
@section('recipient', $user->email)
@section('preheader')Aramıza katıldığınız için teşekkür ederiz. Hesabınız başarıyla oluşturuldu.@endsection

@section('content')
<p style="margin:0 0 6px; font-size:12px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:#c7175a;">Hesap Oluşturuldu</p>
<h1 style="margin:0 0 6px; font-family:Georgia, 'Times New Roman', serif; font-size:24px; font-weight:600; color:#2b2422;">Hoş Geldiniz, {{ $user->name }}!</h1>
<p style="margin:0 0 28px; font-size:15px; line-height:1.6; color:#7a6b68;">
Aramıza katıldığınız için çok mutluyuz. Sevgi Butik dünyasında size özel ürünleri keşfedebilir, siparişlerinizi kolayca takip edebilirsiniz.
</p>

<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
<tr>
<td style="border-radius:999px; background-color:#f53380;">
<a href="https://sevgibutik.com/" style="display:inline-block; padding:13px 30px; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none;">Alışverişe Başla</a>
</td>
</tr>
</table>
@endsection
