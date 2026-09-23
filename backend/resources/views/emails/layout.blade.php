@php($store = \App\Support\StoreSettings::all())
<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>@yield('title', 'Sevgi Butik')</title>
<style>
:root {
  color-scheme: light;
  supported-color-schemes: light;
}
@media only screen and (max-width: 480px) {
  .stack-col { display:block !important; width:100% !important; box-sizing:border-box; }
}
/* Force email clients like Gmail to not invert our colors */
.body, table, td, h1, h2, p, a, span {
  color: inherit !important;
}
</style>
</head>
<body class="body" style='margin:0; padding:0; background-color:#fdf4f7; background-image:url("data:image/svg+xml,%3Csvg width=\'80\' height=\'80\' viewBox=\'0 0 80 80\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M40 40c0-11.046 8.954-20 20-20s20 8.954 20 20-8.954 20-20 20-20-8.954-20-20zm0 0c0 11.046-8.954 20-20 20S0 51.046 0 40s8.954-20 20-20 20 8.954 20 20zm0 0c11.046 0 20-8.954 20-20S51.046 0 40 0s-20 8.954-20 20 8.954 20 20 20zm0 0c-11.046 0-20 8.954-20 20s8.954 20 20 20 20-8.954 20-20-8.954-20-20-20z\' stroke=\'%23c7175a\' stroke-width=\'1\' fill=\'none\' opacity=\'0.10\'/%3E%3C/svg%3E"); background-size:80px 80px; font-family:"Raleway", Helvetica, Arial, sans-serif; color:#2b2422 !important;'>
@hasSection('preheader')
<div style="display:none; max-height:0; max-width:0; overflow:hidden; opacity:0; mso-hide:all;">
@yield('preheader')
&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
</div>
@endif
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style='background-color:#fdf4f7; background-image:url("data:image/svg+xml,%3Csvg width=\'80\' height=\'80\' viewBox=\'0 0 80 80\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M40 40c0-11.046 8.954-20 20-20s20 8.954 20 20-8.954 20-20 20-20-8.954-20-20zm0 0c0 11.046-8.954 20-20 20S0 51.046 0 40s8.954-20 20-20 20 8.954 20 20zm0 0c11.046 0 20-8.954 20-20S51.046 0 40 0s-20 8.954-20 20 8.954 20 20 20zm0 0c-11.046 0-20 8.954-20 20s8.954 20 20 20 20-8.954 20-20-8.954-20-20-20z\' stroke=\'%23c7175a\' stroke-width=\'1\' fill=\'none\' opacity=\'0.10\'/%3E%3C/svg%3E"); background-size:80px 80px;'>
<tr>
<td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
<tr>
<td align="center" style="padding-bottom:28px;">
<img src="{{ rtrim(config('app.url'), '/') }}/sevgiLogo-ink.png" alt="{{ $store['store_name'] }}" width="132" style="display:block; width:132px; height:auto;">
</td>
</tr>
<tr>
<td style="background-color:#ffffff !important; border:1px solid #ecdfe4; border-radius:20px; padding:40px 36px; box-shadow:0 4px 6px rgba(0,0,0,0.02);">
@yield('content')
</td>
</tr>
<tr>
<td align="center" style="padding-top:32px;">
<p style="margin:0; font-size:13px; font-weight:600; color:#2b2422;">{{ $store['store_name'] }}</p>
<p style="margin:4px 0 0; font-size:12px; line-height:1.6; color:#7a6b68;">{{ $store['store_address'] }}</p>
<p style="margin:10px 0 0; font-size:12px; line-height:1.8;">
<a href="tel:{{ preg_replace('/\s+/', '', $store['store_phone']) }}" style="color:#c7175a; text-decoration:none;">{{ $store['store_phone'] }}</a>
<span style="color:#ecdfe4;">&nbsp;&middot;&nbsp;</span>
<a href="mailto:{{ $store['store_email'] }}" style="color:#c7175a; text-decoration:none;">{{ $store['store_email'] }}</a>
</p>
<p style="margin:10px 0 0; font-size:12px;">
<a href="https://sevgibutik.com" style="color:#7a6b68; text-decoration:none;">sevgibutik.com</a>
@if($store['store_instagram'])
<span style="color:#ecdfe4;">&nbsp;&middot;&nbsp;</span>
<a href="{{ $store['store_instagram'] }}" style="color:#7a6b68; text-decoration:none;">Instagram</a>
@endif
</p>
@hasSection('recipient')
<p style="margin:20px 0 0; font-size:11px; color:#a89792;">Bu e-posta @yield('recipient') adresine g&ouml;nderildi.</p>
@endif
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>
