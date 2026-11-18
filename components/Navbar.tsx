
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Menu, X } from "lucide-react";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Inventory", href: "/inventory" },
  { label: "Sell Your Car", href: "/sell-your-car" },
  { label: "Reviews", href: "/reviews" },
  { label: "Latest News", href: "/news" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const navLinkClass =
  "whitespace-nowrap text-[13px] font-semibold text-gray-300 transition-colors duration-200 hover:text-cyan-400";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileFinanceOpen, setMobileFinanceOpen] = useState(false);

  const closeMobileMenu = () => {
    setMobileOpen(false);
    setMobileFinanceOpen(false);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 w-full border-b border-white/10 bg-[#15161c]/95 backdrop-blur-md">
      <div className="container mx-auto flex h-20 items-center justify-between gap-5 px-4 md:px-8">

        {/* CARMART LOGO */}
        <Link
          href="/"
          onClick={closeMobileMenu}
          aria-label="Carmart Perth homepage"
          className="flex shrink-0 items-center"
        >
          <Image
            src="/carmartlogo.svg"
            alt="Carmart Perth"
            width={130}
            height={65}
            priority
            className="h-[60px] w-[130px] object-contain translate-x-8"
          />
        </Link>

        {/* DESKTOP NAVIGATION */}
        <div className="ml-auto hidden items-center gap-5 xl:flex">

          <nav
            aria-label="Main navigation"
            className="flex items-center gap-5"
          >
            <Link
              href="/"
              className="whitespace-nowrap text-[13px] font-semibold text-cyan-400"
            >
              Home
            </Link>

            <Link
              href="/inventory"
              className={navLinkClass}
            >
              Inventory
            </Link>

            {/* FINANCE DROPDOWN */}
            <div className="group relative">
            <button
                type="button"
                aria-haspopup="true"
                className="flex items-center gap-1 whitespace-nowrap text-[13px] font-semibold text-gray-300 transition-colors duration-200 hover:text-cyan-400 focus:text-cyan-400"
            >
                Finance
                <ChevronDown
                size={14}
                className="transition-transform duration-200 group-hover:rotate-180 group-focus-within:rotate-180"
                />
            </button>

            <div className="invisible absolute left-0 top-full z-50 min-w-[210px] pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                <div className="rounded-lg border border-[#30323a] bg-[#0e0f15] p-2 shadow-xl">
                <Link
                    href="/finance/apply"
                    className="block rounded-md px-3 py-3 text-[13px] font-semibold text-gray-300 transition hover:bg-white/5 hover:text-cyan-400"
                >
                    Finance
                </Link>

                <Link
                    href="/bad-credit-car-finance"
                    className="block rounded-md px-3 py-3 text-[13px] font-semibold text-gray-300 transition hover:bg-white/5 hover:text-cyan-400"
                >
                    Bad Credit Car Finance
                </Link>
                </div>
            </div>
            </div>

            {navLinks.slice(2).map((link) => (
                <Link
                    key={link.label}
                    href={link.href}
                    className={navLinkClass}
                >
                    {link.label}
                </Link>
                ))}
            </nav>


            {/* GET APPROVED BUTTON */}
            <Link
            href="/finance/apply"
            className="ml-1 hidden h-[42px] min-w-[188px] shrink-0 items-center justify-center bg-gradient-to-r from-[#f00089] via-[#a35cb9] to-[#04c8e9] px-6 text-center text-[13px] font-black uppercase text-white shadow-[0_8px_28px_rgba(240,0,137,0.25)] transition-all duration-200 hover:scale-[1.03] hover:brightness-110 xl:inline-flex"
            >
            GET APPROVED
            </Link>
        </div>

        {/* MOBILE MENU BUTTON */}
        <button
          type="button"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMobileOpen((open) => !open)}
          className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/10 text-white transition hover:bg-white/10 xl:hidden"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* MOBILE / TABLET NAVIGATION */}
      {mobileOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="max-h-[calc(100dvh-80px)] overflow-y-auto border-t border-white/10 bg-[#15161c] px-4 pb-6 pt-3 xl:hidden"
        >
          <div className="mx-auto flex max-w-[1280px] flex-col">

            <Link
              href="/"
              onClick={closeMobileMenu}
              className="rounded-md px-4 py-3 text-sm font-semibold text-cyan-400 hover:bg-white/5"
            >
              Home
            </Link>

            <Link
              href="/inventory"
              onClick={closeMobileMenu}
              className="rounded-md px-4 py-3 text-sm font-semibold text-gray-200 hover:bg-white/5"
            >
              Inventory
            </Link>

            {/* MOBILE FINANCE DROPDOWN */}
            <button
              type="button"
              aria-expanded={mobileFinanceOpen}
              onClick={() =>
                setMobileFinanceOpen((open) => !open)
              }
              className="flex w-full items-center justify-between rounded-md px-4 py-3 text-left text-sm font-semibold text-gray-200 hover:bg-white/5"
            >
              Finance
              <ChevronDown
                size={16}
                className={`transition-transform ${
                  mobileFinanceOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {mobileFinanceOpen && (
            <div className="flex flex-col border-l border-cyan-500/30 ml-4">
                <Link
                href="/finance/apply"
                onClick={closeMobileMenu}
                className="rounded-md px-5 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-cyan-400"
                >
                Finance
                </Link>

                <Link
                href="/bad-credit-car-finance"
                onClick={closeMobileMenu}
                className="rounded-md px-5 py-3 text-sm text-gray-300 hover:bg-white/5 hover:text-cyan-400"
                >
                Bad Credit Car Finance
                </Link>
            </div>
            )}

            {navLinks.slice(2).map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={closeMobileMenu}
                className="rounded-md px-4 py-3 text-sm font-semibold text-gray-200 transition hover:bg-white/5 hover:text-cyan-400"
              >
                {link.label}
              </Link>
            ))}

            <Link
              href="/finance/apply"
              onClick={closeMobileMenu}
              className="mt-5 flex h-11 items-center justify-center bg-gradient-to-r from-[#ed078b] via-[#a35cb9] to-[#09c6e9] text-sm font-extrabold text-white"
            >
              GET APPROVED
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
