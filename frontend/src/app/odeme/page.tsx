"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Truck } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { apiMutate, ApiError } from "@/lib/api";
import { trackInitiateCheckout } from "@/lib/analytics";
import type { Order } from "@/lib/orders";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";

type FieldErrors = Record<string, string[]>;

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, isLoading, refresh } = useCart();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const checkoutTracked = useRef(false);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/hesabim");
    }
  }, [isAuthLoading, user, router]);

  useEffect(() => {
    if (checkoutTracked.current || isLoading || cart.items.length === 0) return;
    checkoutTracked.current = true;
    trackInitiateCheckout(
      cart.items.map((item) => ({ id: item.productId, name: item.name, price: item.unitPrice, quantity: item.quantity })),
      cart.total,
    );
  }, [isLoading, cart]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setFormError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      email: String(form.get("email")),
      phone: String(form.get("phone")),
      shipping_line1: String(form.get("shipping_line1")),
      shipping_line2: String(form.get("shipping_line2") || "") || undefined,
      shipping_district: String(form.get("shipping_district")),
      shipping_city: String(form.get("shipping_city")),
      shipping_postal: String(form.get("shipping_postal") || "") || undefined,
      customer_note: String(form.get("customer_note") || "") || undefined,
      payment_method: "cash_on_delivery" as const,
    };

    try {
      const order = await apiMutate<Order>("/orders", { method: "POST", body: JSON.stringify(payload) });
      try {
        sessionStorage.setItem("sevgi-butik:last-order", JSON.stringify(order));
      } catch {
        // sessionStorage unavailable (private mode, etc) — confirmation page falls back to a bare summary
      }
      await refresh();
      router.push(`/siparis/${order.orderNumber}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors ?? {});
        setFormError(err.errors ? null : err.message);
      } else {
        setFormError("Bir şeyler ters gitti. Lütfen tekrar deneyin.");
      }
      setLoading(false);
    }
  }

  if (isLoading || isAuthLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-3 h-10 w-40" />
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px] lg:gap-10">
          <div className="space-y-8">
            <div>
              <Skeleton className="h-6 w-40" />
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} className="h-11 w-full" />
                ))}
              </div>
            </div>
            <div>
              <Skeleton className="h-6 w-32" />
              <div className="mt-4 space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </div>
          <div className="h-fit border border-border p-6">
            <Skeleton className="h-5 w-32" />
            <div className="mt-4 space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
            <Skeleton className="mt-4 h-6 w-full" />
            <Skeleton className="mt-6 h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <Breadcrumbs items={[{ label: "Ödeme" }]} />
        <h1 className="mt-3 font-serif text-4xl font-medium text-ink sm:text-5xl">Sepetiniz boş</h1>
        <p className="mt-3 text-sm text-ink-soft">Ödeme yapmadan önce sepetinize ürün ekleyin.</p>
        <Button href="/" variant="solid" className="mt-6">
          Alışverişe Başla
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-cream/40 min-h-[70vh] py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: "Sepetim", href: "/sepet" }, { label: "Ödeme" }]} />
        <h1 className="mt-5 font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl lg:text-5xl">Ödeme</h1>

        <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px] lg:gap-10">
          <div className="space-y-8">
            <section className="rounded-3xl border border-border/70 bg-surface p-6 sm:p-8 shadow-sm">
              <h2 className="font-serif text-xl font-medium text-ink">Teslimat Bilgileri</h2>
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Input
                    id="email"
                    name="email"
                    label="E-posta (sipariş bildirimleri için)"
                    type="email"
                    defaultValue={user?.email || ""}
                    autoComplete="email"
                    inputFilter="email"
                    required
                    error={errors.email?.[0]}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    id="phone"
                    name="phone"
                    label="Telefon Numarası (kargo teslimatı için)"
                    type="tel"
                    defaultValue={user?.phone || ""}
                    placeholder="5XX XXX XX XX"
                    autoComplete="tel"
                    inputFilter="phone"
                    required
                    error={errors.phone?.[0]}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    id="shipping_line1"
                    name="shipping_line1"
                    label="Adres"
                    autoComplete="address-line1"
                    required
                    error={errors.shipping_line1?.[0]}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    id="shipping_line2"
                    name="shipping_line2"
                    label="Adres (devamı, opsiyonel)"
                    autoComplete="address-line2"
                  />
                </div>
                <Input
                  id="shipping_district"
                  name="shipping_district"
                  label="İlçe / Semt"
                  required
                  error={errors.shipping_district?.[0]}
                />
                <Input
                  id="shipping_city"
                  name="shipping_city"
                  label="Şehir"
                  autoComplete="address-level1"
                  required
                  error={errors.shipping_city?.[0]}
                />
                <Input id="shipping_postal" name="shipping_postal" label="Posta Kodu (opsiyonel)" inputFilter="numeric" />
              </div>
              <div className="mt-5">
                <label htmlFor="customer_note" className="mb-2 block text-sm font-medium text-ink-soft pl-1">
                  Sipariş Notu (opsiyonel)
                </label>
                <textarea
                  id="customer_note"
                  name="customer_note"
                  rows={3}
                  className="w-full rounded-2xl border border-border/80 bg-surface px-5 py-4 text-sm text-ink outline-none transition-all duration-300 focus:border-olive focus:ring-1 focus:ring-olive/30"
                />
              </div>
            </section>

            <section className="rounded-3xl border border-border/70 bg-surface p-6 sm:p-8 shadow-sm">
              <h2 className="font-serif text-xl font-medium text-ink">Ödeme Yöntemi</h2>
              <div className="mt-6 flex items-center gap-4 rounded-2xl border border-olive bg-olive/5 px-5 py-4 shadow-sm">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-olive shadow-sm">
                  <Truck className="size-4" strokeWidth={2.5} aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">Kapıda Ödeme</p>
                  <p className="mt-0.5 text-xs text-ink-soft">Siparişinizi teslim alırken ödeme yaparsınız.</p>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6 lg:sticky lg:top-28 lg:h-fit">
            <div className="rounded-3xl border border-border/70 bg-surface p-6 sm:p-7 shadow-sm">
              <h2 className="font-serif text-xl font-medium tracking-tight text-ink">
                Sipariş Özeti
              </h2>
              <div className="mt-6 max-h-64 space-y-4 overflow-y-auto pr-2 scrollbar-hide">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex justify-between gap-3 text-sm">
                    <div className="flex flex-col">
                      <span className="font-medium text-ink line-clamp-1">{item.name}</span>
                      <span className="text-xs text-ink-soft mt-0.5">
                        {item.size && `Beden: ${item.size} • `}Adet: {item.quantity}
                      </span>
                    </div>
                    <span className="shrink-0 font-semibold text-ink">{formatPrice(item.lineTotal)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-3 border-t border-border/60 pt-5 text-sm text-ink-soft">
                <div className="flex justify-between">
                  <span>Ara Toplam</span>
                  <span className="font-medium text-ink">{formatPrice(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kargo</span>
                  {cart.shipping === 0 ? (
                    <span className="font-medium text-olive">Ücretsiz</span>
                  ) : (
                    <span className="font-medium text-ink">{formatPrice(cart.shipping)}</span>
                  )}
                </div>
              </div>
              <div className="mt-5 flex items-baseline justify-between border-t border-border/60 pt-5 font-serif text-lg font-medium text-ink">
                <span>Toplam</span>
                <span className="text-2xl font-bold">{formatPrice(cart.total)}</span>
              </div>
              {formError && <p className="mt-4 text-xs font-medium text-red-500 bg-red-50 p-3 rounded-xl">{formError}</p>}
              <Button type="submit" variant="solid" className="mt-6 w-full rounded-2xl py-4 shadow-md shadow-olive/15" loading={loading}>
                Siparişi Tamamla
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
