import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import Script from "next/script";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { ClerkProvider } from "@clerk/nextjs";
import { setRequestLocale, getMessages, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Navbar } from "@/components/Navbar";
import "../globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "App" });
  return {
    title: t("name"),
    description: t("tagline"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

  return (
    <ClerkProvider>
      <html
        lang={locale}
        className={`${dmSans.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
          {kakaoKey && (
            <Script
              src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&autoload=false`}
              strategy="afterInteractive"
            />
          )}
          <NextIntlClientProvider locale={locale} messages={messages}>
            <Navbar />
            <main className="flex-1 w-full">{children}</main>
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
