import Link from "next/link"
import { cn } from "@/lib/utils"

// Visual gaps only (no space characters), so copying still yields the real URL.
const WORDS = ["request", "a", "crosswalk", "here.org"]

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="requestacrosswalkhere.org"
      className={cn("inline-flex gap-[0.18em] text-lg font-bold tracking-tight text-primary", className)}
    >
      {WORDS.map((word) => (
        <span key={word}>{word}</span>
      ))}
    </Link>
  )
}
