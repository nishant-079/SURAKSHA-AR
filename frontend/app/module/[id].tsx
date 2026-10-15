import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Card, Icon } from "@/src/components/ui";
import { getModule } from "@/src/content/modules";
import { tr, useI18n } from "@/src/i18n";
import { makeStyles, useTheme } from "@/src/theme";

const HERO: Record<string, string> = {
  fire: "https://images.unsplash.com/photo-1563062067-7700e1d9ae1d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODF8MHwxfHNlYXJjaHwxfHxmYWN0b3J5JTIwZmlyZSUyMHNhZmV0eXxlbnwwfHx8fDE3OTA1OTY3MjJ8MA&ixlib=rb-4.1.0&q=85",
  gas: "https://images.unsplash.com/photo-1659188269611-a360680474f0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzV8MHwxfHNlYXJjaHwyfHxjb2FsJTIwbWluZSUyMHdvcmtlciUyMHNhZmV0eXxlbnwwfHx8fDE3OTA1OTY3MjJ8MA&ixlib=rb-4.1.0&q=85",
};

export default function ModuleIntro() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, lang } = useI18n();
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const module = getModule(String(id));
  if (!module) return null;

  return (
    <View style={styles.container} testID="module-intro-screen">
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image source={{ uri: HERO[module.id] }} style={styles.heroImg} contentFit="cover" />
          <View style={styles.heroOverlay} />
          <View style={[styles.heroTop, { paddingTop: insets.top + 8 }]}>
            <Button label={t("back")} variant="ghost" icon="arrow-left" full={false} onPress={() => router.back()} style={styles.backBtn} />
          </View>
          <View style={styles.heroContent}>
            <View style={[styles.moduleIcon, { backgroundColor: module.color }]}>
              <Icon name={module.icon} size={30} color="#FFFFFF" />
            </View>
            <Text style={styles.heroTitle}>{tr(module.title, lang)}</Text>
            <Text style={styles.heroSub}>{tr(module.subtitle, lang)}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Card style={styles.scenarioCard} accent={module.color}>
            <View style={styles.scenarioHead}>
              <Icon name="alert-decagram" size={22} color={module.color} />
              <Text style={styles.scenarioLabel}>Scenario</Text>
            </View>
            <Text style={styles.scenarioText}>{tr(module.scenario, lang)}</Text>
          </Card>

          <Card>
            <Text style={styles.aboutTitle}>About this module</Text>
            <Text style={styles.aboutText}>{tr(module.description, lang)}</Text>
            <View style={styles.taskList}>
              {module.tasks.map((tk, i) => (
                <View key={i} style={styles.taskRow}>
                  <View style={styles.taskNum}>
                    <Text style={styles.taskNumText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.taskText}>{tr((tk as any).prompt, lang)}</Text>
                </View>
              ))}
            </View>
          </Card>

          <Card style={styles.disclaimerCard}>
            <View style={styles.disclaimerRow}>
              <Icon name="information-outline" size={20} color={colors.warning} />
              <Text style={styles.disclaimerText}>{t("disclaimer")}</Text>
            </View>
          </Card>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button testID="start-ar-btn" label={`${t("startTraining")} · AR`} icon="cube-scan" onPress={() => router.push(`/ar/${module.id}`)} />
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.surface },
  hero: { height: 300, backgroundColor: c.surfaceInverse },
  heroImg: { ...({ position: "absolute" } as const), width: "100%", height: "100%" },
  heroOverlay: { ...({ position: "absolute" } as const), width: "100%", height: "100%", backgroundColor: "rgba(15,23,42,0.7)" },
  heroTop: { paddingHorizontal: 12 },
  backBtn: { minHeight: 44, paddingHorizontal: 12 },
  heroContent: { position: "absolute", bottom: 24, left: 20, right: 20, gap: 8 },
  moduleIcon: { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  heroTitle: { fontSize: 26, fontWeight: "900", color: "#FFFFFF" },
  heroSub: { fontSize: 14, color: "#E2E8F0" },
  body: { padding: 16, gap: 14, marginTop: -16 },
  scenarioCard: { gap: 10, backgroundColor: c.surfaceSecondary },
  scenarioHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  scenarioLabel: { fontSize: 13, fontWeight: "800", color: c.muted, textTransform: "uppercase", letterSpacing: 1 },
  scenarioText: { fontSize: 17, fontWeight: "700", color: c.onSurface, lineHeight: 24 },
  aboutTitle: { fontSize: 16, fontWeight: "800", color: c.onSurface, marginBottom: 6 },
  aboutText: { fontSize: 14, color: c.onSurfaceSecondary, lineHeight: 20 },
  taskList: { marginTop: 14, gap: 12 },
  taskRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  taskNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center" },
  taskNumText: { fontSize: 13, fontWeight: "800", color: c.onBrandTertiary },
  taskText: { flex: 1, fontSize: 14, fontWeight: "600", color: c.onSurfaceSecondary },
  disclaimerCard: { backgroundColor: c.surfaceTertiary, borderColor: c.surfaceTertiary },
  disclaimerRow: { flexDirection: "row", gap: 10 },
  disclaimerText: { flex: 1, fontSize: 12, color: c.onSurfaceTertiary, lineHeight: 18 },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 12, backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.border },
}));
