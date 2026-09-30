"use client"

import Link from "next/link"
import { useActionState, useEffect, useRef, useState, useTransition } from "react"
import { lookupPoint, requestCrosswalk } from "@/app/actions"
import { ContactFields } from "@/components/contact-fields"
import { LocationPicker } from "@/components/map/location-picker"
import { MapOverlay } from "@/components/map/map-overlay"
import { StreetView } from "@/components/map/street-view"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import type { CrosswalkPoint } from "@/lib/crosswalks"
import type { LatLng } from "@/lib/geo"

type Lookup = Awaited<ReturnType<typeof lookupPoint>>

export function RequestFlow({
  points,
  initialPoint,
}: {
  points: CrosswalkPoint[]
  initialPoint: LatLng | null
}) {
  const [picked, setPicked] = useState<LatLng | null>(initialPoint)
  const [lookup, setLookup] = useState<Lookup | null>(null)
  const [ignoreNearby, setIgnoreNearby] = useState(false)
  const [lookingUp, startLookup] = useTransition()
  const [slow, setSlow] = useState(false)
  const latestPick = useRef(0)

  const [state, action, submitting] = useActionState(requestCrosswalk, null)

  function pick(point: LatLng) {
    setPicked(point)
    setIgnoreNearby(false)
    setSlow(false)
    describe(point)
  }

  function describe(point: LatLng) {
    const pickId = ++latestPick.current
    startLookup(async () => {
      const result = await lookupPoint(point.lat, point.lng)
      if (pickId === latestPick.current) setLookup(result)
    })
  }

  useEffect(() => {
    if (initialPoint) describe(initialPoint)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only for the point passed in on load
  }, [])

  useEffect(() => {
    if (!lookingUp) return
    const timer = setTimeout(() => setSlow(true), 2000)
    return () => clearTimeout(timer)
  }, [lookingUp])

  const nearby = lookup?.nearby ?? []
  const showNearby = !lookingUp && nearby.length > 0 && !ignoreNearby

  return (
    <div className="grid h-map-screen grid-rows-[45%_55%] overflow-hidden lg:grid-cols-[1fr_26rem] lg:grid-rows-1">
      <div className="relative min-h-0">
        <LocationPicker
          points={points}
          value={picked}
          onChange={pick}
          className="absolute inset-0"
        />
        <MapOverlay />
      </div>

      <div className="flex min-h-0 flex-col gap-4 overflow-y-auto overscroll-contain border-t p-4 *:shrink-0 lg:border-t-0 lg:border-l">
        <Card>
          <CardHeader>
            <CardTitle>1. Find the spot</CardTitle>
            <CardDescription>
              Click the map where the crosswalk should go. Drag the pin to fine-tune.
            </CardDescription>
          </CardHeader>
        </Card>

        {picked && (
          <Card>
            <CardHeader>
              <CardTitle>2. Confirm the location</CardTitle>
              <CardDescription>
                {lookingUp ? (
                  <>
                    <span className="flex items-center gap-2">
                      <Spinner /> Finding cross streets…
                    </span>
                    {slow && (
                      <span className="mt-1 block">
                        we didnt use google&apos;s expensive API so its a lil slow :/
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    {lookup?.label && (
                      <span className="block text-base font-medium text-foreground">
                        {lookup.label}
                      </span>
                    )}
                    {lookup?.locality}
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StreetView point={picked} />
            </CardContent>
            {showNearby && (
              <CardContent className="flex flex-col gap-3">
                <Alert>
                  <AlertTitle>Someone already requested a crosswalk here</AlertTitle>
                  <AlertDescription>
                    Adding your name to an existing request makes it stronger.
                  </AlertDescription>
                </Alert>
                <ul className="flex flex-col gap-2">
                  {nearby.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3">
                      <span className="text-sm">
                        {c.label && <span className="block font-medium">{c.label}</span>}
                        <span className="block text-muted-foreground">
                          {c.distance} m away, {c.supporterCount}{" "}
                          {c.supporterCount === 1 ? "supporter" : "supporters"}
                        </span>
                      </span>
                      <Link href={`/c/${c.id}`} className={buttonVariants({ size: "sm" })}>
                        Support this one
                      </Link>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" onClick={() => setIgnoreNearby(true)}>
                  No, this is a different crossing
                </Button>
              </CardContent>
            )}
          </Card>
        )}

        {picked && !lookingUp && !showNearby && (
          <Card>
            <CardHeader>
              <CardTitle>3. Your info</CardTitle>
              <CardDescription>
                We&apos;ll email you a link to confirm. Once confirmed, your request goes on the map
                and you can print a sign.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={action} className="flex flex-col gap-5">
                <input type="hidden" name="lat" value={picked.lat} />
                <input type="hidden" name="lng" value={picked.lng} />
                <input type="hidden" name="label" value={lookup?.label ?? ""} />
                <input type="hidden" name="locality" value={lookup?.locality ?? ""} />
                <input type="hidden" name="signature" value={lookup?.signature ?? ""} />
                <ContactFields state={state} />
                {state?.error && (
                  <Alert variant="destructive">
                    <AlertDescription>{state.error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" size="lg" disabled={submitting}>
                  {submitting && <Spinner data-icon="inline-start" />}
                  Request this crosswalk
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
