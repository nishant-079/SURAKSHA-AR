import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Card, Icon } from "@/src/components/ui";
import { useI18n } from "@/src/i18n";
import { makeStyles, useTheme } from "@/src/theme";

const STEPS = [
  { icon: "translate", title: "Choose language", desc: "English, Hindi or Santali." },
  { icon: "cube-scan", title: "Start AR training", desc: "Open camera, scan the area, place the scenario." },
  { icon: "gesture-tap", title: "Complete tasks", desc: "Tap hazards, choose PPE, order the evacuation." },
  { icon: "clipboard-check", title: "Take assessment", desc: "Answer safety questions to test your knowledge." },
  { icon: "certificate", title: "Earn certificate", desc: "Pass to receive a QR-verifiable certificate." },
];

export default function HelpScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container} testID="help-screen">
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Button label={t("back")} variant="ghost" icon="arrow-left" full={false} onPress={() => router.back()} />
        <Text style={styles.title}>{t("helpInstructions")}</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>How it works</Text>
        {STEPS.map((s, i) => (
          <Card key={i} style={styles.stepCard}>
            <View style={styles.stepRow}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>{i + 1}</Text></View>
              <View style={styles.stepIcon}><Icon name={s.icon} size={22} color={colors.brandPrimary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepDesc}>{s.desc}</Text>
              </View>
            </View>
          </Card>
        ))}

        <Card style={styles.disclaimerCard}>
          <View style={styles.discHead}>
            <Icon name="shield-alert-outline" size={22} color={colors.warning} />
            <Text style={styles.discTitle}>Safety Disclaimer</Text>
          </View>
          <Text style={styles.discText}>{t("disclaimer")}</Text>
        </Card>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.surface },
  header: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: c.border },
  title: { fontSize: 20, fontWeight: "900", color: c.onSurface },
  body: { padding: 16, gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: c.onSurface, marginBottom: 4 },
  stepCard: {},
  stepRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: c.surfaceInverse, alignItems: "center", justifyContent: "center" },
  stepNumText: { color: c.onSurfaceInverse, fontSize: 14, fontWeight: "900" },
  stepIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center" },
  stepTitle: { fontSize: 15, fontWeight: "800", color: c.onSurface },
  stepDesc: { fontSize: 13, color: c.muted, marginTop: 2 },
  disclaimerCard: { backgroundColor: c.surfaceTertiary, borderColor: c.surfaceTertiary, marginTop: 8 },
  discHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  discTitle: { fontSize: 15, fontWeight: "800", color: c.onSurface },
  discText: { fontSize: 13, color: c.onSurfaceTertiary, lineHeight: 19 },
}));
