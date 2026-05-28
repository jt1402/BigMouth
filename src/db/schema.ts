import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  real,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    clerkId: text("clerk_id").notNull(),
    email: text("email"),
    locale: text("locale").notNull().default("en"),
    defaultRadiusM: integer("default_radius_m").notNull().default(800),
    historyWindowDays: integer("history_window_days").notNull().default(7),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("users_clerk_id_idx").on(t.clerkId)],
);

export const preferences = pgTable("preferences", {
  userId: integer("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  favoriteCuisines: jsonb("favorite_cuisines")
    .$type<string[]>()
    .notNull()
    .default([]),
  dislikedCuisines: jsonb("disliked_cuisines")
    .$type<string[]>()
    .notNull()
    .default([]),
  dietary: jsonb("dietary").$type<string[]>().notNull().default([]),
  priceMin: integer("price_min"),
  priceMax: integer("price_max"),
});

export const visits = pgTable(
  "visits",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    naverPlaceId: text("naver_place_id").notNull(),
    name: text("name").notNull(),
    address: text("address"),
    category: text("category"),
    lat: real("lat"),
    lng: real("lng"),
    visitedAt: timestamp("visited_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    rating: integer("rating"),
  },
  (t) => [
    index("visits_user_visited_idx").on(t.userId, t.visitedAt),
    index("visits_user_place_idx").on(t.userId, t.naverPlaceId),
  ],
);

export type User = typeof users.$inferSelect;
export type Preferences = typeof preferences.$inferSelect;
export type Visit = typeof visits.$inferSelect;
export type NewVisit = typeof visits.$inferInsert;
