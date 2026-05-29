"use client";

import { usePathname, Link } from "@/i18n/navigation";

export function NavLinks({
  links,
}: {
  links: { href: string; label: string }[];
}) {
  const pathname = usePathname();
  return (
    <>
      {links.map((l) => {
        const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={
              "px-3 py-1.5 rounded-full transition " +
              (active
                ? "bg-amber-300 text-zinc-950 shadow-[0_2px_0_0_rgba(0,0,0,0.12)]"
                : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800")
            }
          >
            {l.label}
          </Link>
        );
      })}
    </>
  );
}
