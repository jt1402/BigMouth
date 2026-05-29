import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { MobileNav } from "./MobileNav";
import { NavLinks } from "./NavLinks";

export async function Navbar() {
  const t = await getTranslations();
  const links = [
    { href: "/recommend", label: t("Nav.recommend") },
    { href: "/favorites", label: t("Nav.favorites") },
    { href: "/history", label: t("Nav.history") },
    { href: "/preferences", label: t("Nav.preferences") },
  ];
  return (
    <header className="border-b-2 border-zinc-950/10 dark:border-zinc-100/10 bg-white dark:bg-zinc-950 sticky top-0 z-30">
      <div className="mx-auto max-w-5xl flex items-center justify-between px-4 h-14">
        <Link
          href="/"
          className="flex items-center gap-1.5 font-extrabold tracking-tight whitespace-nowrap text-base sm:text-lg group"
        >
          <span className="text-xl sm:text-2xl group-hover:rotate-12 transition-transform">
            🍜
          </span>
          <span>{t("App.name")}</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-2 text-sm font-semibold">
          <Show when="signed-in">
            <NavLinks links={links} />
          </Show>
          <div className="mx-1">
            <LocaleSwitcher />
          </div>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="rounded-full bg-zinc-950 dark:bg-amber-300 text-amber-200 dark:text-zinc-950 font-bold px-4 py-1.5 text-sm shadow-[0_3px_0_0_rgba(0,0,0,0.15)] active:translate-y-0.5 active:shadow-none transition">
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
              <button className="rounded-full bg-zinc-950 dark:bg-amber-300 text-amber-200 dark:text-zinc-950 font-bold px-3.5 py-1.5 text-xs shadow-[0_3px_0_0_rgba(0,0,0,0.15)] active:translate-y-0.5 active:shadow-none transition">
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
