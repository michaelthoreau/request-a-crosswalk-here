"use server"

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto"
import { and, eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import { crosswalks, supporters } from "@/db/schema"
import {
  findNearbyCrosswalks,
  issueVerificationToken,
  uniqueCrosswalkId,
} from "@/lib/crosswalks"
import {
  sendAlreadySupporting,
  sendRequestVerification,
  sendSupportVerification,
} from "@/lib/email"
import { describePlace, type PlaceDescription } from "@/lib/osm"

const latLngSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
})

const contactSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(100),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254)
    .pipe(z.email("Please enter a valid email address.")),
  address: z
    .string()
    .trim()
    .max(300)
    .transform((v) => v || null),
  showName: z.boolean(),
})

const emailPreferenceSchema = z.enum(["no-spam", "no-spam-2"], {
  error: "Please choose an email preference.",
})

type FieldName = "name" | "email" | "address" | "emailPreference"

export type FormState = {
  sent?: boolean
  error?: string
  fieldErrors?: Partial<Record<FieldName, string[]>>
  values?: Record<string, string>
} | null

function readContact(formData: FormData) {
  const contact = contactSchema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    address: formData.get("address") ?? "",
    showName: formData.get("showName") === "yes",
  })
  const preference = emailPreferenceSchema.safeParse(formData.get("emailPreference"))
  if (contact.success && preference.success) {
    return { success: true as const, data: contact.data }
  }
  const fieldErrors: Partial<Record<FieldName, string[]>> = contact.success
    ? {}
    : z.flattenError(contact.error).fieldErrors
  if (!preference.success) {
    fieldErrors.emailPreference = preference.error.issues.map((i) => i.message)
  }
  return { success: false as const, fieldErrors }
}

function echoValues(formData: FormData) {
  const values: Record<string, string> = {}
  for (const key of ["name", "email", "address", "showName", "emailPreference"]) {
    const v = formData.get(key)
    if (typeof v === "string") values[key] = v
  }
  return values
}

export async function lookupPoint(lat: number, lng: number) {
  const point = latLngSchema.parse({ lat, lng })
  const [place, nearby] = await Promise.all([
    describePlace(point),
    findNearbyCrosswalks(point),
  ])
  return { ...place, signature: signPlace(point, place), nearby }
}

// Lets the request form reuse a lookup without trusting client-supplied names.
function signPlace(point: { lat: number; lng: number }, place: PlaceDescription) {
  const secret = process.env.APP_SECRET
  if (!secret) throw new Error("APP_SECRET is not set")
  return createHmac("sha256", secret)
    .update(JSON.stringify([point.lat, point.lng, place.label, place.locality]))
    .digest("base64url")
}

function verifiedPlace(point: { lat: number; lng: number }, formData: FormData) {
  const place = {
    label: (formData.get("label") as string | null) || null,
    locality: (formData.get("locality") as string | null) || null,
  }
  const given = Buffer.from(String(formData.get("signature") ?? ""))
  const expected = Buffer.from(signPlace(point, place))
  return given.length === expected.length && timingSafeEqual(given, expected) ? place : null
}

export async function requestCrosswalk(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const values = echoValues(formData)
  const point = latLngSchema.safeParse({
    lat: formData.get("lat"),
    lng: formData.get("lng"),
  })
  if (!point.success) {
    return { error: "Pick a spot on the map first.", values }
  }
  const contact = readContact(formData)
  if (!contact.success) {
    return { fieldErrors: contact.fieldErrors, values }
  }

  const place = verifiedPlace(point.data, formData) ?? (await describePlace(point.data))
  const label = place.label
  const crosswalkId = await uniqueCrosswalkId(label)
  const supporterId = randomUUID()

  await db.batch([
    db.insert(crosswalks).values({
      id: crosswalkId,
      label,
      locality: place.locality,
      lat: point.data.lat,
      lng: point.data.lng,
    }),
    db.insert(supporters).values({
      id: supporterId,
      crosswalkId,
      ...contact.data,
      isRequester: true,
    }),
  ])

  const token = await issueVerificationToken(supporterId)
  if (token) {
    try {
      await sendRequestVerification(contact.data.email, contact.data.name, label, token)
    } catch (error) {
      console.error("Failed to send verification email", error)
      return { error: "We couldn't send the confirmation email. Please try again.", values }
    }
  }
  return { sent: true, values }
}

export async function supportCrosswalk(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const values = echoValues(formData)
  const crosswalkId = z.string().min(1).max(120).safeParse(formData.get("crosswalkId"))
  if (!crosswalkId.success) return { error: "Unknown crosswalk.", values }

  const contact = readContact(formData)
  if (!contact.success) {
    return { fieldErrors: contact.fieldErrors, values }
  }

  const [crosswalk] = await db
    .select({ id: crosswalks.id, label: crosswalks.label })
    .from(crosswalks)
    .where(and(eq(crosswalks.id, crosswalkId.data), eq(crosswalks.status, "active")))
  if (!crosswalk) return { error: "This crosswalk request wasn't found.", values }

  const { email, name } = contact.data
  const [existing] = await db
    .select()
    .from(supporters)
    .where(and(eq(supporters.crosswalkId, crosswalk.id), eq(supporters.email, email)))

  try {
    if (existing?.verifiedAt) {
      await sendAlreadySupporting(email, crosswalk.id, crosswalk.label)
    } else {
      let supporterId = existing?.id
      if (supporterId) {
        await db.update(supporters).set(contact.data).where(eq(supporters.id, supporterId))
      } else {
        supporterId = randomUUID()
        await db.insert(supporters).values({
          id: supporterId,
          crosswalkId: crosswalk.id,
          ...contact.data,
        })
      }
      const token = await issueVerificationToken(supporterId)
      if (token) await sendSupportVerification(email, name, crosswalk.label, token)
    }
  } catch (error) {
    console.error("Failed to send support email", error)
    return { error: "We couldn't send the confirmation email. Please try again.", values }
  }
  return { sent: true, values }
}
