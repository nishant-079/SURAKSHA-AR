import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Icon } from "@/src/components/ui";
import { loadProfile, registerProfile } from "@/src/api";
import { FIRE_MODULE, GAS_MODULE } from "@/src/content/modules";
import { tr, useI18n } from "@/src/i18n";
import { makeStyles, useTheme } from "@/src/theme";

export default function DemoScreen() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string>("fire");

  const scenarios = [FIRE_MODULE, GAS_MODULE];

  const start = async () => {
    let profile = await loadProfile();
    if (!profile) {
      profile = await registerProfile({ name: "Demo Worker", workerId: "WK-DEMO-001", language: lang, sector: "mining" });
    }
    router.push(`/ar/${selected}`);
  };

  return (
    <View style={styles.container} testID="demo-screen">
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Button label={t("back")} variant="ghost" icon="arrow-left" full={false} onPress={() => router.back()} />
        <View style={styles.demoBadge}>
          <Icon name="flash" size={16} color={colors.onBrandPrimary} />
          <Text style={styles.demoBadgeText}>{t("demoMode")}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>Select Scenario</Text>
        <Text style={styles.subtitle}>Instantly experience the AR training flow — no setup needed.</Text>

        <View style={styles.grid}>
          {scenarios.map((m) => {
            const active = selected === m.id;
            return (
              <Pressable
                key={m.id}
                testID={`demo-scenario-${m.id}`}
                onPress={() => setSelected(m.id)}
                style={[styles.scenarioCard, active && { borderColor: m.color, backgroundColor: `${m.color}12` }]}
              >
                <View style={[styles.scenarioIcon, { backgroundColor: m.color }]}>
                  <Icon name={m.icon} size={34} color="#FFFFFF" />
                </View>
                <Text style={styles.scenarioTitle}>{tr(m.title, lang)}</Text>
                <Text style={styles.scenarioTasks}>{m.tasks.length} AR tasks · {m.questions.length} questions</Text>
                {active ? <View style={[styles.check, { backgroundColor: m.color }]}><Icon name="check" size={16} color="#FFFFFF" /></View> : null}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sampleCard}>
          <Icon name="account-hard-hat" size={22} color={colors.info} />
          <View style={{ flex: 1 }}>
            <Text style={styles.sampleTitle}>Sample worker: Demo Worker</Text>
            <Text style={styles.sampleSub}>Mining sector · WK-DEMO-001</Text>
          </View>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button testID="demo-start-btn" label={`Start AR Training`} icon="cube-scan" onPress={start} />
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.surface },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 8, paddingRight: 16, paddingBottom: 4 },
  demoBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: c.brandPrimary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  demoBadgeText: { color: c.onBrandPrimary, fontSize: 13, fontWeight: "800" },
  body: { flex: 1, padding: 16, gap: 8 },
  title: { fontSize: 26, fontWeight: "900", color: c.onSurface },
  subtitle: { fontSize: 14, color: c.muted, marginBottom: 12 },
  grid: { gap: 14 },
  scenarioCard: { backgroundColor: c.surfaceSecondary, borderRadius: 18, padding: 20, borderWidth: 2, borderColor: c.border, alignItems: "center", gap: 8 },
  scenarioIcon: { width: 70, height: 70, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  scenarioTitle: { fontSize: 18, fontWeight: "800", color: c.onSurface, textAlign: "center" },
  scenarioTasks: { fontSize: 13, color: c.muted },
  check: { position: "absolute", top: 14, right: 14, width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  sampleCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: c.surfaceTertiary, borderRadius: 14, padding: 16, marginTop: 8 },
  sampleTitle: { fontSize: 14, fontWeight: "700", color: c.onSurface },
  sampleSub: { fontSize: 12, color: c.muted, marginTop: 2 },
  footer: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.border },
}));
