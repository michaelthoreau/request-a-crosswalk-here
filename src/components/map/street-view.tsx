import { cn } from "@/lib/utils"
import type { LatLng } from "@/lib/geo"

// Keyless Google Street View embed; shows a blank panel where there's no imagery.
export function StreetView({ point, className }: { point: LatLng; className?: string }) {
  const src = `https://www.google.com/maps/embed?origin=mfe&pb=!6m6!1m5!2m2!1d${point.lat}!2d${point.lng}!4f-0!5f1`
  return (
    <iframe
      key={src}
      src={src}
      title="Street View of the selected spot"
      loading="lazy"
      allowFullScreen
      referrerPolicy="no-referrer-when-downgrade"
      className={cn("h-44 w-full rounded-lg border-0 bg-muted", className)}
    />
  )
}
