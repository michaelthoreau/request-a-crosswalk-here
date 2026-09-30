export const SITE_HOST = "requestacrosswalkhere.org"

const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || SITE_HOST

export const SITE_URL = (
  /^https?:\/\//.test(rawSiteUrl) ? rawSiteUrl : `https://${rawSiteUrl}`
).replace(/\/$/, "")

export const crosswalkUrl = (id: string) => `${SITE_URL}/c/${id}`
