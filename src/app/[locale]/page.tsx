import { auth } from "@clerk/nextjs/server";
import { SignInButton } from "@clerk/nextjs";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HomeForm } from "@/components/HomeForm";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const { userId } = await auth();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 flex flex-col items-center text-center">
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
        {t("title")}
      </h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400 max-w-xl">
        {t("subtitle")}
      </p>

      {userId ? (
        <HomeForm />
      ) : (
        <div className="mt-10 flex flex-col items-center gap-4">
          <p className="text-zinc-600 dark:text-zinc-400">
            {t("signInToStart")}
          </p>
          <SignInButton mode="modal">
            <button className="rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-5 py-2 font-medium">
              {t("submit")}
            </button>
          </SignInButton>
        </div>
      )}
    </div>
  );
}
