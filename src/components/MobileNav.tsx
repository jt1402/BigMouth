"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "./LocaleSwitcher";

export function MobileNav({
  links,
}: {
  links: { href: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="size-9 rounded-md flex items-center justify-center text-zinc-700 dark:text-zinc-300 active:bg-zinc-100 dark:active:bg-zinc-800"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {open ? (
            <>
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </>
          ) : (
            <>
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </>
          )}
        </svg>
      </button>

      {mounted &&
        open &&
        createPortal(
          <div
            className="fixed left-0 right-0 top-14 bottom-0 z-40 bg-white dark:bg-zinc-950 sm:hidden flex flex-col overflow-y-auto"
            onClick={() => setOpen(false)}
          >
            <nav
              className="flex flex-col gap-1 p-4 text-lg font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="px-3 py-3 rounded-lg active:bg-zinc-100 dark:active:bg-zinc-800"
                >
                  {l.label}
                </Link>
              ))}
              <div className="mt-4 px-3">
                <LocaleSwitcher />
              </div>
            </nav>
          </div>,
          document.body,
        )}
    </>
  );
}
