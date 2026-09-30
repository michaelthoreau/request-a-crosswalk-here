import { FileTextIcon, PrinterIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { cache } from "react"
import { CrosswalkMap } from "@/components/map/crosswalk-map"
import { SupportForm } from "@/components/support-form"
import { Wordmark } from "@/components/wordmark"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getActiveCrosswalk, getPublicSupporterNames } from "@/lib/crosswalks"
import { atPlace, signedUp } from "@/lib/share-text"

const getCrosswalk = cache(getActiveCrosswalk)

export async function generateMetadata({ params }: PageProps<"/c/[id]">): Promise<Metadata> {
  const crosswalk = await getCrosswalk((await params).id)
  if (!crosswalk) return {}
  return {
    title: `Crosswalk${atPlace(crosswalk.label, crosswalk.locality)}`,
    description: `${signedUp(crosswalk.supporterCount)} a crosswalk${atPlace(crosswalk.label, crosswalk.locality)}. Add your name.`,
  }
}

export default async function CrosswalkPage({ params, searchParams }: PageProps<"/c/[id]">) {
  const [{ id }, { welcome }] = await Promise.all([params, searchParams])
  const crosswalk = await getCrosswalk(id)
  if (!crosswalk) notFound()

  const names = await getPublicSupporterNames(crosswalk.id)
  const alreadySigned = welcome === "requested" || welcome === "supported"

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <Wordmark className="self-start" />
      {welcome === "requested" && (
        <Alert>
          <AlertTitle>Your crosswalk request is live</AlertTitle>
          <AlertDescription>
            Next,{" "}
            <a href={`/c/${crosswalk.id}/sign`} target="_blank" rel="noopener noreferrer">
              print the sign
            </a>{" "}
            and post it at the spot
            so neighbors can scan it and add their names.
          </AlertDescription>
        </Alert>
      )}
      {welcome === "supported" && (
        <Alert>
          <AlertTitle>Thanks, you&apos;re counted!</AlertTitle>
          <AlertDescription>
            Know another spot that needs a crosswalk?{" "}
            <Link href="/request">Request one there too</Link>.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2">
        {crosswalk.label && <Badge variant="secondary">Crosswalk request</Badge>}
        <h1 className="font-heading text-3xl font-bold tracking-tight text-primary md:text-4xl">
          {crosswalk.label ?? "Crosswalk request"}
        </h1>
        {crosswalk.locality && <p className="text-lg text-muted-foreground">{crosswalk.locality}</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <Card className="self-start ring-2 ring-primary lg:col-start-2 lg:row-span-3 lg:row-start-1">
          <CardHeader>
            <CardTitle className="text-lg">Step 1: Sign up to support this crosswalk</CardTitle>
            <CardDescription>
              {alreadySigned
                ? "You're signed up. On to step 2!"
                : "Haven't signed yet? Start here. We'll email you a link to confirm, then you're counted."}
            </CardDescription>
          </CardHeader>
          {!alreadySigned && (
            <CardContent>
              <SupportForm crosswalkId={crosswalk.id} />
            </CardContent>
          )}
        </Card>

        <Card className="overflow-hidden p-0 lg:col-start-1 lg:row-start-1">
          <div className="h-72">
            <CrosswalkMap
              points={[crosswalk]}
              focus={{ lat: crosswalk.lat, lng: crosswalk.lng, id: crosswalk.id }}
            />
          </div>
        </Card>

        <Card className="lg:col-start-1 lg:row-start-2">
          <CardHeader>
            <CardTitle className="text-4xl font-bold text-primary">
              {crosswalk.supporterCount}
            </CardTitle>
            <CardDescription className="text-base">
              {crosswalk.supporterCount === 1 ? "neighbor has" : "neighbors have"} signed up to
              support this crosswalk
            </CardDescription>
          </CardHeader>
          {names.length > 0 && (
            <CardContent>
              <ul className="flex flex-wrap gap-2">
                {names.map((name, i) => (
                  <li key={i}>
                    <Badge variant="outline">{name}</Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          )}
        </Card>

        <Card className="lg:col-start-1 lg:row-start-3">
          <CardHeader>
            <CardTitle className="text-lg">Step 2: Spread the word</CardTitle>
            <CardDescription>
              Print a sign for the spot so neighbors can scan it, or send a letter to officials.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <a
              href={`/c/${crosswalk.id}/sign`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants()}
            >
              <PrinterIcon data-icon="inline-start" />
              Print the sign (half-letter PDF)
            </a>
            <Link
              href={`/c/${crosswalk.id}/letter`}
              className={buttonVariants({ variant: "outline" })}
            >
              <FileTextIcon data-icon="inline-start" />
              Form letter
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
