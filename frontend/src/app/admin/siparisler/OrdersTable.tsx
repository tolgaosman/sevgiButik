"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";
import { apiMutate, ApiError } from "@/lib/api";
import { revalidateStore } from "../actions";
import { toast } from "@/lib/toast";
import { ORDER_STATUS_LABELS } from "@/lib/orders";
import type { AdminOrder, AdminOrderStatus, AdminPaymentStatus } from "@/lib/admin";

const STATUS_OPTIONS: AdminOrderStatus[] = ["pending", "confirmed", "shipped", "delivered", "cancelled", "refunded"];
const PAYMENT_STATUS_LABELS: Record<AdminPaymentStatus, string> = {
  unpaid: "Ödenmedi",
  paid: "Ödendi",
  refunded: "İade Edildi",
};
const PAYMENT_METHOD_LABELS: Record<AdminOrder["paymentMethod"], string> = {
  cash_on_delivery: "Kapıda Ödeme",
};

function statusDotClass(status: AdminOrderStatus) {
  switch (status) {
    case "shipped":
      return "bg-olive/50";
    case "delivered":
      return "bg-olive";
    case "cancelled":
    case "refunded":
      return "bg-ink-soft/40";
    default:
      return "bg-gold";
  }
}

function StatusBadge({ status }: { status: AdminOrderStatus }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-ink-soft">
      <span className={`h-1.5 w-1.5 rounded-full ${statusDotClass(status)}`} />
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

function formatMoney(value: number) {
  return "₺" + value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function OrdersTable({ orders: initialOrders }: { orders: AdminOrder[] }) {
  const [orders, setOrders] = useState<AdminOrder[]>(initialOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<AdminOrderStatus | "all">("all");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [statusInput, setStatusInput] = useState<AdminOrderStatus>("pending");
  const [paymentStatusInput, setPaymentStatusInput] = useState<AdminPaymentStatus>("unpaid");
  const [trackingInput, setTrackingInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [saving, setSaving] = useState(false);

  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return orders.filter((o) => {
      const matchesTerm = !term || o.customer.toLowerCase().includes(term) || o.id.toLowerCase().includes(term);
      const matchesStatus = statusFilter === "all" || o.status === statusFilter;
      return matchesTerm && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const handleOpen = (order: AdminOrder) => {
    setSelectedOrder(order);
    setStatusInput(order.status);
    setPaymentStatusInput(order.paymentStatus);
    setTrackingInput(order.trackingNumber ?? "");
    setNoteInput(order.adminNote ?? "");
  };

  const handleSave = async () => {
    if (!selectedOrder) return;
    setSaving(true);

    try {
      const updated = await apiMutate<AdminOrder>(`/admin/orders/${selectedOrder.orderNumber}`, {
        method: "PUT",
        body: JSON.stringify({
          status: statusInput,
          payment_status: paymentStatusInput,
          tracking_number: trackingInput || null,
          admin_note: noteInput || null,
        }),
      });

      await revalidateStore();

      setOrders((prev) => prev.map((o) => (o.orderNumber === updated.orderNumber ? updated : o)));
      setSelectedOrder(null);
      toast.success("Sipariş güncellendi", { description: `${updated.orderNumber} kaydedildi.` });
    } catch (e) {
      toast.error("Sipariş güncellenemedi", {
        description: e instanceof ApiError ? e.message : "Lütfen tekrar deneyin.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-medium text-ink">Siparişler</h1>
        <p className="mt-1 text-sm text-ink-soft">Tüm müşteri siparişlerini yönetin ve takip edin.</p>
      </div>

      <div className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-surface p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            type="text"
            placeholder="Sipariş no veya müşteri ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-border/80 bg-cream/50 py-2.5 pl-11 pr-4 text-sm transition-all focus:border-olive focus:bg-white focus:outline-none focus:ring-1 focus:ring-olive/30"
          />
        </div>
        <Dropdown
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as AdminOrderStatus | "all")}
          options={[{ value: "all", label: "Tüm Durumlar" }, ...STATUS_OPTIONS.map((s) => ({ value: s, label: ORDER_STATUS_LABELS[s] }))]}
          aria-label="Duruma göre filtrele"
          className="rounded-2xl border border-border/80 bg-cream/50 px-4 py-2.5 text-sm font-medium text-ink transition-colors focus:border-olive focus:bg-white focus:outline-none focus:ring-1 focus:ring-olive/30 sm:w-56"
        />
      </div>

      <div className="overflow-hidden rounded-3xl border border-border/70 bg-surface shadow-sm">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full table-fixed">
            <thead>
              <tr className="bg-cream/50 border-b border-border/60">
                <th scope="col" className="w-[28%] py-4 px-4 text-left text-xs font-semibold uppercase tracking-wider text-ink-soft pl-6">Sipariş Detayı</th>
                <th scope="col" className="w-[18%] py-4 px-3 text-center text-xs font-semibold uppercase tracking-wider text-ink-soft">Tarih</th>
                <th scope="col" className="w-[22%] py-4 px-3 text-center text-xs font-semibold uppercase tracking-wider text-ink-soft">Durum</th>
                <th scope="col" className="w-[16%] py-4 px-3 text-center text-xs font-semibold uppercase tracking-wider text-ink-soft">Ürün Sayısı</th>
                <th scope="col" className="w-[16%] py-4 px-3 text-right text-xs font-semibold uppercase tracking-wider text-ink-soft pr-6">Tutar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 bg-surface">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr
                    key={order.orderNumber}
                    onClick={() => handleOpen(order)}
                    className="group cursor-pointer transition-colors hover:bg-cream/40"
                  >
                    <td className="px-4 py-5 text-left pl-6">
                      <div className="text-base font-bold text-ink group-hover:text-olive transition-colors">{order.orderNumber}</div>
                      <div className="text-xs font-medium text-ink-soft/80 mt-1">{order.customer}</div>
                    </td>
                    <td className="px-3 py-5 text-center text-sm font-medium text-ink-soft/80">{order.date}</td>
                    <td className="px-3 py-5 text-center text-sm">
                      <span className="inline-block rounded-xl bg-cream/50 px-3 py-1.5 border border-border/60 shadow-sm">
                        <StatusBadge status={order.status} />
                      </span>
                    </td>
                    <td className="px-3 py-5 text-center text-sm font-bold text-ink-soft">{order.items} Adet</td>
                    <td className="px-3 py-5 text-right text-base font-bold text-ink pr-6">{order.total}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm font-medium text-ink-soft">
                    Sipariş bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-border/40 md:hidden">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <div
                key={order.orderNumber}
                onClick={() => handleOpen(order)}
                className="cursor-pointer space-y-4 p-5 transition-colors hover:bg-cream/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-bold text-ink">{order.orderNumber}</div>
                    <div className="text-xs font-medium text-ink-soft/80 mt-1">{order.customer}</div>
                  </div>
                  <span className="inline-block rounded-xl bg-cream/50 px-3 py-1.5 border border-border/60 shadow-sm">
                    <StatusBadge status={order.status} />
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm bg-cream/50 p-4 rounded-2xl border border-border/40">
                  <div>
                    <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ink-soft/70">Tarih</div>
                    <span className="font-medium text-ink-soft">{order.date}</span>
                  </div>
                  <div>
                    <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ink-soft/70">Ürün Sayısı</div>
                    <span className="font-bold text-ink-soft">{order.items} Adet</span>
                  </div>
                  <div className="col-span-2 border-t border-border/40 pt-3 flex justify-between items-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-ink-soft/70">Tutar</div>
                    <span className="font-bold text-lg text-ink">{order.total}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="py-12 text-center text-sm font-medium text-ink-soft">Sipariş bulunamadı.</p>
          )}
        </div>
      </div>

      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Sipariş Detayı (${selectedOrder?.orderNumber})`}
      >
        {selectedOrder && (
          <div className="max-h-[70vh] space-y-6 overflow-y-auto pr-2 custom-scrollbar">
            {/* MÜŞTERİ */}
            <div className="space-y-1 rounded-3xl border border-border/70 bg-cream/30 p-6 shadow-sm">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink-soft/70 mb-3">Müşteri</h3>
              <p className="text-base font-bold text-ink">{selectedOrder.customer}</p>
              <p className="text-sm font-medium text-ink-soft">{selectedOrder.email}</p>
              {selectedOrder.phone && <p className="text-sm font-medium text-ink-soft">{selectedOrder.phone}</p>}
            </div>

            {/* TESLİMAT ADRESİ */}
            {selectedOrder.shippingAddress?.line1 && (
              <div className="space-y-1 rounded-3xl border border-border/70 bg-cream/30 p-6 shadow-sm">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink-soft/70 mb-3">Teslimat Adresi</h3>
                <p className="text-base font-bold text-ink">{selectedOrder.shippingAddress.name}</p>
                <p className="text-sm font-medium text-ink-soft">
                  {selectedOrder.shippingAddress.line1}
                  {selectedOrder.shippingAddress.line2 && `, ${selectedOrder.shippingAddress.line2}`}
                </p>
                <p className="text-sm font-medium text-ink-soft">
                  {selectedOrder.shippingAddress.district}, {selectedOrder.shippingAddress.city}
                  {selectedOrder.shippingAddress.postalCode && ` ${selectedOrder.shippingAddress.postalCode}`}
                </p>
                {selectedOrder.shippingAddress.phone && (
                  <p className="text-sm font-medium text-ink-soft">{selectedOrder.shippingAddress.phone}</p>
                )}
              </div>
            )}

            {/* ÖDEME */}
            <div className="grid grid-cols-2 gap-4 rounded-3xl border border-border/70 bg-cream/30 p-6 shadow-sm">
              <div>
                <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-ink-soft/70">Ödeme Yöntemi</div>
                <p className="text-sm font-bold text-ink">{PAYMENT_METHOD_LABELS[selectedOrder.paymentMethod]}</p>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="payment_status" className="block text-[11px] font-bold uppercase tracking-wider text-ink-soft/70">
                  Ödeme Durumu
                </label>
                <Dropdown
                  id="payment_status"
                  value={paymentStatusInput}
                  onChange={(v) => setPaymentStatusInput(v as AdminPaymentStatus)}
                  options={(Object.keys(PAYMENT_STATUS_LABELS) as AdminPaymentStatus[]).map((s) => ({ value: s, label: PAYMENT_STATUS_LABELS[s] }))}
                  className="w-full rounded-xl border border-border/60 bg-surface px-3 py-2 text-sm font-medium text-ink focus:border-olive focus:outline-none focus:ring-2 focus:ring-olive/20 shadow-sm transition-colors"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <label htmlFor="tracking_number" className="block text-[11px] font-bold uppercase tracking-wider text-ink-soft/70">
                  Kargo Takip No
                </label>
                <input
                  id="tracking_number"
                  type="text"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  placeholder="Örn. PTT123456789"
                  className="w-full rounded-xl border border-border/60 bg-surface px-3 py-2 text-sm font-medium text-ink focus:border-olive focus:outline-none focus:ring-2 focus:ring-olive/20 shadow-sm transition-all"
                />
              </div>
            </div>

            {/* ÜRÜNLER */}
            <div className="space-y-4 rounded-3xl border border-border/70 bg-cream/30 p-6 shadow-sm">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink-soft/70">Ürünler</h3>
              <div className="divide-y divide-border/40">
                {selectedOrder.lineItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink">{item.name}</p>
                      <p className="text-xs font-medium text-ink-soft/80 mt-1">
                        {item.size && `Beden: ${item.size} · `}Adet: {item.quantity}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-ink">{formatMoney(item.lineTotal)}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t border-border/40 pt-4 text-sm bg-surface p-4 rounded-2xl border-border/60 border">
                <div className="flex justify-between font-medium text-ink-soft">
                  <span>Ara Toplam</span>
                  <span>{formatMoney(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between font-medium text-ink-soft">
                  <span>Kargo</span>
                  <span>{formatMoney(selectedOrder.shipping)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between font-medium text-gold">
                    <span>İndirim</span>
                    <span>-{formatMoney(selectedOrder.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg text-ink pt-2 border-t border-border/40">
                  <span>Toplam</span>
                  <span>{formatMoney(selectedOrder.totalValue)}</span>
                </div>
              </div>
            </div>

            {selectedOrder.customerNote && (
              <div className="space-y-2 rounded-3xl border border-border/70 bg-cream/30 p-6 shadow-sm">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink-soft/70">Müşteri Notu</h3>
                <p className="text-sm font-medium text-ink leading-relaxed">{selectedOrder.customerNote}</p>
              </div>
            )}

            {/* DURUM */}
            <div className="space-y-2">
              <label htmlFor="status" className="block text-[11px] font-bold uppercase tracking-wider text-ink-soft/70 pl-1">
                Sipariş Durumu
              </label>
              <Dropdown
                id="status"
                value={statusInput}
                onChange={(v) => setStatusInput(v as AdminOrderStatus)}
                options={STATUS_OPTIONS.map((s) => ({ value: s, label: ORDER_STATUS_LABELS[s] }))}
                className="w-full rounded-xl border border-border/60 bg-surface px-4 py-3 text-sm font-bold text-ink focus:border-olive focus:outline-none focus:ring-2 focus:ring-olive/20 shadow-sm transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="admin_note" className="block text-[11px] font-bold uppercase tracking-wider text-ink-soft/70 pl-1">
                Dahili Not
              </label>
              <textarea
                id="admin_note"
                rows={2}
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Sadece ekip içi görünür"
                className="w-full rounded-2xl border border-border/60 bg-surface px-4 py-3 text-sm font-medium text-ink focus:border-olive focus:outline-none focus:ring-2 focus:ring-olive/20 shadow-sm transition-all resize-none"
              />
            </div>

            <div className="sticky bottom-0 flex justify-end gap-3 bg-surface pt-4 pb-2 border-t border-border/40">
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>Kapat</Button>
              <Button variant="solid" onClick={handleSave} loading={saving}>Kaydet</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
