"use client"

import { PrinterIcon } from "lucide-react"
import { useState } from "react"
import { CopyButton } from "@/components/copy-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { letterText } from "@/lib/share-text"

type Props = Omit<Parameters<typeof letterText>[0], "recipient">

export function LetterComposer(props: Props) {
  const [recipient, setRecipient] = useState("")
  const text = letterText({ ...props, recipient })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 print:hidden">
        <Field>
          <FieldLabel htmlFor="recipient">Who is this letter to?</FieldLabel>
          <Input
            id="recipient"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="e.g. Councilmember Jane Doe"
            maxLength={120}
          />
          <FieldDescription>
            A council member, your city&apos;s transportation department, or a neighborhood group.
          </FieldDescription>
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => window.print()}>
            <PrinterIcon data-icon="inline-start" />
            Print letter
          </Button>
          <CopyButton text={text} label="Copy text" variant="outline" />
        </div>
      </div>
      <Card className="print:shadow-none print:ring-0">
        <CardContent className="py-4 text-base leading-relaxed whitespace-pre-line print:p-0">
          {text}
        </CardContent>
      </Card>
    </div>
  )
}
