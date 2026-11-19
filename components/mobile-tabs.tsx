"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Home" },
  { href: "/our-farm", label: "Farm" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/faq", label: "FAQ" },
  { href: "/signup", label: "Join" },
  { href: "/staff", label: "Staff" },
] as const;

export function MobileTabs() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-beige bg-white/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="App"
    >
      <ul className="mx-auto grid h-[6.25rem] max-w-[1200px] grid-cols-6">
        {TABS.map((tab) => {
          const active = tab.href === "/staff" ? pathname.startsWith("/staff") : pathname === tab.href;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-[6.25rem] flex-col items-center justify-center gap-1.5 px-1 text-center text-[13px] leading-[1.15] tracking-tight no-underline ${
                  active ? "font-semibold text-forest" : "font-medium text-sage"
                }`}
              >
                <TabIcon name={tab.label} active={active} />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function TabIcon({ name, active }: { name: string; active: boolean }) {
  const stroke = active ? "#304A35" : "#83977B";
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {name === "Home" ? (
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" stroke={stroke} strokeWidth="2" />
      ) : null}
      {name === "Farm" ? (
        <path d="M12 20s6-3.2 6-8a6 6 0 1 0-12 0c0 4.8 6 8 6 8Z" stroke={stroke} strokeWidth="2" />
      ) : null}
      {name === "How it works" ? (
        <path d="M5 7h14M5 12h14M5 17h9" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      ) : null}
      {name === "FAQ" ? (
        <path d="M12 17h.01M9.5 9a2.5 2.5 0 1 1 3.7 2.2c-.7.4-1.2 1-1.2 1.8V14" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      ) : null}
      {name === "Join" ? (
        <path d="M12 6v12M6 12h12" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      ) : null}
      {name === "Staff" ? (
        <path d="M12 12a3.2 3.2 0 1 0-3.2-3.2A3.2 3.2 0 0 0 12 12Zm-5.5 7.5a5.5 5.5 0 0 1 11 0" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      ) : null}
    </svg>
  );
}
