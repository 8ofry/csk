// CSK certificate PDF (FR-CRT-03 v2 path).
// Single-page A4 landscape with gold border + black + gold accents.

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { ensureFontsRegistered } from "./fonts";

ensureFontsRegistered();
export { Font };

export interface CertificatePdfInput {
  recipientName: string;
  awardTitle: string;
  narrative: string;
  periodLabel: string; // e.g. "May 2026"
  issuedByName: string;
  issuedDate: string; // e.g. "11 May 2026"
}

const COLORS = {
  black: "#0A0A0A",
  gold: "#D4AF37",
  goldLight: "#E8C766",
  muted: "#666",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 12,
    color: COLORS.black,
    padding: 32,
  },
  outerBorder: {
    flex: 1,
    border: `4pt solid ${COLORS.gold}`,
    padding: 4,
  },
  innerBorder: {
    flex: 1,
    border: `1pt solid ${COLORS.gold}`,
    padding: 32,
    backgroundColor: "#FFFFFF",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  brand: {
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: 6,
    color: COLORS.gold,
  },
  swords: {
    fontSize: 20,
    color: COLORS.gold,
    marginHorizontal: 12,
  },
  title: {
    fontSize: 38,
    fontWeight: 700,
    textAlign: "center",
    color: COLORS.black,
    marginTop: 24,
  },
  subtitle: {
    fontSize: 11,
    textAlign: "center",
    color: COLORS.muted,
    letterSpacing: 4,
    marginTop: 4,
    textTransform: "uppercase",
  },
  presentedTo: {
    fontSize: 12,
    textAlign: "center",
    color: COLORS.muted,
    marginTop: 40,
  },
  recipient: {
    fontSize: 32,
    fontWeight: 700,
    textAlign: "center",
    color: COLORS.gold,
    marginTop: 12,
    paddingBottom: 12,
    borderBottom: `1pt solid ${COLORS.gold}`,
  },
  award: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 28,
    fontWeight: 500,
  },
  narrative: {
    fontSize: 11,
    textAlign: "center",
    color: "#333",
    marginTop: 20,
    paddingHorizontal: 60,
    lineHeight: 1.5,
  },
  footerRow: {
    position: "absolute",
    bottom: 64,
    left: 64,
    right: 64,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBlock: {
    alignItems: "center",
    width: 200,
  },
  signatureLine: {
    width: "100%",
    borderBottom: `1pt solid ${COLORS.black}`,
    marginBottom: 6,
    height: 24,
  },
  signatureLabel: {
    fontSize: 9,
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  signatureName: {
    fontSize: 11,
    fontWeight: 700,
    marginTop: 2,
  },
});

export function CertificateDocument(input: CertificatePdfInput) {
  return (
    <Document
      title={`CSK Certificate — ${input.recipientName} — ${input.awardTitle}`}
      author="CSK Academy"
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.outerBorder}>
          <View style={styles.innerBorder}>
            <View style={styles.brandRow}>
              <Text style={styles.swords}>⚔</Text>
              <Text style={styles.brand}>CSK ACADEMY</Text>
              <Text style={styles.swords}>⚔</Text>
            </View>

            <Text style={styles.title}>Certificate of Achievement</Text>
            <Text style={styles.subtitle}>{input.periodLabel}</Text>

            <Text style={styles.presentedTo}>This certificate is proudly presented to</Text>
            <Text style={styles.recipient}>{input.recipientName}</Text>

            <Text style={styles.award}>{input.awardTitle}</Text>
            <Text style={styles.narrative}>{input.narrative}</Text>

            <View style={styles.footerRow}>
              <View style={styles.signatureBlock}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLabel}>Issued by</Text>
                <Text style={styles.signatureName}>{input.issuedByName}</Text>
              </View>
              <View style={styles.signatureBlock}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLabel}>Date</Text>
                <Text style={styles.signatureName}>{input.issuedDate}</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
