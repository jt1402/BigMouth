import { SignIn } from "@clerk/nextjs";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthShell } from "@/components/AuthShell";

export default async function SignInPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");

  return (
    <AuthShell title={t("signInTitle")} subtitle={t("signInSub")}>
      <SignIn
        appearance={{
          variables: {
            colorPrimary: "#09090b",
            colorBackground: "transparent",
            borderRadius: "1.25rem",
            fontFamily: "var(--font-app)",
          },
          elements: {
            rootBox: "w-full",
            card: "shadow-[0_6px_0_0_rgba(0,0,0,0.05)] bg-white/90 dark:bg-zinc-900/80 backdrop-blur ring-2 ring-zinc-950/10 dark:ring-zinc-100/10",
            headerTitle: "hidden",
            headerSubtitle: "hidden",
            socialButtonsBlockButton:
              "ring-2 ring-zinc-950/10 dark:ring-zinc-100/10 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-bold",
            formButtonPrimary:
              "bg-zinc-950 hover:bg-zinc-800 normal-case font-bold shadow-[0_4px_0_0_rgba(0,0,0,0.2)]",
            formFieldInput:
              "ring-2 ring-zinc-950/10 dark:ring-zinc-100/10 focus:ring-amber-300",
          },
        }}
      />
    </AuthShell>
  );
}
