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
}

const styles = StyleSheet.create({
  page: { backgroundColor: "#FFFFFF", fontFamily: "Helvetica", color: colors.ink },
  header: { backgroundColor: colors.green, paddingVertical: 16, paddingHorizontal: PAGE_MARGIN + 4 },
  kicker: { color: colors.paper, fontFamily: "Helvetica-Bold", fontSize: 26, lineHeight: 1.1 },
  title: { color: colors.paper, fontFamily: "Helvetica-Bold", fontSize: 46, lineHeight: 1 },
  body: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: PAGE_MARGIN },
  scan: { fontFamily: "Helvetica-Bold", fontSize: 18, marginBottom: 10, textAlign: "center" },
  frameOuter: {
    width: FRAME_WIDTH,
    borderWidth: 5,
    borderColor: colors.green,
    borderRadius: 22,
    padding: 5,
    backgroundColor: colors.powderblue,
  },
  frameInner: {
    borderWidth: 2,
    borderColor: colors.seagreen,
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#FFFFFF",
  },
  qr: { width: QR_SIZE, height: QR_SIZE },
  site: { fontFamily: "Helvetica-Bold", fontSize: 22, color: colors.green, marginTop: 10 },
  permalink: { fontSize: 9, marginTop: 2 },
  location: { fontSize: 11, marginTop: 8, textAlign: "center", color: colors.seagreen },
  footer: { backgroundColor: colors.green, height: 14 },
})

type SignProps = { id: string; label: string | null; locality: string | null; qr: string }

function Sign({ id, label, locality, qr }: SignProps) {
  return (
    <Document title={`Request a Crosswalk Here${label ? `: ${label}` : ""}`} author={SITE_HOST}>
      <Page size={HALF_LETTER} style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Request a</Text>
          <Text style={styles.title}>
            <Text style={{ textDecoration: "underline" }}>Crosswalk</Text> Here
          </Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.scan}>Scan to add your name</Text>
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
    color: { dark: colors.ink, light: "#FFFFFF" },
  })
  return renderToBuffer(<Sign {...crosswalk} qr={qr} />)
}
