import { MailCheckIcon } from "lucide-react"
import type { ReactNode } from "react"

export function CheckEmailNotice({
  email,
  purpose,
  children,
}: {
  email?: string
  purpose: string
  children?: ReactNode
}) {
  return (
    <div
      role="status"
      className="flex items-start gap-4 rounded-xl bg-primary/5 p-5 ring-1 ring-primary/40"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        <MailCheckIcon className="size-5" />
      </span>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-lg font-semibold">Check your email</h2>
          <p>
            We sent a confirmation link to{" "}
            {email ? <span className="font-semibold break-all">{email}</span> : "your inbox"}.
            Click it to {purpose}.
          </p>
          <p className="text-sm text-muted-foreground">
            The link expires in 24 hours. Don&apos;t see it? Check your spam folder.
          </p>
        </div>
        {children && <div>{children}</div>}
      </div>
    </div>
  )
}
