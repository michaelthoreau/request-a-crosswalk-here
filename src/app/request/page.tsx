import type { Metadata } from "next"
import { connection } from "next/server"
import { z } from "zod"
import { RequestFlow } from "@/components/request-flow"
import { listActiveCrosswalks } from "@/lib/crosswalks"

export const metadata: Metadata = { title: "Request a crosswalk" }

const pointSchema = z.object({
  lat: z.string().min(1).pipe(z.coerce.number<string>().min(-90).max(90)),
  lng: z.string().min(1).pipe(z.coerce.number<string>().min(-180).max(180)),
})

export default async function RequestPage({ searchParams }: PageProps<"/request">) {
  await connection()
  const initial = pointSchema.safeParse(await searchParams)
  const points = await listActiveCrosswalks()
  return <RequestFlow points={points} initialPoint={initial.success ? initial.data : null} />
}
