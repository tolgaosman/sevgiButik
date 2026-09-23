"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Package, Truck } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MotionReveal } from "@/components/ui/MotionReveal";
import { MotifBackground } from "@/components/ui/MotifBackground";
import { TrustBar } from "@/components/sections/TrustBar";
import { apiMutate, ApiError } from "@/lib/api";

type TrackingOrder = {
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  trackingNumber: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  items: Array<{
    productSlug: string;
    name: string;
    image: string;
    size: string | null;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
};

const statusLabels: Record<string, string> = {
  pending: "Bekliyor",
  confirmed: "Onaylandı",
  shipped: "Kargoya Verildi",
  delivered: "Teslim Edildi",
  cancelled: "İptal Edildi",
};

function statusDotClass(status: string) {
  return status === "cancelled"
    ? "bg-ink-soft/40"
    : status === "delivered"
      ? "bg-olive"
      : status === "shipped"
        ? "bg-olive/50"
        : "bg-gold";
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-cream px-3 py-1 text-xs font-medium text-ink">
      <span className={`h-1.5 w-1.5 rounded-full ${statusDotClass(status)}`} />
      {statusLabels[status] || status}
    </span>
  );
}

export default function OrderTrackingPage() {
  const [order, setOrder] = useState<TrackingOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});
    setOrder(null);

    const form = new FormData(e.currentTarget);
    const orderNumber = String(form.get("order_number")).trim();

    try {
      const data = await apiMutate<{ data: TrackingOrder }>("/orders/track", {
        method: "POST",
        body: JSON.stringify({ order_number: orderNumber }),
      });
      setOrder(data.data);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errors) {
          setFieldErrors(err.errors);
        } else {
          setError(err.message);
        }
      } else {
        setError("Sipariş sorgulanırken beklenmedik bir hata oluştu.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative overflow-hidden bg-cream pb-12 pt-[calc(2rem+6rem)] -mt-[6rem] min-h-[70vh]">
      <MotifBackground mask="linear-gradient(to bottom, black 0%, transparent 100%)" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative z-10">
        <Breadcrumbs items={[{ label: "Sipariş Takibi" }]} />

        <div className="mt-4 border-b border-border/70 pb-6">
          <h1 className="font-serif text-3xl font-medium tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Sipariş Takibi
          </h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            Sipariş durumunuzu öğrenmek için bilgilerinizi giriniz.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-xl">
          {order ? (
            <MotionReveal>
              <div className="overflow-hidden rounded-3xl border border-border/70 bg-surface shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 p-6 sm:p-8">
                  <div>
                    <h2 className="font-serif text-2xl font-medium text-ink">#{order.orderNumber}</h2>
                    <p className="mt-1 text-sm text-ink-soft">
                      {new Date(order.createdAt).toLocaleDateString("tr-TR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <div className="p-6 sm:p-8">
                  {order.trackingNumber && (
                    <div className="flex items-center gap-3 rounded-2xl bg-cream p-4">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface text-olive">
                        <Truck size={16} strokeWidth={1.75} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink">Kargo Takip Numarası</p>
                        <p className="text-sm text-ink-soft">{order.trackingNumber}</p>
                      </div>
                    </div>
                  )}

                  <div className={`space-y-4 divide-y divide-border/60 ${order.trackingNumber ? "mt-6" : ""}`}>
                    {order.items.map((item, idx) => (
                      <div key={idx} className={`flex items-center gap-4 ${idx > 0 ? "pt-4" : ""}`}>
                        <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-cream">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="48px"
                            className="object-cover object-center"
                          />
                        </div>
                        <div className="flex flex-1 flex-col">
                          <span className="text-sm font-medium text-ink">{item.name}</span>
                          {item.size && <span className="text-xs text-ink-soft">Beden: {item.size}</span>}
                          <span className="text-xs text-ink-soft">Adet: {item.quantity}</span>
                        </div>
                        <div className="text-sm font-medium text-ink">
                          ₺{item.lineTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 space-y-2 border-t border-border/60 pt-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-ink-soft">Ara Toplam</span>
                      <span className="text-ink">₺{order.subtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-soft">Kargo</span>
                      <span className="text-ink">
                        {order.shipping === 0
                          ? "Ücretsiz"
                          : `₺${order.shipping.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`}
                      </span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-olive">
                        <span>İndirim</span>
                        <span>-₺{order.discount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 text-base font-medium text-ink">
                      <span>Toplam</span>
                      <span>₺{order.total.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOrder(null)}
                    className="mt-6 text-xs font-medium text-ink-soft underline underline-offset-4 decoration-ink/30 transition-colors duration-200 hover:text-olive hover:decoration-olive"
                  >
                    Başka bir sipariş sorgula
                  </button>
                </div>
              </div>
            </MotionReveal>
          ) : (
            <MotionReveal>
              <div className="rounded-3xl border border-border/70 bg-surface p-6 shadow-sm sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sand text-olive">
                    <Package size={18} strokeWidth={1.75} />
                  </div>
                  <h2 className="font-serif text-xl font-medium text-ink">Sipariş Bilgileri</h2>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <Input
                    id="order_number"
                    name="order_number"
                    label="Sipariş Numarası"
                    placeholder="Örn: SB-48213"
                    required
                    error={fieldErrors.order_number?.[0]}
                  />

                  {error && <p className="text-xs text-red-500">{error}</p>}

                  <Button type="submit" variant="solid" className="w-full" loading={loading}>
                    Siparişi Sorgula
                  </Button>
                </form>
              </div>
            </MotionReveal>
          )}
        </div>

        <p className="mx-auto mt-6 max-w-xl text-center text-xs text-ink-soft">
          Sipariş numaranızı bulamıyor musunuz? Onay e-postanızda yer alır.{" "}
          <Link href="/iletisim" className="font-medium text-olive hover:underline">
            Bize ulaşın
          </Link>
          .
        </p>
      </div>

      <TrustBar />
    </div>
  );
}
