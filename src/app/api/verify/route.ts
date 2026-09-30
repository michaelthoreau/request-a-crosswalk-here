import { eq } from "drizzle-orm"
import { after, type NextRequest } from "next/server"
import { db } from "@/db"
import { crosswalks } from "@/db/schema"
import { consumeVerificationToken } from "@/lib/crosswalks"
import { sendRequestPublished, sendSupportConfirmed } from "@/lib/email"

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")
  const result = token ? await consumeVerificationToken(token) : null
  if (!result) {
    return Response.redirect(new URL("/check-email?status=invalid", request.url), 303)
  }

  const { supporter, firstTime } = result
  if (firstTime) {
    after(async () => {
      const [crosswalk] = await db
        .select({
          id: crosswalks.id,
          label: crosswalks.label,
          locality: crosswalks.locality,
        })
        .from(crosswalks)
        .where(eq(crosswalks.id, supporter.crosswalkId))
      if (!crosswalk) return
      try {
        if (supporter.isRequester) {
          await sendRequestPublished(supporter.email, crosswalk)
        } else {
          await sendSupportConfirmed(supporter.email, crosswalk.id, crosswalk.label)
        }
      } catch (err) {
        console.error("Failed to send post-verification email", err)
      }
    })
  }

  const welcome = supporter.isRequester ? "requested" : "supported"
  return Response.redirect(
    new URL(`/c/${supporter.crosswalkId}?welcome=${welcome}`, request.url),
    303
  )
}
