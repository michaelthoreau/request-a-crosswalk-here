export const SITE_HOST = "requestacrosswalkhere.org"

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || `https://${SITE_HOST}`
).replace(/\/$/, "")

export const crosswalkUrl = (id: string) => `${SITE_URL}/c/${id}`
