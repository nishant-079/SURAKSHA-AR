import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

import { Button, Card, Icon } from "@/src/components/ui";
import { getModule } from "@/src/content/modules";
import { tr, useI18n } from "@/src/i18n";
import { makeStyles, useTheme } from "@/src/theme";
import { storage } from "@/src/utils/storage";
import { LAST_RESULT_KEY } from "@/src/api";

type Result = {
  moduleId: string;
  score: number;
  correct: number;
  total: number;
  passed: boolean;
  threshold: number;
  durationSec: number;
  answers: number[];
};

export default function ResultScreen() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [result, setResult] = useState<Result | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => setResult(await storage.getItem<Result | null>(LAST_RESULT_KEY, null)))();
    }, []),
  );

  if (!result) return null;
  const module = getModule(result.moduleId);
  const passed = result.passed;
  const mainColor = passed ? colors.success : colors.error;
  const mins = Math.floor(result.durationSec / 60);
  const secs = result.durationSec % 60;

  return (
    <View style={styles.container} testID="result-screen">
      <ScrollView contentContainerStyle={[styles.body, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.resultCard, { backgroundColor: mainColor }]}>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>{passed ? `🎉 ${t("passed")}` : `⚠ ${t("failed")}`}</Text>
          </View>
          <CircularScore value={result.score} correct={result.correct} total={result.total} />
          <Text style={styles.congrats}>{passed ? t("congrats") : t("reviewNeeded")}</Text>
        </View>

        <View style={styles.statsRow}>
          <StatCard icon="timer-outline" iconBg="#DBEAFE" iconColor={colors.info} value={`${mins}m ${secs}s`} label={t("timeTaken")} />
          <StatCard icon="check-circle-outline" iconBg="#DCFCE7" iconColor={colors.success} value={`${result.correct}/${result.total}`} label={t("correct")} />
          <StatCard icon="chart-box-outline" iconBg="#FFEDD5" iconColor={colors.brandPrimary} value={`${result.threshold}%`} label={t("passMark")} />
        </View>

        {passed ? (
          <>
            <Button testID="get-certificate-btn" label={t("getCertificate")} variant="success" icon="certificate" onPress={() => router.replace(`/certificate/${result.moduleId}`)} />
            <Button testID="back-dashboard-btn" label={t("backToDashboard")} variant="outline" icon="home" onPress={() => router.replace("/dashboard")} />
          </>
        ) : (
          <>
            <Button testID="review-training-btn" label={t("reviewTraining")} icon="book-open-variant" onPress={() => router.replace(`/module/${result.moduleId}`)} />
            <Button testID="retry-assessment-btn" label={t("retryAssessment")} variant="outline" icon="refresh" onPress={() => router.replace(`/assessment/${result.moduleId}`)} />
          </>
        )}

        <Text style={styles.reviewTitle}>{t("answerReview")}</Text>
        {module?.questions.map((q, i) => {
          const userAns = result.answers[i];
          const ok = userAns === q.correctIndex;
          return (
            <Animated.View key={i} entering={FadeInUp.delay(i * 50)}>
              <Card style={styles.reviewCard}>
                <View style={styles.reviewHead}>
                  <Icon name={ok ? "check-circle" : "close-circle"} size={20} color={ok ? colors.success : colors.error} />
                  <Text style={styles.reviewQ}>Q{i + 1}: {tr(q.q, lang)}</Text>
                </View>
                <View style={styles.reviewAnswers}>
                  <Text style={[styles.reviewAns, { color: ok ? colors.success : colors.error }]}>
                    {t("yourAnswer")}: {tr(q.options[userAns], lang)}
                  </Text>
                  {!ok ? (
                    <Text style={[styles.reviewAns, { color: colors.success }]}>
                      {t("correctAnswer")}: {tr(q.options[q.correctIndex], lang)}
                    </Text>
                  ) : null}
                </View>
              </Card>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function StatCard({ icon, iconBg, iconColor, value, label }: { icon: string; iconBg: string; iconColor: string; value: string; label: string }) {
  const styles = useStyles();
  return (
    <Card style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
        <Icon name={icon} size={20} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

function CircularScore({ value, correct, total }: { value: number; correct: number; total: number }) {
  const styles = useStyles();
  const size = 180;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <View style={styles.circleWrap}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.25)" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#FFFFFF"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.circleCenter}>
        <Text style={styles.circleValue}>{value}%</Text>
        <Text style={styles.circleSub}>{correct}/{total}</Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.surface },
  body: { padding: 16, gap: 14 },
  resultCard: { borderRadius: 24, padding: 24, alignItems: "center", gap: 16 },
  statusPill: { backgroundColor: "rgba(255,255,255,0.25)", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999 },
  statusText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  congrats: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", textAlign: "center", lineHeight: 22 },
  circleWrap: { alignItems: "center", justifyContent: "center" },
  circleCenter: { position: "absolute", alignItems: "center" },
  circleValue: { color: "#FFFFFF", fontSize: 44, fontWeight: "900" },
  circleSub: { color: "rgba(255,255,255,0.85)", fontSize: 16, fontWeight: "700" },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, alignItems: "center", gap: 6, paddingVertical: 16 },
  statIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 16, fontWeight: "900", color: c.onSurface },
  statLabel: { fontSize: 11, color: c.muted, fontWeight: "600", textAlign: "center" },
  reviewTitle: { fontSize: 20, fontWeight: "800", color: c.onSurface, marginTop: 8 },
  reviewCard: { marginBottom: 10, gap: 8 },
  reviewHead: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  reviewQ: { flex: 1, fontSize: 14, fontWeight: "700", color: c.onSurface },
  reviewAnswers: { gap: 4, paddingLeft: 28 },
  reviewAns: { fontSize: 13, fontWeight: "600" },
}));
