import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const isProtectedPage = createRouteMatcher([
  "/(en|ko)?/recommend(.*)",
  "/(en|ko)?/history(.*)",
  "/(en|ko)?/preferences(.*)",
]);

const isProtectedApi = createRouteMatcher([
  "/api/recommend(.*)",
  "/api/visits(.*)",
  "/api/history(.*)",
  "/api/preferences(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  if (!userId) {
    if (isProtectedApi(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (isProtectedPage(req)) {
      const url = req.nextUrl.clone();
      url.pathname = "/sign-in";
      url.searchParams.set("redirect_url", req.nextUrl.pathname + req.nextUrl.search);
      return NextResponse.redirect(url);
    }
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
