import "server-only";
import { cache } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users, preferences, type User } from "@/db/schema";

export const getCurrentDbUser = cache(async (): Promise<User | null> => {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;
  const db = getDb();
  const existing = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });
  if (existing) return existing;

  const cu = await currentUser();
  const email = cu?.emailAddresses?.[0]?.emailAddress ?? null;
  const [created] = await db
    .insert(users)
    .values({ clerkId, email })
    .returning();
  await db.insert(preferences).values({ userId: created.id });
  return created;
});

export async function requireCurrentDbUser(): Promise<User> {
  const user = await getCurrentDbUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}
