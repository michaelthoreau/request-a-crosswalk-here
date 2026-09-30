import "server-only"
import { Buffer } from "node:buffer"
import { atPlace } from "./share-text"
import { renderSignPdf } from "./sign-pdf"
import { SITE_URL, crosswalkUrl } from "./site"

const API_KEY = process.env.RESEND_API_KEY
const FROM = process.env.EMAIL_FROM ?? "Request a Crosswalk Here <hello@requestacrosswalkhere.org>"

type Attachment = {
  filename: string
  content: string
  content_type?: string
}

type Email = {
  to: string
  subject: string
  paragraphs: string[]
  cta?: { label: string; url: string }[]
  attachments?: Attachment[]
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

async function send({ to, subject, paragraphs, cta = [], attachments }: Email) {
  const text = [
    ...paragraphs,
    ...cta.map((c) => `${c.label}: ${c.url}`),
    `Request a Crosswalk Here\n${SITE_URL}`,
  ].join("\n\n")

  const html = `<!doctype html><html><body style="margin:0;background:#F8F8F8;font-family:Helvetica,Arial,sans-serif;color:#061A1E">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="background:#105028;color:#F8F8F8;padding:20px 28px;font-size:18px;font-weight:bold">Request a Crosswalk Here</td></tr>
<tr><td style="padding:28px;font-size:16px;line-height:1.5">
${paragraphs.map((p) => `<p style="margin:0 0 16px">${esc(p)}</p>`).join("")}
${cta
  .map(
    (c) =>
      `<p style="margin:24px 0 0"><a href="${esc(c.url)}" style="display:inline-block;background:#105028;color:#F8F8F8;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold">${esc(c.label)}</a></p>`
  )
  .join("")}
</td></tr></table>
<p style="font-size:12px;color:#5B5B66;margin-top:16px"><a href="${SITE_URL}" style="color:#5B5B66">requestacrosswalkhere.org</a></p>
</td></tr></table></body></html>`

  if (!API_KEY) {
    const attachmentInfo = attachments?.length
      ? `\nattachments: ${attachments.map((a) => a.filename).join(", ")}`
      : ""
    console.info(`\n[email] to=${to}\nsubject: ${subject}${attachmentInfo}\n\n${text}\n`)
    return
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM,
      to,
      subject,
      text,
      html,
      ...(attachments && attachments.length > 0 ? { attachments } : {}),
    }),
  })
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`)
}

const verifyUrl = (token: string) => `${SITE_URL}/api/verify?token=${encodeURIComponent(token)}`

type Label = string | null

export function sendRequestVerification(to: string, name: string, label: Label, token: string) {
  return send({
    to,
    subject: "Confirm your crosswalk request",
    paragraphs: [
      `Hi ${name},`,
      `Thanks for requesting a crosswalk${atPlace(label)}. Confirm your email to put it on the map. This link expires in 24 hours.`,
      "If you didn't make this request, you can ignore this email.",
    ],
    cta: [{ label: "Confirm and publish", url: verifyUrl(token) }],
  })
}

export function sendSupportVerification(to: string, name: string, label: Label, token: string) {
  return send({
    to,
    subject: `Confirm your support for a crosswalk${atPlace(label)}`,
    paragraphs: [
      `Hi ${name},`,
      `Confirm your email to add your name to the request for a crosswalk${atPlace(label)}. This link expires in 24 hours.`,
      "If you didn't sign up, you can ignore this email.",
    ],
    cta: [{ label: "Confirm my support", url: verifyUrl(token) }],
  })
}

export function sendAlreadySupporting(to: string, crosswalkId: string, label: Label) {
  return send({
    to,
    subject: `You already support a crosswalk${atPlace(label)}`,
    paragraphs: [
      `Good news: this email address is already counted as a supporter of a crosswalk${atPlace(label)}.`,
      "Is there another spot that needs one?",
    ],
    cta: [
      { label: "See the request", url: crosswalkUrl(crosswalkId) },
      { label: "Request another crosswalk", url: `${SITE_URL}/request` },
    ],
  })
}

export type CrosswalkForEmail = {
  id: string
  label: string | null
  locality?: string | null
}

export async function sendRequestPublished(
  to: string,
  crosswalkOrId: string | CrosswalkForEmail,
  maybeLabel?: Label
) {
  const crosswalk: CrosswalkForEmail =
    typeof crosswalkOrId === "string"
      ? { id: crosswalkOrId, label: maybeLabel ?? null, locality: null }
      : crosswalkOrId

  const [colorPdf, printPdf] = await Promise.all([
    renderSignPdf({
      id: crosswalk.id,
      label: crosswalk.label,
      locality: crosswalk.locality ?? null,
      variant: "color",
    }),
    renderSignPdf({
      id: crosswalk.id,
      label: crosswalk.label,
      locality: crosswalk.locality ?? null,
      variant: "print",
    }),
  ])

  return send({
    to,
    subject: `Your crosswalk request${atPlace(crosswalk.label)} is live`,
    paragraphs: [
      `Your request for a crosswalk${atPlace(crosswalk.label)} is now on the map.`,
      "Next step: print the half-page sign and post it at the spot so neighbors can scan the QR code and add their names. We've attached both the full color and printer-friendly PDF signs to this email so you can print them directly. Tip: print on cardstock and use a sheet protector to keep it dry.",
    ],
    cta: [
      { label: "Print sign: full color", url: `${crosswalkUrl(crosswalk.id)}/sign` },
      {
        label: "Print sign: printer friendly",
        url: `${crosswalkUrl(crosswalk.id)}/sign?style=print`,
      },
      { label: "View the request", url: crosswalkUrl(crosswalk.id) },
    ],
    attachments: [
      {
        filename: `crosswalk-sign-${crosswalk.id}-color.pdf`,
        content: Buffer.from(colorPdf).toString("base64"),
        content_type: "application/pdf",
      },
      {
        filename: `crosswalk-sign-${crosswalk.id}-print.pdf`,
        content: Buffer.from(printPdf).toString("base64"),
        content_type: "application/pdf",
      },
    ],
  })
}

export function sendSupportConfirmed(to: string, crosswalkId: string, label: Label) {
  return send({
    to,
    subject: `You're counted: crosswalk${atPlace(label)}`,
    paragraphs: [
      `Thanks for adding your name to the request for a crosswalk${atPlace(label)}.`,
      "Know another spot where crossing the street feels unsafe? Request a crosswalk there too, and we'll give you a sign to post.",
    ],
    cta: [
      { label: "Request a crosswalk somewhere else", url: `${SITE_URL}/request` },
      { label: "View this request", url: crosswalkUrl(crosswalkId) },
    ],
  })
}

export function sendSupporterJoined({
  to,
  requesterName,
  supporterName,
  crosswalkId,
  label,
  supporterCount,
}: {
  to: string
  requesterName: string
  supporterName?: string | null
  crosswalkId: string
  label: Label
  supporterCount?: number
}) {
  const who = supporterName ? supporterName : "A neighbor"
  const countParagraph =
    typeof supporterCount === "number" && supporterCount > 0
      ? `Your request now has ${supporterCount} ${supporterCount === 1 ? "supporter" : "supporters"}.`
      : null

  return send({
    to,
    subject: `Someone joined your crosswalk request${atPlace(label)}`,
    paragraphs: [
      `Hi ${requesterName},`,
      `${who} just joined your request for a crosswalk${atPlace(label)}.`,
      ...(countParagraph ? [countParagraph] : []),
      "As more neighbors join, your case for a crosswalk gets stronger. When you're ready, you can print or copy your form letter to send to your city.",
    ],
    cta: [
      { label: "View the request", url: crosswalkUrl(crosswalkId) },
      { label: "Form letter to your city", url: `${crosswalkUrl(crosswalkId)}/letter` },
    ],
  })
}
