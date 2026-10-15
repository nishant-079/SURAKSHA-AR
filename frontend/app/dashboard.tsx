import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Badge,
  Card,
  ConnectionBanner,
  Icon,
  ProgressBar,
  SectionTitle,
} from "@/src/components/ui";
import {
  attemptCountFor,
  bestScoreFor,
  clearLocalTrainingData,
  clearProfile,
  isModulePassed,
  loadAttempts,
  loadCerts,
  loadProfile,
  type AttemptResult,
  type Certificate,
  type Profile,
} from "@/src/api";
import { MODULES } from "@/src/content/modules";
import { tr, useI18n } from "@/src/i18n";
import { makeStyles, useTheme } from "@/src/theme";

export default function Dashboard() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const handleLogout = async () => {  
  await clearProfile();
  router.replace("/login");
  };

  const [profile, setProfile] = useState<Profile | null>(null);
  const [attempts, setAttempts] = useState<AttemptResult[]>([]);
  const [certs, setCerts] = useState<Certificate[]>([]);

  useFocusEffect(
    useCallback(()=>{
      (async()=>{
        const profile = await loadProfile();
          setProfile(profile);
          setAttempts(await loadAttempts(profile?.id));
          setCerts(await loadCerts(profile?.id)); 
      })();
    },[]),
  );

  const activeModules = MODULES.filter((m) => m.status === "available");
  const completedCount = activeModules.filter((m) => isModulePassed(attempts, m.id)).length;
  const overallProgress = activeModules.length ? Math.round((completedCount / activeModules.length) * 100) : 0;
  const latestScore = attempts.length ? attempts[attempts.length - 1].score : null;

  return (
    <View style={styles.container} testID="dashboard-screen">
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Icon name="account-hard-hat" size={30} color={colors.onBrandPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>
              {t("greeting")}, {profile?.name?.split(" ")[0] || "Worker"} 👷
            </Text>
            <Text style={styles.subGreeting}>{profile?.sector ? `${t(profile.sector as any)} · ` : ""}{t("readyToTrain")}</Text>
          </View>
          <Pressable testID="help-btn" style={styles.iconBtn} onPress={() => router.push("/help")}>
            <Icon name="help-circle-outline" size={24} color={colors.onSurfaceInverse} />
          </Pressable>
        </View>
      </View>
      <ConnectionBanner />

      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        {/* Stats row */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Icon name="school" size={22} color={colors.brandPrimary} />
            <Text style={styles.statValue}>{completedCount}/{activeModules.length}</Text>
            <Text style={styles.statLabel}>{t("completed")}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Icon name="chart-line" size={22} color={colors.info} />
            <Text style={styles.statValue}>{latestScore != null ? `${latestScore}%` : "—"}</Text>
            <Text style={styles.statLabel}>{t("latestScore")}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Icon name="certificate" size={22} color={colors.success} />
            <Text style={styles.statValue}>{certs.length}</Text>
            <Text style={styles.statLabel}>{t("certificates")}</Text>
          </Card>
        </View>

        {/* Progress card */}
        <Card style={styles.progressCard}>
          <View style={styles.progressHead}>
            <Text style={styles.progressTitle}>{t("trainingProgress")}</Text>
            <Text style={styles.progressPct}>{overallProgress}%</Text>
          </View>
          <ProgressBar value={overallProgress} />
        </Card>

        {/* Demo mode */}
        <Card style={styles.demoCard} onPress={() => router.push("/demo")} testID="demo-mode-card">
          <View style={styles.demoRow}>
            <View style={styles.demoIcon}>
              <Icon name="play-circle" size={28} color={colors.onBrandPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.demoTitle}>{t("demoMode")}</Text>
              <Text style={styles.demoSub}>Quick AR demo — no setup needed</Text>
            </View>
            <Icon name="chevron-right" size={26} color={colors.muted} />
          </View>
        </Card>

        {/* Modules */}
        <View style={{ marginTop: 8 }}>
          <SectionTitle right={tr({ en: "Safety Modules", hi: "सुरक्षा मॉड्यूल", sat: "ᱥᱩᱨᱠᱷᱮᱚ ᱢᱚᱰᱭᱩᱞ" }, lang)}>
            {t("safetyModules")}
          </SectionTitle>
          {MODULES.map((m, i) => {
            const passed = isModulePassed(attempts, m.id);
            const started = attemptCountFor(attempts, m.id) > 0;
            const best = bestScoreFor(attempts, m.id);
            const soon = m.status === "coming-soon";
            const progress = passed ? 100 : started ? Math.max(20, best) : 0;
            return (
              <Animated.View key={m.id} entering={FadeInUp.delay(i * 60)}>
                <Card
                  testID={`module-${m.id}`}
                  accent={m.color}
                  style={styles.moduleCard}
                  onPress={soon ? undefined : () => router.push(`/module/${m.id}`)}
                >
                  <View style={styles.moduleTop}>
                    <View style={[styles.moduleIcon, { backgroundColor: `${m.color}22` }]}>
                      <Icon name={m.icon} size={26} color={m.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.moduleTitle}>{tr(m.title, lang)}</Text>
                      <Text style={styles.moduleSub} numberOfLines={1}>{tr(m.subtitle, lang)}</Text>
                    </View>
                    {soon ? (
                      <Badge label={t("comingSoon")} color={colors.surfaceTertiary} textColor={colors.onSurfaceTertiary} icon="clock-outline" />
                    ) : passed ? (
                      <Badge label={t("completed")} color={colors.success} textColor={colors.onSuccess} icon="check" />
                    ) : started ? (
                      <Badge label={t("inProgress")} color={colors.brandTertiary} textColor={colors.onBrandTertiary} icon="play" />
                    ) : (
                      <Badge label={t("startTraining")} color={colors.brandPrimary} textColor={colors.onBrandPrimary} icon="play" />
                    )}
                  </View>
                  {!soon ? (
                    <View style={styles.moduleProgress}>
                      <ProgressBar value={progress} color={m.color} />
                    </View>
                  ) : null}
                  <View style={styles.moduleMeta}>
                    <View style={styles.metaItem}>
                      <Icon name="book-open-variant" size={14} color={colors.muted} />
                      <Text style={styles.metaText}>{m.lessons} {t("lessons")}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Icon name="clock-outline" size={14} color={colors.muted} />
                      <Text style={styles.metaText}>{m.minutes} min</Text>
                    </View>
                  </View>
                </Card>
              </Animated.View>
            );
          })}
        </View>

        {/* Quick actions */}
        <View style={styles.actionsRow}>
          <Card style={styles.actionCard} onPress={() => router.push("/certificates")} testID="my-certificates-btn">
            <Icon name="certificate-outline" size={26} color={colors.brandPrimary} />
            <Text style={styles.actionText}>{t("myCertificates")}</Text>
          </Card>
          <Card style={styles.actionCard} onPress={() => router.push("/verify")} testID="verify-cert-btn">
            <Icon name="shield-check-outline" size={26} color={colors.success} />
            <Text style={styles.actionText}>{t("verifyCertificate")}</Text>
          </Card>
        </View>

        <Pressable style={styles.adminLink} onPress={() => router.push("/admin-login")} testID="admin-link">
          <Icon name="view-dashboard-outline" size={18} color={colors.muted} />
          <Text style={styles.adminText}>Admin / Compliance Dashboard</Text>
        </Pressable>
        <Pressable style={styles.logoutLink} onPress={handleLogout} testID="user-logout">
          <Icon name="logout" size={18} color={colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.surface },
  header: { backgroundColor: c.surfaceInverse, paddingHorizontal: 20, paddingBottom: 18, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center" },
  greeting: { fontSize: 20, fontWeight: "800", color: c.onSurfaceInverse },
  subGreeting: { fontSize: 13, color: c.muted, marginTop: 2 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  body: { padding: 16, gap: 14 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, alignItems: "center", gap: 4, paddingVertical: 16 },
  statValue: { fontSize: 20, fontWeight: "900", color: c.onSurface },
  statLabel: { fontSize: 11, color: c.muted, fontWeight: "600", textAlign: "center" },
  progressCard: { gap: 12 },
  progressHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressTitle: { fontSize: 16, fontWeight: "700", color: c.onSurface },
  progressPct: { fontSize: 18, fontWeight: "900", color: c.brandPrimary },
  demoCard: { backgroundColor: c.surfaceInverse, borderColor: c.surfaceInverse },
  demoRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  demoIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center" },
  demoTitle: { fontSize: 17, fontWeight: "800", color: c.onSurfaceInverse },
  demoSub: { fontSize: 12, color: c.muted, marginTop: 2 },
  moduleCard: { marginBottom: 12, gap: 12 },
  moduleTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  moduleIcon: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  moduleTitle: { fontSize: 16, fontWeight: "800", color: c.onSurface },
  moduleSub: { fontSize: 12, color: c.muted, marginTop: 2 },
  moduleProgress: {},
  moduleMeta: { flexDirection: "row", gap: 16 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 12, color: c.muted, fontWeight: "600" },
  actionsRow: { flexDirection: "row", gap: 12, marginTop: 4 },
  actionCard: { flex: 1, alignItems: "center", gap: 8, paddingVertical: 20 },
  actionText: { fontSize: 13, fontWeight: "700", color: c.onSurface, textAlign: "center" },
  adminLink: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, marginTop: 4 },
  adminText: { fontSize: 13, color: c.muted, fontWeight: "600" },
  logoutLink:{flexDirection:"row",alignItems:"center",justifyContent: "center",gap: 8,paddingVertical: 14,marginTop: 4,},
  logoutText:{fontSize: 13,color: c.error,fontWeight: "700",},
}));
