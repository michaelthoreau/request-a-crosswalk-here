"use client"

import { useActionState } from "react"
import { supportCrosswalk } from "@/app/actions"
import { CheckEmailNotice } from "@/components/check-email-notice"
import { ContactFields } from "@/components/contact-fields"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

export function SupportStep({
  crosswalkId,
  alreadySigned,
}: {
  crosswalkId: string
  alreadySigned: boolean
}) {
  const [state, action, pending] = useActionState(supportCrosswalk, null)
  const sent = state?.sent

  return (
    <>
      <Card className="ring-2 ring-primary">
        <CardHeader>
          <CardTitle className="text-lg">Step 1: Sign up to support this crosswalk</CardTitle>
          <CardDescription>
            {alreadySigned
              ? "You're signed up. On to step 2!"
              : sent
                ? "Almost there. Confirm your email to be counted."
                : "Haven't signed yet? Start here. We'll email you a link to confirm, then you're counted."}
          </CardDescription>
        </CardHeader>
        {!alreadySigned && !sent && (
          <CardContent>
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
          </CardContent>
        )}
      </Card>
      {sent && <CheckEmailNotice email={state.values?.email} purpose="be counted as a supporter" />}
    </>
  )
}
