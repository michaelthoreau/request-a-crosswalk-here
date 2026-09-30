"use client"

import { EyeIcon, XIcon } from "lucide-react"
import { cn } from "cn"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { LatLng } from "@/lib/geo"

// Keyless Google Street View embed; shows a blank panel where there's no imagery.
const embedUrl = ({ lat, lng }: LatLng) =>
  `https://www.google.com/maps/embed?origin=mfe&pb=!6m6!1m5!2m2!1d${lat}!2d${lng}!4f-0!5f1`

// The embed doesn't pan reliably with touch, so phones open Google Maps instead.
const mapsUrl = ({ lat, lng }: LatLng) =>
  `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`

export function StreetViewButton({ point, className }: { point: LatLng; className?: string }) {
  return (
    <>
      <a
        href={mapsUrl(point)}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          buttonVariants({ variant: "outline" }),
          className,
          "hidden pointer-coarse:inline-flex"
        )}
      >
        <EyeIcon data-icon="inline-start" />
        Street View
      </a>
      <Dialog>
        <DialogTrigger
          render={
            <Button variant="outline" className={cn(className, "pointer-coarse:hidden")} />
          }
        >
          <EyeIcon data-icon="inline-start" />
          Street View
        </DialogTrigger>
        <DialogContent
          showCloseButton={false}
          className="top-0 left-0 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col rounded-none sm:max-w-none"
        >
          <div className="flex items-start justify-between gap-4">
            <DialogHeader>
              <DialogTitle>Street View</DialogTitle>
              <DialogDescription>
                Drag to look around. If it&apos;s blank, there&apos;s no imagery at this spot.
              </DialogDescription>
            </DialogHeader>
            <DialogClose render={<Button size="lg" className="h-11 px-4 text-base" />}>
              <XIcon data-icon="inline-start" className="size-5" />
              Close
            </DialogClose>
          </div>
          <iframe
            src={embedUrl(point)}
            title="Street View of the selected spot"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            className="min-h-0 w-full flex-1 rounded-lg border-0 bg-muted"
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
