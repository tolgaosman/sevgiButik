"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useMotionValueEvent, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { User, Phone, Heart, ShoppingBag, Menu, X, ChevronDown } from "lucide-react";
import { primaryNav } from "@/lib/nav";
import { useCart } from "@/lib/cart";
import { useFavorites } from "@/lib/favorites";

const ease = [0.32, 0.72, 0, 1] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  const { cart } = useCart();
  const cartCount = cart.itemCount;
  const { slugs } = useFavorites();
  const favCount = slugs.size;
  const reduceMotion = useReducedMotion();
  const lastY = useRef(0);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  const { scrollY } = useScroll();

  function openMenu() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMenuOpen(true);
  }

  function scheduleCloseMenu() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMenuOpen(false), 180);
  }

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  useMotionValueEvent(scrollY, "change", (y) => {
    if (open || menuOpen || reduceMotion) {
      setHidden(false);
      lastY.current = y;
      return;
    }
    const goingDown = y > lastY.current;
    setHidden(y > 120 && goingDown);
    lastY.current = y;
  });

  function closeDrawer() {
    setOpen(false);
    setOpenSection(null);
  }

  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (pathname?.startsWith("/admin")) return null;

  return (
    <motion.header
      className="sticky top-0 z-40 w-full px-0 sm:px-4 lg:px-8 pt-0 sm:pt-4"
      animate={{ y: hidden ? "-100%" : "0%" }}
      transition={{ duration: 0.4, ease }}
    >
      <div className="mx-auto flex w-full max-w-[100rem] items-center justify-between rounded-none sm:rounded-[2rem] border-b sm:border border-border/50 bg-surface/85 backdrop-blur-xl px-4 sm:px-6 lg:px-8 py-3 shadow-sm sm:shadow-md transition-all duration-300">
        
        {/* Left Side: Mobile Menu & Logo */}
        <div className="flex flex-1 items-center justify-start gap-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Menüyü aç"
            className="-ml-2 p-2 text-ink lg:hidden transition-transform duration-200 active:scale-95"
          >
            <Menu size={22} />
          </button>

          <div className="flex items-center pl-2 lg:pl-0">
            <Link href="/" className="transition-transform duration-300 hover:scale-[1.02]">
              <Image
                src="/sevgiLogo-ink.png"
                alt="Sevgi Butik"
                width={220}
                height={79}
                priority
                className="h-7 sm:h-8 w-auto object-contain lg:h-9"
              />
            </Link>
          </div>
        </div>

        {/* Center: Desktop Nav */}
        <nav
          className="hidden flex-auto justify-center items-center gap-8 lg:flex"
          onMouseLeave={scheduleCloseMenu}
        >
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={openMenu}
              onFocus={openMenu}
              onClick={() => setMenuOpen(false)}
              className="group relative py-2 text-[0.8rem] font-semibold tracking-wider text-ink-soft transition-colors duration-300 hover:text-ink"
            >
              {item.label.toLocaleUpperCase("tr-TR")}
              <span className="absolute inset-x-0 -bottom-0.5 h-[2px] scale-x-0 rounded-full bg-olive transition-transform duration-400 ease-[var(--ease-organic)] group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>

        {/* Right Side: Icons */}
        <div className="flex flex-1 items-center justify-end gap-1 text-ink sm:gap-2">
          {[
            { href: "/iletisim", icon: Phone, label: "İletişim", hiddenSm: false },
            { href: "/favoriler", icon: Heart, label: "Favorilerim", count: favCount, hiddenSm: false },
            { href: "/sepet", icon: ShoppingBag, label: "Sepetim", count: cartCount, hiddenSm: false },
            { href: "/hesabim", icon: User, label: "Hesabım", hiddenSm: true },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              onClick={() => setMenuOpen(false)}
              className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 hover:bg-ink/5 hover:text-olive hover:scale-105 active:scale-95 ${item.hiddenSm ? "hidden sm:flex" : ""}`}
            >
              <item.icon size={19} strokeWidth={2.2} />
              {item.count !== undefined && item.count > 0 && (
                <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-olive text-[0.6rem] font-bold text-white shadow-sm ring-2 ring-surface">
                  {item.count}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop Mega Menu Dropdown */}
      <div
        className={`absolute inset-x-0 px-4 sm:px-8 top-full pt-3 hidden lg:block ${menuOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        onMouseEnter={openMenu}
        onMouseLeave={scheduleCloseMenu}
      >
        <div className="mx-auto w-full max-w-[100rem]">
          <div
            className={`overflow-hidden rounded-[2.5rem] border border-border/50 bg-surface/95 backdrop-blur-2xl shadow-2xl transition-[grid-template-rows,opacity] duration-500 ease-[var(--ease-organic)] grid ${
              menuOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="min-h-0">
              <div className="container-site flex flex-wrap justify-between gap-8 px-12 py-10">
                {primaryNav.filter(i => i.columns.length > 0 && i.label !== "Giyim").map((item) => (
                  <div key={item.href} className="flex-1 min-w-[200px]">
                    <Link
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="inline-block font-serif text-xl font-medium text-ink transition-colors duration-200 hover:text-olive mb-4"
                    >
                      {item.label}
                    </Link>
                    <ul className="space-y-3">
                      {item.columns.flatMap((column) => column.items).map((sub) => (
                        <li key={sub.href}>
                          <Link
                            href={sub.href}
                            onClick={() => setMenuOpen(false)}
                            className="text-sm font-medium text-ink-soft transition-all duration-200 hover:text-olive hover:translate-x-1 inline-block"
                          >
                            {sub.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <div
          onClick={closeDrawer}
          className={`absolute inset-0 bg-ink/30 backdrop-blur-sm transition-opacity duration-400 ease-[var(--ease-organic)] ${open ? "opacity-100" : "opacity-0"}`}
        />
        <div
          className={`absolute inset-y-0 left-0 flex w-[85%] max-w-[340px] flex-col bg-surface/95 backdrop-blur-xl shadow-2xl transition-transform duration-500 ease-[var(--ease-organic)] ${
            open ? "translate-x-0" : "-translate-x-full"
          } rounded-r-3xl overflow-hidden`}
        >
          <div className="flex items-center justify-between border-b border-border/50 px-6 py-6">
            <Link href="/" onClick={closeDrawer}>
              <Image src="/sevgiLogo-ink.png" alt="Sevgi Butik" width={140} height={50} className="h-7 w-auto object-contain" />
            </Link>
            <button
              type="button"
              onClick={closeDrawer}
              aria-label="Menüyü kapat"
              className="-m-2 flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto overscroll-contain px-6 py-6 scrollbar-hide">
            <ul className="space-y-1">
              {primaryNav.map((item) => {
                const subItems = item.columns.flatMap((column) => column.items);
                const expanded = openSection === item.href;

                return (
                  <li key={item.href} className="border-b border-border/30 last:border-0 pb-1 mb-1">
                    <div className="flex items-center justify-between">
                      <Link
                        href={item.href}
                        onClick={closeDrawer}
                        className="flex-1 py-3 text-[0.85rem] font-bold tracking-wide text-ink transition-colors duration-200 hover:text-olive"
                      >
                        {item.label.toLocaleUpperCase("tr-TR")}
                      </Link>
                      {subItems.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setOpenSection(expanded ? null : item.href)}
                          aria-expanded={expanded}
                          className="flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-ink/5"
                        >
                          <ChevronDown
                            size={18}
                            className={`transition-transform duration-400 ease-[var(--ease-organic)] ${
                              expanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      )}
                    </div>

                    <div
                      className={`grid transition-[grid-template-rows,opacity] duration-400 ease-[var(--ease-organic)] ${
                        expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <ul className="min-h-0 overflow-hidden pl-3">
                        {subItems.map((sub) => (
                          <li key={sub.href}>
                            <Link
                              href={sub.href}
                              onClick={closeDrawer}
                              className="block py-2.5 text-[0.9rem] text-ink-soft transition-colors duration-200 hover:text-olive"
                            >
                              {sub.label}
                            </Link>
                          </li>
                        ))}
                        <li className="pb-3" aria-hidden />
                      </ul>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-8 space-y-2 rounded-2xl bg-cream p-4">
              {[
                { href: "/hesabim", label: "Hesabım" },
                { href: "/iletisim", label: "İletişim" },
                { href: "/favoriler", label: "Favorilerim" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeDrawer}
                  className="block rounded-xl px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-ink/5 hover:text-olive"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </motion.header>
  );
}
