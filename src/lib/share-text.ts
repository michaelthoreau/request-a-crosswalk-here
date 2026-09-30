type Details = {
  label: string | null
  locality: string | null
  supporterCount: number
  url: string
}

/** " at A & B, Seattle, WA", " in Seattle, WA", or "" when nothing is known. */
export function atPlace(label: string | null, locality?: string | null) {
  if (label) return ` at ${[label, locality].filter(Boolean).join(", ")}`
  if (locality) return ` in ${locality}`
  return ""
}

const neighbors = (n: number) => `${n} ${n === 1 ? "neighbor" : "neighbors"}`

/** "3 neighbors have signed up to support" */
export const signedUp = (n: number) =>
  `${neighbors(n)} ${n === 1 ? "has" : "have"} signed up to support`

export function letterText(d: Details & { recipient: string; names: string[] }) {
  const lines = [
    `Dear ${d.recipient.trim() || "Transportation Officials"},`,
    `I am writing on behalf of ${neighbors(d.supporterCount)} who have signed up to support a marked crosswalk${atPlace(d.label, d.locality)}.`,
    "Each supporter confirmed their email address to add their name. People cross here today without a safe, marked place to do it, and a crosswalk would make this spot safer for everyone walking, rolling, and driving.",
    "We ask that you evaluate this location for a marked crosswalk and any other safety improvements it needs, such as signage, curb ramps, lighting, or a pedestrian signal.",
    `You can see the request and its current support at ${d.url}.`,
  ]
  if (d.names.length > 0) {
    lines.push(`Supporters who chose to share their names:\n${d.names.join("\n")}`)
  }
  lines.push(`Thank you for your time and consideration.\n\nSincerely,\n${neighbors(d.supporterCount)} who support this crosswalk`)
  return lines.join("\n\n")
}
