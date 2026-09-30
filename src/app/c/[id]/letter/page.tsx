import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { LetterComposer } from "@/components/letter-composer"
import { getActiveCrosswalk, getPublicSupporterNames } from "@/lib/crosswalks"
import { crosswalkUrl } from "@/lib/site"

export const metadata: Metadata = { title: "Form letter" }

export default async function LetterPage({ params }: PageProps<"/c/[id]/letter">) {
  const { id } = await params
  const crosswalk = await getActiveCrosswalk(id)
  if (!crosswalk) notFound()
  const names = await getPublicSupporterNames(crosswalk.id)

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 print:max-w-none print:p-0">
      <div className="flex flex-col gap-1 print:hidden">
        <Link href={`/c/${crosswalk.id}`} className="text-sm text-muted-foreground underline underline-offset-4">
          Back to the request
        </Link>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-primary">Form letter</h1>
        <p className="text-muted-foreground">
          Send this to the people who can make the crosswalk happen. The count updates as more
          neighbors sign on.
        </p>
      </div>
      <LetterComposer
        label={crosswalk.label}
        locality={crosswalk.locality}
        supporterCount={crosswalk.supporterCount}
        url={crosswalkUrl(crosswalk.id)}
        names={names}
      />
    </div>
  )
}
