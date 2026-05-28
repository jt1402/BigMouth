import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const isProtected = createRouteMatcher([
  "/(en|ko)?/recommend(.*)",
  "/(en|ko)?/history(.*)",
  "/(en|ko)?/preferences(.*)",
  "/api/recommend(.*)",
  "/api/visits(.*)",
  "/api/history(.*)",
  "/api/preferences(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) {
    await auth.protect();
  }
  return intlMiddleware(req);
});

export const proxyConfig = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
