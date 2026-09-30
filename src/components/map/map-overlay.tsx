import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wordmark } from "@/components/wordmark"
import { cn } from "@/lib/utils"

export function MapOverlay({
  children,
  contentClassName,
}: {
  children?: React.ReactNode
  contentClassName?: string
}) {
  return (
    // Explicit width: CardHeader is a size container, so a shrink-to-fit card collapses.
    <Card
      size="sm"
      className="absolute top-3 left-3 z-10 w-[calc(100%-4.5rem)] max-w-80 shadow-md"
    >
      <CardHeader>
        <CardTitle>
          <Wordmark />
        </CardTitle>
        <CardDescription>
          Choose your favorite neglected crossing, print a sign, gather support of your neighbors.
        </CardDescription>
      </CardHeader>
      {children && (
        <CardContent className={cn("flex flex-col gap-3", contentClassName)}>{children}</CardContent>
      )}
    </Card>
  )
}
