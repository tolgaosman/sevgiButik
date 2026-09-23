"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { Pencil, ArrowUpRight, BadgeCheck, Sparkles } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { MotionReveal } from "@/components/ui/MotionReveal";
import { useAuth, ApiError } from "@/lib/auth";
import { useFavorites } from "@/lib/favorites";
import { useCart } from "@/lib/cart";
import { apiMutate } from "@/lib/api";
import { cn } from "@/lib/cn";
import { toast } from "@/lib/toast";
import { ORDER_STATUS_LABELS, type Order } from "@/lib/orders";

/** A color is never a valid background-image layer — one invalid layer drops the whole declaration. */
const coverColor = "#f53380";

/**
 * Paint order, topmost first: the storefront Hero's pinstripe weave over a pink/gold bloom.
 * Alphas run far hotter than the Hero's because this cover *is* the color field, not a tint over cream.
 */
const coverGradient = [
  "repeating-linear-gradient(135deg, rgba(43,36,34,0.09) 0px, rgba(43,36,34,0.09) 1.5px, transparent 1.5px, transparent 42px)",
  "radial-gradient(ellipse 65% 110% at 88% 6%, rgba(201,169,110,0.80) 0%, rgba(201,169,110,0) 58%)",
  "radial-gradient(ellipse 60% 95% at 10% 108%, rgba(247,223,232,0.70) 0%, rgba(247,223,232,0) 62%)",
  "radial-gradient(ellipse 95% 125% at 20% -12%, #f53380 0%, rgba(245,51,128,0) 66%)",
  "radial-gradient(ellipse 120% 105% at 82% 112%, #c7175a 0%, rgba(199,23,90,0) 72%)",
].join(", ");

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

type FieldErrors = Record<string, string[]>;

/**
 * 422 doğrulama hatalarını alanlara dağıt; geri kalan her şey için tek bir
 * Türkçe mesaj göster — kullanıcıya ham "Server Error" gösterilmez.
 */
function describeError(err: unknown): { fields: FieldErrors; message: string | null } {
  if (err instanceof ApiError) {
    if (err.errors) return { fields: err.errors, message: null };
    if (err.status === 419)
      return { fields: {}, message: "Oturumunuz zaman aşımına uğradı. Sayfayı yenileyip tekrar deneyin." };
    if (err.status >= 500)
      return { fields: {}, message: "Şu anda işleminizi tamamlayamıyoruz. Lütfen birazdan tekrar deneyin." };
    return { fields: {}, message: err.message };
  }
  return { fields: {}, message: "Bir şeyler ters gitti. Lütfen tekrar deneyin." };
}

function LoginForm({ onForgotPassword }: { onForgotPassword: () => void }) {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setFormError(null);

    const form = new FormData(e.currentTarget);
    try {
      await login(String(form.get("email")), String(form.get("password")));
    } catch (err) {
      const { fields, message } = describeError(err);
      setErrors(fields);
      setFormError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-border p-6 sm:p-8">
      <h2 className="font-serif text-2xl font-medium text-ink">Giriş Yap</h2>
      <p className="mt-1 text-sm text-ink-soft">Zaten hesabınız var mı? Giriş yapın.</p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <Input
          id="login-email"
          name="email"
          label="E-posta Adresi"
          type="email"
          placeholder="ornek@posta.com"
          autoComplete="email"
          inputFilter="email"
          required
          error={errors.email?.[0]}
        />
        <Input
          id="login-password"
          name="password"
          label="Şifre"
          type="password"
          autoComplete="current-password"
          required
          error={errors.password?.[0]}
        />
        {formError && <p className="text-xs text-red-500">{formError}</p>}
        <Button type="submit" variant="solid" className="w-full" loading={loading}>
          Giriş Yap
        </Button>
        <button
          type="button"
          onClick={onForgotPassword}
          className="block w-full text-center text-xs text-ink-soft underline underline-offset-4 decoration-ink/30 transition-colors duration-200 hover:text-olive hover:decoration-olive"
        >
          Şifrenizi mi unuttunuz?
        </button>
      </form>
    </div>
  );
}

function RegisterForm() {
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setFormError(null);

    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    const passwordConfirmation = String(form.get("password_confirmation"));
    const phoneVal = form.get("phone");

    try {
      await register(String(form.get("name")), String(form.get("email")), phoneVal ? String(phoneVal) : "", password, passwordConfirmation);
    } catch (err) {
      const { fields, message } = describeError(err);
      setErrors(fields);
      setFormError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-border p-6 sm:p-8">
      <h2 className="font-serif text-2xl font-medium text-ink">Hesap Oluştur</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Yeni koleksiyonlardan ve size özel fırsatlardan ilk siz haberdar olun.
      </p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <Input id="signup-name" name="name" label="Ad Soyad" autoComplete="name" inputFilter="name" required error={errors.name?.[0]} />
        <Input
          id="signup-email"
          name="email"
          label="E-posta Adresi"
          type="email"
          placeholder="ornek@posta.com"
          autoComplete="email"
          inputFilter="email"
          required
          error={errors.email?.[0]}
        />
        <Input
          id="signup-phone"
          name="phone"
          label="Telefon Numarası"
          type="tel"
          placeholder="5XX XXX XX XX"
          autoComplete="tel"
          inputFilter="phone"
          required
          error={errors.phone?.[0]}
        />
        <Input
          id="signup-password"
          name="password"
          label="Şifre"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          error={errors.password?.[0]}
        />
        <Input
          id="signup-password-confirmation"
          name="password_confirmation"
          label="Şifre (Tekrar)"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
        {formError && <p className="text-xs text-red-500">{formError}</p>}
        <Button type="submit" variant="outline" className="w-full" loading={loading}>
          Hesap Oluştur
        </Button>
      </form>
    </div>
  );
}

function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const { forgotPassword, resetPassword } = useAuth();
  const [step, setStep] = useState<"request" | "verify">("request");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleRequest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setFormError(null);

    const form = new FormData(e.currentTarget);
    const value = String(form.get("email"));

    try {
      await forgotPassword(value);
      setEmail(value);
      setStep("verify");
    } catch (err) {
      const { fields, message } = describeError(err);
      setErrors(fields);
      setFormError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setFormError(null);

    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    const passwordConfirmation = String(form.get("password_confirmation"));

    try {
      await resetPassword(email, String(form.get("code")), password, passwordConfirmation);
      setDone(true);
    } catch (err) {
      const { fields, message } = describeError(err);
      setErrors(fields);
      setFormError(message);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="border border-border p-6 sm:p-8">
        <h2 className="font-serif text-2xl font-medium text-ink">Şifreniz Güncellendi</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Yeni şifrenizle giriş yapabilirsiniz.
        </p>
        <Button type="button" variant="solid" className="mt-6 w-full" onClick={onBack}>
          Giriş Yap
        </Button>
      </div>
    );
  }

  return (
    <div className="border border-border p-6 sm:p-8">
      <h2 className="font-serif text-2xl font-medium text-ink">Şifremi Unuttum</h2>
      <p className="mt-1 text-sm text-ink-soft">
        {step === "request"
          ? "Kayıtlı e-posta adresinize bir doğrulama kodu gönderelim."
          : `${email} adresine gönderilen kodu ve yeni şifrenizi girin.`}
      </p>

      {step === "request" ? (
        <form className="mt-6 space-y-4" onSubmit={handleRequest}>
          <Input
            id="forgot-email"
            name="email"
            label="E-posta Adresi"
            type="email"
            placeholder="ornek@posta.com"
            autoComplete="email"
            inputFilter="email"
            required
            error={errors.email?.[0]}
          />
          {formError && <p className="text-xs text-red-500">{formError}</p>}
          <Button type="submit" variant="solid" className="w-full" loading={loading}>
            Kod Gönder
          </Button>
        </form>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={handleVerify}>
          <Input
            id="forgot-code"
            name="code"
            label="Doğrulama Kodu"
            inputMode="numeric"
            maxLength={6}
            inputFilter="numeric"
            required
            error={errors.code?.[0]}
          />
          <Input
            id="forgot-password"
            name="password"
            label="Yeni Şifre"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            error={errors.password?.[0]}
          />
          <Input
            id="forgot-password-confirmation"
            name="password_confirmation"
            label="Yeni Şifre (Tekrar)"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
          {formError && <p className="text-xs text-red-500">{formError}</p>}
          <Button type="submit" variant="solid" className="w-full" loading={loading}>
            Şifreyi Güncelle
          </Button>
        </form>
      )}

      <button
        type="button"
        onClick={onBack}
        className="mt-4 block w-full text-center text-xs text-ink-soft underline underline-offset-4 decoration-ink/30 transition-colors duration-200 hover:text-olive hover:decoration-olive"
      >
        Giriş ekranına dön
      </button>
    </div>
  );
}

function PersonalInfoForm() {
  const { user, refresh } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!user) return null;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setMessage(null);

    const form = new FormData(e.currentTarget);
    const data: Record<string, string> = {
      name: String(form.get("name")),
      email: String(form.get("email")),
      phone: String(form.get("phone")),
    };

    try {
      await apiMutate("/user", { method: "PATCH", body: JSON.stringify(data) });
      await refresh();
      setMessage({ type: "success", text: "Bilgileriniz başarıyla güncellendi." });
    } catch (err) {
      const { fields, message: errMsg } = describeError(err);
      setErrors(fields);
      setMessage({ type: "error", text: errMsg || "Güncelleme başarısız." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-border p-6 sm:p-8 h-full">
      <h3 className="font-serif text-xl font-medium text-ink">Kişisel Bilgilerim</h3>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <Input
          id="profile-name"
          name="name"
          label="Ad Soyad"
          defaultValue={user.name}
          inputFilter="name"
          required
          error={errors.name?.[0]}
        />
        <Input
          id="profile-email"
          name="email"
          label="E-posta Adresi"
          type="email"
          defaultValue={user.email ?? ""}
          inputFilter="email"
          required
          error={errors.email?.[0]}
        />
        <Input
          id="profile-phone"
          name="phone"
          label="Telefon Numarası"
          type="tel"
          placeholder="5XX XXX XX XX"
          defaultValue={user.phone ?? ""}
          inputFilter="phone"
          required
          error={errors.phone?.[0]}
        />
        {message && (
          <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-500"}`}>
            {message.text}
          </p>
        )}
        <Button type="submit" variant="solid" className="w-full" loading={loading}>
          Bilgilerimi Kaydet
        </Button>
      </form>
    </div>
  );
}

const CANCELLABLE_STATUSES = new Set(["pending", "confirmed"]);

const ORDER_STATUS_COLORS: Record<Order["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
};

function OrderHistory({
  orders,
  loading,
  onOrderUpdated,
}: {
  orders: Order[];
  loading: boolean;
  onOrderUpdated: (order: Order) => void;
}) {
  const [cancelling, setCancelling] = useState<Set<string>>(new Set());

  async function handleCancel(orderNumber: string) {
    if (!confirm(`${orderNumber} numaralı siparişi iptal etmek istediğinize emin misiniz?`)) return;

    setCancelling((prev) => new Set(prev).add(orderNumber));
    try {
      const updated = await apiMutate<Order>(`/orders/${orderNumber}/cancel`, { method: "POST" });
      onOrderUpdated(updated);
      toast.success("Sipariş iptal edildi", { description: `${orderNumber} numaralı sipariş iptal edildi.` });
    } catch (err) {
      toast.error("Sipariş iptal edilemedi", {
        description: err instanceof ApiError ? err.message : "Lütfen tekrar deneyin.",
      });
    } finally {
      setCancelling((prev) => {
        const next = new Set(prev);
        next.delete(orderNumber);
        return next;
      });
    }
  }

  if (loading) {
    return (
      <div className="border border-border p-6 sm:p-8 space-y-4">
        <h3 className="font-serif text-xl font-medium text-ink">Geçmiş Siparişlerim</h3>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="border border-border p-6 sm:p-8">
      <h3 className="font-serif text-xl font-medium text-ink">Geçmiş Siparişlerim</h3>
      {orders.length === 0 ? (
        <p className="mt-6 text-sm text-ink-soft">Henüz bir siparişiniz bulunmamaktadır.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <div
              key={order.orderNumber}
              className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-ink">#{order.orderNumber}</p>
                <p className="text-xs text-ink-soft">
                  {new Date(order.createdAt).toLocaleDateString("tr-TR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                <p className="font-medium text-ink">
                  ₺{order.total.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </p>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    ORDER_STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-800"
                  }`}
                >
                  {ORDER_STATUS_LABELS[order.status] ?? order.status}
                </span>
                {CANCELLABLE_STATUSES.has(order.status) && (
                  <button
                    type="button"
                    onClick={() => handleCancel(order.orderNumber)}
                    disabled={cancelling.has(order.orderNumber)}
                    className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
                  >
                    {cancelling.has(order.orderNumber) ? "İptal ediliyor..." : "İptal Et"}
                  </button>
                )}
                <Link href={`/siparis/${order.orderNumber}`} className="text-sm font-medium text-olive hover:underline">
                  Detay
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PasswordChangeForm() {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setMessage(null);

    const form = new FormData(e.currentTarget);
    const data = {
      current_password: String(form.get("current_password")),
      password: String(form.get("password")),
      password_confirmation: String(form.get("password_confirmation")),
    };

    try {
      await apiMutate("/user/password", { method: "PUT", body: JSON.stringify(data) });
      setMessage({ type: "success", text: "Şifreniz başarıyla güncellendi." });
      e.currentTarget.reset();
    } catch (err) {
      const { fields, message: errMsg } = describeError(err);
      setErrors(fields);
      setMessage({ type: "error", text: errMsg || "Şifre güncelleme başarısız." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-border p-6 sm:p-8 h-full">
      <h3 className="font-serif text-xl font-medium text-ink">Şifre Sıfırlama</h3>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <Input
          id="current_password"
          name="current_password"
          type="password"
          label="Mevcut Şifre"
          required
          error={errors.current_password?.[0]}
        />
        <Input
          id="new_password"
          name="password"
          type="password"
          label="Yeni Şifre"
          required
          error={errors.password?.[0]}
        />
        <Input
          id="password_confirmation"
          name="password_confirmation"
          type="password"
          label="Yeni Şifre (Tekrar)"
          required
          error={errors.password_confirmation?.[0]}
        />
        {message && (
          <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-500"}`}>
            {message.text}
          </p>
        )}
        <Button type="submit" variant="solid" className="w-full" loading={loading}>
          Şifremi Güncelle
        </Button>
      </form>
    </div>
  );
}


function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-cream px-3 py-1 text-xs font-medium text-ink">
      {children}
    </span>
  );
}

function MetaGroup({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: typeof BadgeCheck;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-2 lg:items-end">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.3em] text-ink-soft">
        {label}
        <Icon className="size-3.5 text-olive" aria-hidden />
      </span>
      <div className="flex flex-wrap gap-2 lg:justify-end">{children}</div>
    </div>
  );
}

function ActionTile({
  title,
  description,
  tint,
  href,
  onClick,
}: {
  title: string;
  description: string;
  tint: string;
  href?: string;
  onClick?: () => void;
}) {
  const className = cn(
    "group relative block rounded-2xl p-5 pr-16 text-left transition-colors duration-300 ease-[var(--ease-organic)] hover:bg-sand focus-visible:outline-2 focus-visible:outline-offset-2",
    tint,
  );

  const content = (
    <>
      <h3 className="font-serif text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">{description}</p>
      <span
        className="absolute right-4 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-ink-soft transition-colors duration-300 ease-[var(--ease-organic)] group-hover:border-olive group-hover:bg-olive group-hover:text-white"
        aria-hidden
      >
        <ArrowUpRight className="size-4" />
      </span>
    </>
  );

  return href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cn(className, "w-full")}>
      {content}
    </button>
  );
}

function ProfileHero({
  orderCount,
  favoriteCount,
  cartCount,
}: {
  orderCount: number;
  favoriteCount: number;
  cartCount: number;
}) {
  const { user } = useAuth();
  if (!user) return null;

  const initials =
    user.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?";

  return (
    <MotionReveal>
      <div className="overflow-hidden rounded-3xl border border-border bg-surface">
        <div
          className="relative h-28 sm:h-36 lg:h-40"
          style={{ backgroundColor: coverColor, backgroundImage: coverGradient }}
        >
          <button
            type="button"
            onClick={() => scrollToSection("kisisel-bilgiler")}
            aria-label="Profil bilgilerini düzenle"
            className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-surface/85 text-ink shadow-sm backdrop-blur-sm transition-colors duration-300 ease-[var(--ease-organic)] hover:bg-surface hover:text-olive sm:right-6 sm:top-6"
          >
            <Pencil className="size-4" aria-hidden />
          </button>
        </div>

        <div className="px-5 pb-6 sm:px-8 sm:pb-8">
          <div className="relative z-10 -mt-10 flex sm:-mt-12">
            <div className="flex size-20 shrink-0 items-center justify-center rounded-full border-4 border-surface bg-olive text-2xl font-medium text-white shadow-sm sm:size-24 sm:text-3xl">
              {initials}
            </div>
          </div>
          <div className="pt-4 sm:pt-6 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-12">
            <div>
              <h2 className="font-serif text-2xl font-medium leading-tight text-ink sm:text-3xl">
                {user.name}
              </h2>
              <p className="mt-1 text-sm text-ink-soft">{user.phone}</p>
              <p className="text-sm text-ink-soft">{user.email ?? "E-posta eklenmedi"}</p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  variant="solid"
                  size="sm"
                  className="rounded-full normal-case tracking-normal"
                  onClick={() => scrollToSection("kisisel-bilgiler")}
                >
                  Profili Düzenle
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-border normal-case tracking-normal"
                  onClick={() => scrollToSection("sifre-guncelle")}
                >
                  Ayarlar
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-6 sm:flex-row sm:items-end lg:justify-end lg:pt-20 lg:text-right">
              <MetaGroup label="Üyelik Durumu" icon={BadgeCheck}>
                <Pill>{user.isAdmin ? "Yönetici" : "Kayıtlı Üye"}</Pill>
              </MetaGroup>

              <MetaGroup label="Hesap Özeti" icon={Sparkles}>
                <Pill>{orderCount} Sipariş</Pill>
                <Pill>{favoriteCount} Favori</Pill>
                <Pill>{cartCount} Sepette</Pill>
              </MetaGroup>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-3 sm:gap-4">
            <ActionTile
              tint="bg-cream"
              title="Siparişlerim"
              description="Geçmiş siparişlerini incele, kargo durumunu takip et."
              onClick={() => scrollToSection("siparis-gecmisi")}
            />
            <ActionTile
              tint="bg-sand"
              title="Favorilerim"
              description="Beğendiğin ürünleri kaydettiğin listeye göz at."
              href="/favoriler"
            />
            <ActionTile
              tint="bg-olive/10"
              title="Sepetim"
              description="Sepetindeki ürünleri gözden geçir, alışverişi tamamla."
              href="/sepet"
            />
          </div>
        </div>
      </div>
    </MotionReveal>
  );
}

function AccountDashboard() {
  const { user, logout } = useAuth();
  const { products: favoriteProducts } = useFavorites();
  const { cart } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch("/api/orders", {
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (res.ok) {
          const data = await res.json();
          setOrders(data.data ?? []);
          setOrderTotal(data.meta?.total ?? data.data?.length ?? 0);
        }
      } catch {
        // Ignored
      } finally {
        setOrdersLoading(false);
      }
    }
    fetchOrders();
  }, []);

  if (!user) return null;

  async function handleDeleteAccount() {
    if (!confirm("Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) return;
    setDeleteLoading(true);
    try {
      await apiMutate("/user", { method: "DELETE" });
      window.location.href = "/";
    } catch {
      alert("Hesabınız silinirken bir hata oluştu.");
      setDeleteLoading(false);
    }
  }

  return (
    <div>
      <ProfileHero orderCount={orderTotal} favoriteCount={favoriteProducts.length} cartCount={cart.itemCount} />

      <div className="mt-8 space-y-8">
        <div id="siparis-gecmisi" className="w-full scroll-mt-24">
          <OrderHistory
            orders={orders}
            loading={ordersLoading}
            onOrderUpdated={(updated) =>
              setOrders((prev) => prev.map((o) => (o.orderNumber === updated.orderNumber ? updated : o)))
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div id="kisisel-bilgiler" className="scroll-mt-24">
            <PersonalInfoForm />
          </div>

          <div id="sifre-guncelle" className="scroll-mt-24">
            <PasswordChangeForm />
          </div>
        </div>

        {/* Buttons at the bottom */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4 pt-4">
          <Button
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            loading={deleteLoading}
            onClick={handleDeleteAccount}
          >
            Hesabı Sil
          </Button>
          <Button
            variant="outline"
            loading={loading}
            onClick={async () => {
              setLoading(true);
              await logout().finally(() => setLoading(false));
            }}
          >
            Çıkış Yap
          </Button>
        </div>
      </div>
    </div>
  );
}

import { MotifBackground } from "@/components/ui/MotifBackground";

export default function AccountPage() {
  const { user, isLoading } = useAuth();
  const [mode, setMode] = useState<"auth" | "forgot">("auth");

  return (
    <div className="relative overflow-hidden bg-cream pb-12 pt-[calc(2rem+6rem)] -mt-[6rem] min-h-[70vh]">
      <MotifBackground mask="linear-gradient(to bottom, black 0%, transparent 100%)" />
      <div className="container-site relative z-10">
        <Breadcrumbs items={[{ label: "Hesabım" }]} />
      {isLoading ? (
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2 md:gap-10">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="border border-border p-6 sm:p-8">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="mt-2 h-4 w-56" />
              <div className="mt-6 space-y-4">
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : user ? (
        <AccountDashboard />
      ) : mode === "forgot" ? (
        <div className="mx-auto max-w-md">
          <ForgotPasswordForm onBack={() => setMode("auth")} />
        </div>
      ) : (
        <div className="mx-auto grid max-w-4xl grid-cols-1 items-start gap-6 md:grid-cols-2 md:gap-10">
          <LoginForm onForgotPassword={() => setMode("forgot")} />
          <RegisterForm />
        </div>
      )}
      </div>
    </div>
  );
}
