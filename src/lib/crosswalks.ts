import "server-only"
import { createHash, randomBytes } from "node:crypto"
import { and, asc, count, eq, gt, gte, isNotNull, lte } from "drizzle-orm"
import { db } from "@/db"
import { crosswalks, supporters, verificationTokens } from "@/db/schema"
import { boundingBox, distanceMeters, type LatLng } from "./geo"

export const NEARBY_RADIUS_M = 50
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000
const RESEND_COOLDOWN_MS = 60 * 1000

const verifiedCount = count(supporters.verifiedAt)

export async function getActiveCrosswalk(id: string) {
  const [row] = await db
    .select({
      id: crosswalks.id,
      label: crosswalks.label,
      locality: crosswalks.locality,
      lat: crosswalks.lat,
      lng: crosswalks.lng,
      createdAt: crosswalks.createdAt,
      supporterCount: verifiedCount,
    })
    .from(crosswalks)
    .leftJoin(supporters, eq(supporters.crosswalkId, crosswalks.id))
    .where(and(eq(crosswalks.id, id), eq(crosswalks.status, "active")))
    .groupBy(crosswalks.id)
  return row ?? null
}

export async function getPublicSupporterNames(crosswalkId: string) {
  const rows = await db
    .select({ name: supporters.name })
    .from(supporters)
    .where(
      and(
        eq(supporters.crosswalkId, crosswalkId),
        eq(supporters.showName, true),
        isNotNull(supporters.verifiedAt)
      )
    )
    .orderBy(asc(supporters.verifiedAt))
  return rows.map((r) => r.name)
}

export type CrosswalkPoint = {
  id: string
  label: string | null
  lat: number
  lng: number
  supporterCount: number
}

export async function listActiveCrosswalks(): Promise<CrosswalkPoint[]> {
  return db
    .select({
      id: crosswalks.id,
      label: crosswalks.label,
      lat: crosswalks.lat,
      lng: crosswalks.lng,
      supporterCount: verifiedCount,
    })
    .from(crosswalks)
    .leftJoin(supporters, eq(supporters.crosswalkId, crosswalks.id))
    .where(eq(crosswalks.status, "active"))
    .groupBy(crosswalks.id)
}

export async function findNearbyCrosswalks(point: LatLng, radiusM = NEARBY_RADIUS_M) {
  const box = boundingBox(point, radiusM)
  const rows = await db
    .select({
      id: crosswalks.id,
      label: crosswalks.label,
      lat: crosswalks.lat,
      lng: crosswalks.lng,
      supporterCount: verifiedCount,
    })
    .from(crosswalks)
    .leftJoin(supporters, eq(supporters.crosswalkId, crosswalks.id))
    .where(
      and(
        eq(crosswalks.status, "active"),
        gte(crosswalks.lat, box.minLat),
        lte(crosswalks.lat, box.maxLat),
        gte(crosswalks.lng, box.minLng),
        lte(crosswalks.lng, box.maxLng)
      )
    )
    .groupBy(crosswalks.id)

  return rows
    .map((r) => ({ ...r, distance: Math.round(distanceMeters(point, r)) }))
    .filter((r) => r.distance <= radiusM)
    .sort((a, b) => a.distance - b.distance)
}

function slugify(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "")
}

export async function uniqueCrosswalkId(label: string | null) {
  const base = (label && slugify(label)) || `crosswalk-${randomBytes(4).toString("hex")}`
  for (let n = 1; ; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`
    const [existing] = await db
      .select({ id: crosswalks.id })
      .from(crosswalks)
      .where(eq(crosswalks.id, candidate))
    if (!existing) return candidate
  }
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex")

/** Returns a raw token to email, or null if one was sent too recently. */
export async function issueVerificationToken(supporterId: string) {
  const [recent] = await db
    .select({ tokenHash: verificationTokens.tokenHash })
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.supporterId, supporterId),
        gt(verificationTokens.createdAt, new Date(Date.now() - RESEND_COOLDOWN_MS))
      )
    )
  if (recent) return null

  const token = randomBytes(32).toString("base64url")
  await db.insert(verificationTokens).values({
    tokenHash: hashToken(token),
    supporterId,
    expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
  })
  return token
}

/**
 * Idempotent so that link scanners and repeat clicks don't break the flow.
 * `firstTime` is true only on the click that actually verified the supporter.
 */
export async function consumeVerificationToken(token: string) {
  const [row] = await db
    .select({ supporter: supporters })
    .from(verificationTokens)
    .innerJoin(supporters, eq(supporters.id, verificationTokens.supporterId))
    .where(
      and(
        eq(verificationTokens.tokenHash, hashToken(token)),
        gt(verificationTokens.expiresAt, new Date())
      )
    )
  if (!row) return null

  const { supporter } = row
  const firstTime = !supporter.verifiedAt
  if (firstTime) {
    const markVerified = db
      .update(supporters)
      .set({ verifiedAt: new Date() })
      .where(eq(supporters.id, supporter.id))
    if (supporter.isRequester) {
      await db.batch([
        markVerified,
        db
          .update(crosswalks)
          .set({ status: "active" })
          .where(eq(crosswalks.id, supporter.crosswalkId)),
      ])
    } else {
      await markVerified
    }
  }
  return { supporter, firstTime }
}
