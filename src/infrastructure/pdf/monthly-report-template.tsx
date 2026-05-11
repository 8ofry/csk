// Monthly performance report PDF (FR-MR-04).
// CSK-branded — black + gold accent, Tajawal Arabic font.

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { MonthlyReportPdfInput } from "./pdf";
import { ensureFontsRegistered } from "./fonts";

ensureFontsRegistered();

// Re-export so callers can rely on Font being initialized
export { Font };

const COLORS = {
  black: "#0A0A0A",
  gold: "#D4AF37",
  goldLight: "#E8C766",
  muted: "#666666",
  border: "#E5E5E5",
  panel: "#F8F8F8",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: COLORS.black,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
  },
  header: {
    backgroundColor: COLORS.black,
    color: "#FFFFFF",
    padding: 20,
    marginBottom: 24,
    borderRadius: 4,
  },
  headerBrand: {
    color: COLORS.gold,
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 700,
    marginTop: 6,
    color: "#FFFFFF",
  },
  headerSub: {
    fontSize: 11,
    marginTop: 4,
    color: "#D4D4D4",
  },
  meta: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  metaItem: {
    flex: 1,
    border: `1pt solid ${COLORS.border}`,
    borderRadius: 4,
    padding: 12,
  },
  metaLabel: {
    fontSize: 8,
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  metaValue: {
    fontSize: 16,
    fontWeight: 700,
    color: COLORS.gold,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginTop: 16,
    marginBottom: 10,
    paddingBottom: 4,
    borderBottom: `2pt solid ${COLORS.gold}`,
  },
  attendanceGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  attendanceCell: {
    flex: 1,
    backgroundColor: COLORS.panel,
    padding: 10,
    borderRadius: 4,
    alignItems: "center",
  },
  attendanceLabel: {
    fontSize: 8,
    color: COLORS.muted,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  attendanceValue: {
    fontSize: 18,
    fontWeight: 700,
    color: COLORS.black,
  },
  rowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottom: `0.5pt solid ${COLORS.border}`,
  },
  narrative: {
    fontSize: 10,
    lineHeight: 1.5,
    color: "#333",
    backgroundColor: COLORS.panel,
    padding: 12,
    borderRadius: 4,
    marginTop: 8,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: COLORS.muted,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTop: `0.5pt solid ${COLORS.border}`,
  },
  watermark: {
    position: "absolute",
    bottom: 110,
    right: 40,
    fontSize: 80,
    color: COLORS.gold,
    opacity: 0.06,
    fontWeight: 700,
  },
});

export function MonthlyReportDocument(input: MonthlyReportPdfInput) {
  const { traineeName, groupName, periodLabel, attendance, averageEffort, narrative, milestones } =
    input;
  const ratePct = Math.round(attendance.rate * 100);

  return (
    <Document
      title={`CSK Monthly Report — ${traineeName} — ${periodLabel}`}
      author="CSK Academy"
      subject={`Monthly performance report for ${traineeName}`}
      creator="CSK Academy Management System"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerBrand}>CSK ACADEMY</Text>
          <Text style={styles.headerTitle}>Monthly performance report</Text>
          <Text style={styles.headerSub}>
            {traineeName} · {groupName} · {periodLabel}
          </Text>
        </View>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Attendance rate</Text>
            <Text style={styles.metaValue}>{ratePct}%</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Sessions attended</Text>
            <Text style={styles.metaValue}>
              {attendance.present + attendance.late} / {attendance.total}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Avg effort (1–10)</Text>
            <Text style={styles.metaValue}>
              {averageEffort != null ? averageEffort.toFixed(1) : "—"}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Attendance breakdown</Text>
        <View style={styles.attendanceGrid}>
          <View style={styles.attendanceCell}>
            <Text style={styles.attendanceLabel}>Present</Text>
            <Text style={styles.attendanceValue}>{attendance.present}</Text>
          </View>
          <View style={styles.attendanceCell}>
            <Text style={styles.attendanceLabel}>Late</Text>
            <Text style={styles.attendanceValue}>{attendance.late}</Text>
          </View>
          <View style={styles.attendanceCell}>
            <Text style={styles.attendanceLabel}>Absent</Text>
            <Text style={styles.attendanceValue}>{attendance.absent}</Text>
          </View>
          <View style={styles.attendanceCell}>
            <Text style={styles.attendanceLabel}>Excused</Text>
            <Text style={styles.attendanceValue}>{attendance.excused}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Milestones</Text>
        {milestones.length === 0 ? (
          <Text style={{ color: COLORS.muted, fontSize: 10 }}>
            No belt or championship milestones this period.
          </Text>
        ) : (
          <View>
            {milestones.map((m, i) => (
              <View key={`${m.type}-${i}`} style={styles.rowItem}>
                <Text>{m.label}</Text>
                <Text style={{ color: COLORS.muted }}>{m.date}</Text>
              </View>
            ))}
          </View>
        )}

        {narrative && (
          <>
            <Text style={styles.sectionTitle}>Coach&apos;s summary</Text>
            <Text style={styles.narrative}>{narrative}</Text>
          </>
        )}

        <Text style={styles.watermark} fixed>
          ⚔
        </Text>

        <View style={styles.footer} fixed>
          <Text>© CSK — Team Cap Saied</Text>
          <Text>Confidential</Text>
          <Text
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
