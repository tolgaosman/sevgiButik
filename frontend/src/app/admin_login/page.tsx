"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth, ApiError } from "@/lib/auth";
import { HeroBackground } from "@/components/sections/HeroBackground";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const email = "karabasaksevgi4@gmail.com";
    const password = String(form.get("password"));

    try {
      const user = await login(email, password);

      // Kimlik doğru ama yetki yok: oturumu hemen kapat, panele hiç uğratma.
      // Yetkiyi asıl zorlayan yer backend (/api/admin/* → auth:sanctum + admin).
      if (!user.isAdmin) {
        await logout();
        setError("Bu hesabın yönetici yetkisi yok.");
        return;
      }

      router.replace("/admin/siparisler");
    } catch (err) {
      // 422 taşır: "E-posta veya şifre hatalı." / rate limit uyarısı. Geri kalanı teknik gürültü.
      setError(
        err instanceof ApiError && err.status === 422
          ? (err.errors?.email?.[0] ?? err.message)
          : "Şu anda giriş yapılamıyor. Lütfen birazdan tekrar deneyin.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-cream px-4 py-12 sm:px-6 lg:px-8">
      <HeroBackground />
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="border border-border bg-surface px-6 py-10 shadow-sm sm:px-10">
          <div className="flex justify-center">
            <Image
              src="/sevgiLogo-ink.png"
              alt="Sevgi Butik"
              width={220}
              height={79}
              className="h-10 w-auto object-contain"
            />
          </div>
          <h2 className="mt-6 text-center font-serif text-3xl font-medium tracking-tight text-ink">
            Yönetim Paneli
          </h2>
          <p className="mt-2 text-center text-sm text-ink-soft">
            Sadece yetkili personel girişi içindir.
          </p>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <Input
              id="admin-password"
              name="password"
              label="Şifre"
              type="password"
              autoComplete="current-password"
              required
            />

            {error && <p className="text-center text-sm text-red-500">{error}</p>}

            <Button type="submit" variant="solid" className="w-full" loading={loading}>
              Giriş Yap
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
