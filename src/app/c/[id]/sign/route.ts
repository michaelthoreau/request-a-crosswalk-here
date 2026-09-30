import type { NextRequest } from "next/server"
import { SIGN_VARIANTS, renderSignPdf, type SignVariant } from "@/lib/sign-pdf"
import { getActiveCrosswalk } from "@/lib/crosswalks"

export async function GET(req: NextRequest, ctx: RouteContext<"/c/[id]/sign">) {
  const { id } = await ctx.params
  const crosswalk = await getActiveCrosswalk(id)
  if (!crosswalk) return new Response("Not found", { status: 404 })

  const style = req.nextUrl.searchParams.get("style")
  const variant: SignVariant = SIGN_VARIANTS.find((v) => v === style) ?? "color"

  const pdf = await renderSignPdf({ ...crosswalk, variant })
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="crosswalk-sign-${crosswalk.id}-${variant}.pdf"`,
    },
  })
}
