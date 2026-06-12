"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Data", href: "/data" },
  { label: "About", href: "/about" },
] as const;

export function PageShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="relative flex min-h-screen flex-col bg-[linear-gradient(160deg,#c9b8e8_0%,#e8b4d0_28%,#f5c4a8_55%,#f9d8b0_75%,#fce8c8_100%)]">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-40"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
        }}
      />

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/30 bg-white/20 px-6 py-6 backdrop-blur-md md:px-16">
        <Link
          href="/"
          className="text-sm uppercase tracking-[0.2em] text-[rgba(60,30,80,0.5)] transition-colors hover:text-[#3c1e50]"
        >
          LA Budget Explorer
        </Link>
        <nav className="flex gap-6 md:gap-8">
          {NAV_LINKS.map(({ label, href }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);

            return (
              <Link
                key={label}
                href={href}
                className={`text-sm tracking-wide transition-colors duration-200 ${
                  isActive
                    ? "font-medium text-[#3c1e50]"
                    : "font-light text-[rgba(60,30,80,0.5)] hover:text-[#3c1e50]"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </header>

      {children}

      <footer className="relative z-10 pb-8 text-center text-xs text-[rgba(60,30,80,0.35)]">
        Data sourced from the City of Los Angeles Office of the City
        Administrative Officer
      </footer>
    </div>
  );
}
