"use client"

import { XIcon } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { CrosswalkMap } from "@/components/map/crosswalk-map"
import { MapOverlay } from "@/components/map/map-overlay"
import { StreetViewButton } from "@/components/map/street-view"
import { Button, buttonVariants } from "@/components/ui/button"
import type { CrosswalkPoint } from "@/lib/crosswalks"
import type { LatLng } from "@/lib/geo"
import { cn } from "@/lib/utils"

export function HomeMap({ points }: { points: CrosswalkPoint[] }) {
  const [pin, setPin] = useState<LatLng | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPin(null)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const actions = (className: string) => (
    <div className={cn("flex gap-2", className)}>
      <Link
        href={pin ? `/request?lat=${pin.lat}&lng=${pin.lng}` : "/request"}
        className={cn(
          buttonVariants({ size: "lg" }),
          "h-12 flex-1 text-base",
          pin &&
            "bg-selected text-selected-foreground hover:bg-selected/90 motion-safe:animate-pulse-ring"
        )}
      >
        {pin ? (
          <>
            Request a crosswalk <strong className="font-extrabold">HERE</strong>
          </>
        ) : (
          "Request a crosswalk"
        )}
      </Link>
      {pin && (
        <Button
          variant="outline"
          size="icon-lg"
          className="size-12"
          aria-label="Cancel selected location"
          onClick={() => setPin(null)}
        >
          <XIcon />
        </Button>
      )}
    </div>
  )

  return (
    <div className="relative h-map-screen overflow-hidden">
      <CrosswalkMap points={points} onMapClick={setPin} pin={pin} className="absolute inset-0" />
      <MapOverlay contentClassName={pin ? undefined : "hidden md:flex"}>
        {pin && <StreetViewButton point={pin} className="w-full" />}
        {actions("hidden w-full md:flex")}
      </MapOverlay>
      {actions("absolute inset-x-4 bottom-8 z-10 *:shadow-lg md:hidden")}
    </div>
  )
}
