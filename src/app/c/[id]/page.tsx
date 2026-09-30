import { FileTextIcon, MapPinPlusIcon, PrinterIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { cache } from "react"
import { CrosswalkMap } from "@/components/map/crosswalk-map"
import { CopyButton } from "@/components/copy-button"
import { SupportForm } from "@/components/support-form"
import { Wordmark } from "@/components/wordmark"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getActiveCrosswalk, getPublicSupporterNames } from "@/lib/crosswalks"
import { atPlace, signedUp } from "@/lib/share-text"
import { crosswalkUrl } from "@/lib/site"

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
  const url = crosswalkUrl(crosswalk.id)

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <Wordmark className="self-start" />
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
        {crosswalk.label && (
          <Badge variant="secondary">A new crosswalk in our neighborhood</Badge>
        )}
        <h1 className="font-heading text-3xl font-bold tracking-tight text-primary md:text-4xl">
          {crosswalk.label ?? "A new crosswalk in our neighborhood"}
        </h1>
        {crosswalk.locality && <p className="text-lg text-muted-foreground">{crosswalk.locality}</p>}
        <p className="text-sm font-medium">
          {signedUp(crosswalk.supporterCount)} this crosswalk
        </p>
        {names.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {names.map((name, i) => (
              <li key={i}>
                <Badge variant="outline">{name}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-6">
        <Card className="overflow-hidden p-0">
          <div className="h-72">
            <CrosswalkMap
              points={[crosswalk]}
              focus={{ lat: crosswalk.lat, lng: crosswalk.lng, id: crosswalk.id }}
            />
          </div>
        </Card>

        <Card className="ring-2 ring-primary">
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

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Step 2: Spread the word</CardTitle>
            <CardDescription>
              Print a sign and post it at the spot so neighbors can scan it.
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
              Sign: full color
            </a>
            <a
              href={`/c/${crosswalk.id}/sign?style=print`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline" })}
            >
              <PrinterIcon data-icon="inline-start" />
              Sign: printer friendly
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Step 3: Gather Neighbor Support and contact your City
            </CardTitle>
            <CardDescription>
              Show neighbors the sign or send them this link. Then send a letter to your city.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <code className="truncate rounded-md bg-muted px-3 py-2 text-sm">{url}</code>
            <div className="grid grid-cols-2 gap-2">
              <CopyButton text={url} label="Copy link" variant="outline" className="w-full" />
              <Link
                href={`/c/${crosswalk.id}/letter`}
                className={buttonVariants({ variant: "outline", className: "w-full" })}
              >
                <FileTextIcon data-icon="inline-start" />
                Form letter to your city
              </Link>
            </div>
          </CardContent>
        </Card>

        <Link href="/request" className={buttonVariants({ size: "lg", className: "h-12 text-base" })}>
          <MapPinPlusIcon data-icon="inline-start" />
          Request a crosswalk in another location
        </Link>
      </div>
    </div>
  )
}
