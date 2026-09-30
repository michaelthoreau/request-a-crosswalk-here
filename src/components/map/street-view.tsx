"use client"

import { EyeIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
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

export function StreetViewButton({ point, className }: { point: LatLng; className?: string }) {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" className={className} />}>
        <EyeIcon data-icon="inline-start" />
        Street View
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Street View</DialogTitle>
          <DialogDescription>
            Drag to look around. If it&apos;s blank, there&apos;s no imagery at this spot.
          </DialogDescription>
        </DialogHeader>
        <iframe
          src={embedUrl(point)}
          title="Street View of the selected spot"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          className="h-[65vh] w-full rounded-lg border-0 bg-muted"
        />
      </DialogContent>
    </Dialog>
  )
}
