import "server-only"
import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer"
import QRCode from "qrcode"
import { SITE_HOST, crosswalkUrl } from "./site"

// Half-letter portrait, in points.
const HALF_LETTER = { width: 5.5 * 72, height: 8.5 * 72 }
const PAGE_MARGIN = 18
const FRAME_WIDTH = HALF_LETTER.width - PAGE_MARGIN * 2
// Outer border + gap + inner border + inner padding, on each side.
const QR_SIZE = FRAME_WIDTH - 2 * (5 + 5 + 2 + 12)

const colors = {
  green: "#105028",
  ink: "#061A1E",
  paper: "#F8F8F8",
  seagreen: "#3B7A4F",
  powderblue: "#C4E4EA",
  white: "#FFFFFF",
}

export const SIGN_VARIANTS = ["color", "print"] as const
export type SignVariant = (typeof SIGN_VARIANTS)[number]

// "print" avoids large ink fills so it's cheap and crisp on a black-and-white printer.
const themes = {
  color: {
    headerBg: colors.green,
    headerText: colors.paper,
    headerRule: colors.green,
    frame: colors.green,
    frameGap: colors.powderblue,
    innerFrame: colors.seagreen,
    site: colors.green,
    location: colors.seagreen,
    footer: { backgroundColor: colors.green, height: 14 },
  },
  print: {
    headerBg: colors.white,
    headerText: colors.ink,
    headerRule: colors.ink,
    frame: colors.ink,
    frameGap: colors.white,
    innerFrame: colors.ink,
    site: colors.ink,
    location: colors.ink,
    footer: { backgroundColor: colors.ink, height: 3 },
  },
} satisfies Record<SignVariant, unknown>

const makeStyles = (t: (typeof themes)[SignVariant]) =>
  StyleSheet.create({
    page: { backgroundColor: colors.white, fontFamily: "Helvetica", color: colors.ink },
    header: {
      backgroundColor: t.headerBg,
      borderBottomWidth: 3,
      borderBottomColor: t.headerRule,
      paddingVertical: 16,
      paddingHorizontal: PAGE_MARGIN + 4,
    },
    kicker: { color: t.headerText, fontFamily: "Helvetica-Bold", fontSize: 26, lineHeight: 1.1 },
    title: { color: t.headerText, fontFamily: "Helvetica-Bold", fontSize: 46, lineHeight: 1 },
    body: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: PAGE_MARGIN },
    scan: { fontFamily: "Helvetica-Bold", fontSize: 18, marginBottom: 10, textAlign: "center" },
    frameOuter: {
      width: FRAME_WIDTH,
      borderWidth: 5,
      borderColor: t.frame,
      borderRadius: 22,
      padding: 5,
      backgroundColor: t.frameGap,
    },
    frameInner: {
      borderWidth: 2,
      borderColor: t.innerFrame,
      borderRadius: 14,
      padding: 12,
      backgroundColor: colors.white,
    },
    qr: { width: QR_SIZE, height: QR_SIZE },
    site: { fontFamily: "Helvetica-Bold", fontSize: 22, color: t.site, marginTop: 10 },
    permalink: { fontSize: 9, marginTop: 2 },
    location: { fontSize: 11, marginTop: 8, textAlign: "center", color: t.location },
    footer: t.footer,
  })

const stylesByVariant = {
  color: makeStyles(themes.color),
  print: makeStyles(themes.print),
}

type SignProps = {
  id: string
  label: string | null
  locality: string | null
  qr: string
  variant: SignVariant
}

function Sign({ id, label, locality, qr, variant }: SignProps) {
  const styles = stylesByVariant[variant]
  return (
    <Document title={`Request a Crosswalk Here${label ? `: ${label}` : ""}`} author={SITE_HOST}>
      <Page size={HALF_LETTER} style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Request a</Text>
          <Text style={styles.title}>Crosswalk Here</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.scan}>Scan to add your support</Text>
          <View style={styles.frameOuter}>
            <View style={styles.frameInner}>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt */}
              <Image src={qr} style={styles.qr} />
            </View>
          </View>
          <Text style={styles.site}>{SITE_HOST}</Text>
          <Text style={styles.permalink}>{`${SITE_HOST}/c/${id}`}</Text>
          {(label || locality) && (
            <Text style={styles.location}>{[label, locality].filter(Boolean).join(", ")}</Text>
          )}
        </View>
        <View style={styles.footer} />
      </Page>
    </Document>
  )
}

export async function renderSignPdf(crosswalk: Omit<SignProps, "qr">) {
  const qr = await QRCode.toDataURL(crosswalkUrl(crosswalk.id), {
    errorCorrectionLevel: "M",
    margin: 0,
    width: 800,
    color: { dark: colors.ink, light: colors.white },
  })
  return renderToBuffer(<Sign {...crosswalk} qr={qr} />)
}
