"use client"

import { useActionState } from "react"
import { supportCrosswalk } from "@/app/actions"
import { ContactFields } from "@/components/contact-fields"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

export function SupportForm({ crosswalkId }: { crosswalkId: string }) {
  const [state, action, pending] = useActionState(supportCrosswalk, null)
  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="crosswalkId" value={crosswalkId} />
      <ContactFields state={state} />
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" size="lg" disabled={pending}>
        {pending && <Spinner data-icon="inline-start" />}
        Submit
      </Button>
    </form>
  )
}
