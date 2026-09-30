import { renderSignPdf } from "@/lib/sign-pdf"
import { getActiveCrosswalk } from "@/lib/crosswalks"

export async function GET(_req: Request, ctx: RouteContext<"/c/[id]/sign">) {
  const { id } = await ctx.params
  const crosswalk = await getActiveCrosswalk(id)
  if (!crosswalk) return new Response("Not found", { status: 404 })

  const pdf = await renderSignPdf(crosswalk)
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="crosswalk-sign-${crosswalk.id}.pdf"`,
    },
  })
}
