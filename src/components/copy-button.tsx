"use client"

import { CheckIcon, CopyIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export function CopyButton({
  text,
  label = "Copy",
  ...props
}: { text: string; label?: string } & Omit<React.ComponentProps<typeof Button>, "onClick">) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      {...props}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          toast.success("Copied to clipboard")
          setTimeout(() => setCopied(false), 2000)
        } catch {
          toast.error("Couldn't copy. Select the text and copy it manually.")
        }
      }}
    >
      {copied ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
      {label}
    </Button>
  )
}
