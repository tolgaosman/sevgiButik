"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABELS, type Order } from "@/lib/orders";
import { getStoreSettings, type StoreSettings } from "@/lib/settings";
import { trackPurchase } from "@/lib/analytics";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { CheckCircle2, Mail, Landmark } from "lucide-react";

const STORAGE_KEY = "sevgi-butik:last-order";

const PAYMENT_METHOD_LABELS: Record<Order["paymentMethod"], string> = {
  cash_on_delivery: "Kapıda Ödeme",
};

export default function OrderConfirmationPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Paint instantly from the order the checkout just placed, if this is that tab.
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored: Order = JSON.parse(raw);
        if (stored.orderNumber === orderNumber) setOrder(stored);
      }
    } catch {
      // sessionStorage unavailable — the API fetch below still covers it
    }

    // Then always fetch the canonical record — covers a refresh, a shared
    // link, or the sessionStorage snapshot going stale after an admin edit.
    (async () => {
      try {
        const res = await fetch(`/api/orders/${orderNumber}`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (res.ok) {
          const fresh: Order = await res.json();
          if (!cancelled) setOrder(fresh);
          return;
        }
      } catch {
        // network error — fall through to whatever sessionStorage produced
      }
      if (!cancelled) setOrder((prev) => (prev === undefined ? null : prev));
    })();

    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  useEffect(() => {
    getStoreSettings().then(setSettings);
  }, []);

  // Fire Purchase/purchase exactly once per order — a refresh or a shared
  // link must not inflate ad-platform conversion counts.
  useEffect(() => {
    if (!order) return;
    const trackedKey = "sevgi-butik:purchase-tracked";
    try {
      const tracked: string[] = JSON.parse(localStorage.getItem(trackedKey) ?? "[]");
      if (tracked.includes(order.orderNumber)) return;
      trackPurchase(order);
      localStorage.setItem(trackedKey, JSON.stringify([...tracked, order.orderNumber]));
    } catch {
      trackPurchase(order);
    }
  }, [order]);

  if (order === undefined) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <Skeleton className="h-3 w-32" />
        <div className="mt-6 flex flex-col items-center text-center">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="mt-4 h-10 w-64" />
          <Skeleton className="mt-2 h-4 w-40" />
        </div>
        <div className="mt-10 divide-y divide-border border border-border">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="flex gap-4 p-4">
              <Skeleton className="h-20 w-16 shrink-0" />
              <div className="flex flex-1 flex-col justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="mt-4 h-14 w-full" />
      </div>
    );
  }

  if (order === null) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 text-center sm:px-6 sm:py-12 lg:px-8">
        <Breadcrumbs items={[{ label: "Sipariş Onayı" }]} />
        <h1 className="mt-6 font-serif text-3xl font-medium text-ink sm:text-4xl">
          Sipariş numaranız: {orderNumber}
        </h1>
        <p className="mt-3 text-sm text-ink-soft">
          Sipariş detaylarınızı hesabınızdaki siparişlerim bölümünden görüntüleyebilirsiniz.
        </p>
        <div className="mt-6 flex justify-center">
          <Button href="/hesabim" variant="solid">
            Hesabım
          </Button>
        </div>
      </div>
    );
  }


  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Breadcrumbs items={[{ label: "Sipariş Onayı" }]} />

      <div className="mt-6 flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-olive/10 text-olive">
          <CheckCircle2 size={32} strokeWidth={1.5} />
        </div>
        <h1 className="mt-4 font-serif text-4xl font-medium text-ink sm:text-5xl">Siparişiniz Alındı</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Sipariş numaranız: <span className="font-medium text-ink">{order.orderNumber}</span>
        </p>
        <p className="mt-1 text-xs text-ink-soft">Durum: {ORDER_STATUS_LABELS[order.status]}</p>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-soft">
          <Mail size={13} aria-hidden />
          Onay e-postası gönderildi.
        </p>
      </div>



      <div className="mt-10 divide-y divide-border border border-border">
        {order.items.map((item, i) => (
          <div key={i} className="flex gap-4 p-4">
            <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-sand">
              <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
            </div>
            <div className="flex flex-1 flex-col justify-between">
              <div>
                <p className="text-sm font-medium text-ink">{item.name}</p>
                {item.size && <p className="mt-0.5 text-xs text-ink-soft">Beden: {item.size}</p>}
                <p className="mt-0.5 text-xs text-ink-soft">Adet: {item.quantity}</p>
              </div>
              <p className="text-sm font-medium text-olive">{formatPrice(item.lineTotal)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-2 border border-border p-4 text-sm text-ink-soft">
        <div className="flex justify-between">
          <span>Ödeme Yöntemi</span>
          <span className="text-ink">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</span>
        </div>
        <div className="flex justify-between">
          <span>Teslimat Adresi</span>
          <span className="max-w-[65%] text-right text-ink">
            {order.shippingAddress.line1}, {order.shippingAddress.district} / {order.shippingAddress.city}
          </span>
        </div>
      </div>

      <div className="mt-4 flex justify-between border border-border p-4 font-serif text-lg font-medium text-ink">
        <span>Toplam</span>
        <span>{formatPrice(order.total)}</span>
      </div>

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Button href="/hesabim" variant="outline">
          Siparişlerim
        </Button>
        <Button href="/" variant="solid">
          Alışverişe Devam Et
        </Button>
      </div>
    </div>
  );
}
