import type { Metadata } from "next"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = { title: "Check your email" }

export default async function CheckEmailPage({ searchParams }: PageProps<"/check-email">) {
  const { status } = await searchParams
  const invalid = status === "invalid"

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 items-center px-4 py-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl">
            {invalid ? "That link didn't work" : "Check your email"}
          </CardTitle>
          <CardDescription className="text-base">
            {invalid
              ? "The confirmation link is invalid or has expired. Links are good for 24 hours. Please submit the form again to get a new one."
              : "We sent you a link to confirm your email address. Click it to be counted. The link expires in 24 hours. Don't see it? Check your spam folder."}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Back to the map
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
