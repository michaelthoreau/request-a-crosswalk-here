import { sql } from "drizzle-orm"
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core"

const createdAt = () =>
  integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)

export const crosswalks = sqliteTable(
  "crosswalks",
  {
    id: text("id").primaryKey(),
    label: text("label"),
    locality: text("locality"),
    lat: real("lat").notNull(),
    lng: real("lng").notNull(),
    // Pending until the requester verifies their email.
    status: text("status", { enum: ["pending", "active"] })
      .notNull()
      .default("pending"),
    createdAt: createdAt(),
  },
  (t) => [index("crosswalks_lat_lng_idx").on(t.lat, t.lng)]
)

export const supporters = sqliteTable(
  "supporters",
  {
    id: text("id").primaryKey(),
    crosswalkId: text("crosswalk_id")
      .notNull()
      .references(() => crosswalks.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    address: text("address"),
    showName: integer("show_name", { mode: "boolean" }).notNull().default(false),
    isRequester: integer("is_requester", { mode: "boolean" })
      .notNull()
      .default(false),
    verifiedAt: integer("verified_at", { mode: "timestamp" }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("supporters_crosswalk_email_idx").on(t.crosswalkId, t.email),
  ]
)

export const verificationTokens = sqliteTable(
  "verification_tokens",
  {
    tokenHash: text("token_hash").primaryKey(),
    supporterId: text("supporter_id")
      .notNull()
      .references(() => supporters.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("verification_tokens_supporter_idx").on(t.supporterId)]
)

export type Crosswalk = typeof crosswalks.$inferSelect
export type Supporter = typeof supporters.$inferSelect
