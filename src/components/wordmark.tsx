import Link from "next/link"
import { cn } from "@/lib/utils"

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="requestacrosswalkhere.org"
      className={cn("text-lg font-bold tracking-tight text-primary", className)}
    >
      requesta<span className="underline decoration-2 underline-offset-4">crosswalk</span>here.org
    </Link>
  )
}
