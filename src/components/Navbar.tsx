import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { MobileNav } from "./MobileNav";

export async function Navbar() {
  const t = await getTranslations();
  const links = [
    { href: "/recommend", label: t("Nav.recommend") },
    { href: "/favorites", label: t("Nav.favorites") },
    { href: "/history", label: t("Nav.history") },
    { href: "/preferences", label: t("Nav.preferences") },
  ];
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto max-w-5xl flex items-center justify-between px-4 h-14">
        <Link
          href="/"
          className="text-base sm:text-lg font-semibold tracking-tight whitespace-nowrap"
        >
          🍜 {t("App.name")}
        </Link>

        <nav className="hidden sm:flex items-center gap-5 text-sm">
          <Show when="signed-in">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-emerald-600">
                {l.label}
              </Link>
            ))}
          </Show>
          <LocaleSwitcher />
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-3 py-1.5 text-sm font-medium">
                {t("Nav.signIn")}
              </button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </nav>

        <div className="flex sm:hidden items-center gap-2">
          <Show when="signed-in">
            <UserButton />
          </Show>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-3 py-1.5 text-xs font-medium">
                {t("Nav.signIn")}
              </button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <MobileNav links={links} />
          </Show>
        </div>
      </div>
    </header>
  );
}
