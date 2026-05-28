import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "./LocaleSwitcher";

export async function Navbar() {
  const t = await getTranslations();
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto max-w-5xl flex items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          🍜 {t("App.name")}
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Show when="signed-in">
            <Link href="/recommend" className="hover:underline">
              {t("Nav.recommend")}
            </Link>
            <Link href="/favorites" className="hover:underline">
              {t("Nav.favorites")}
            </Link>
            <Link href="/history" className="hover:underline">
              {t("Nav.history")}
            </Link>
            <Link href="/preferences" className="hover:underline">
              {t("Nav.preferences")}
            </Link>
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
      </div>
    </header>
  );
}
