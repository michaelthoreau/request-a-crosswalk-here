import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import { SITE_URL } from "@/lib/site"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Request a Crosswalk Here",
    template: "%s | Request a Crosswalk Here",
  },
  description:
    "Mark the spot where your neighborhood needs a crosswalk, post a sign, and gather neighbors' support.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <main className="flex flex-1 flex-col">{children}</main>
        <Toaster theme="light" />
        <Analytics />
      </body>
    </html>
  )
}
