import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/src/components/ui";
import { getPassThreshold, loadProfile, saveAttempt, LAST_RESULT_KEY } from "@/src/api";
import { getModule } from "@/src/content/modules";
import { tr, useI18n } from "@/src/i18n";
import { makeStyles, useTheme } from "@/src/theme";
import { storage } from "@/src/utils/storage";

export default function Assessment() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, lang } = useI18n();
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const module = getModule(String(id));
  const questions = module?.questions || [];
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const startRef = useRef(Date.now());

  if (!module) return null;
  const q = questions[qIndex];
  const correctSoFar = answers.filter((a, i) => a === questions[i].correctIndex).length;
  const progress = Math.round((qIndex / questions.length) * 100);

  const onNext = async (choice: number) => {
    const nextAnswers = [...answers, choice];
    setAnswers(nextAnswers);
    if (qIndex + 1 < questions.length) {
      setQIndex((i) => i + 1);
      setSelected(null);
    } else {
      // finish
      const correct = nextAnswers.filter((a, i) => a === questions[i].correctIndex).length;
      const total = questions.length;
      const score = Math.round((correct / total) * 100);
      const threshold = await getPassThreshold();
      const passed = score >= threshold;
      const durationSec = Math.round((Date.now() - startRef.current) / 1000);
      const profile = await loadProfile();
      await saveAttempt(profile, {
        moduleId: module.id,
        moduleTitle: tr(module.title, "en"),
        score,
        correct,
        total,
        passed,
        durationSec,
      });
      await storage.setItem(LAST_RESULT_KEY, {
        moduleId: module.id,
        score,
        correct,
        total,
        passed,
        threshold,
        durationSec,
        answers: nextAnswers,
      });
      router.replace("/result");
    }
  };

  return (
    <View style={styles.container} testID="assessment-screen">
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <Pressable testID="assessment-close" style={styles.closeBtn} onPress={() => router.replace("/dashboard")}>
            <Icon name="close" size={22} color={colors.onSurface} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t("assessment")}</Text>
            <Text style={styles.subtitle}>{tr(module.title, lang)}</Text>
          </View>
          <View style={styles.correctBadge}>
            <Icon name="star" size={14} color={colors.success} />
            <Text style={styles.correctText}>{correctSoFar} {t("correct")}</Text>
          </View>
        </View>
        <View style={styles.progressRow}>
          <Text style={styles.qCount}>{t("question")} {qIndex + 1} {t("of")} {questions.length}</Text>
          <Text style={styles.pct}>{progress}%</Text>
        </View>
        <View style={styles.progTrack}><View style={[styles.progFill, { width: `${progress}%` }]} /></View>
      </View>

      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        <Animated.View key={qIndex} entering={FadeIn.duration(300)}>
          <View style={styles.questionCard}>
            <View style={styles.qHead}>
              <View style={styles.qBadge}><Text style={styles.qBadgeText}>Q{qIndex + 1}</Text></View>
              <Text style={styles.qOf}>{t("of")} {questions.length} {t("question").toLowerCase()}s</Text>
              <View style={{ flex: 1 }} />
              <Icon name="help-box" size={22} color="rgba(255,255,255,0.4)" />
            </View>
            <Text style={styles.questionText}>{tr(q.q, "en")}</Text>
            {q.q.hi && lang !== "en" ? <Text style={styles.questionTrans}>{tr(q.q, lang)}</Text> : null}
            <View style={styles.tapRow}>
              <Icon name="gesture-tap" size={16} color="rgba(255,255,255,0.5)" />
              <Text style={styles.tapText}>{t("tapAnswer")}</Text>
            </View>
          </View>

          <View style={styles.options}>
            {q.options.map((opt, i) => {
              const isSel = selected === i;
              return (
                <Animated.View key={i} entering={FadeInUp.delay(i * 60)}>
                  <Pressable
                    testID={`answer-${i}`}
                    onPress={() => {
                      setSelected(i);
                      setTimeout(() => onNext(i), 220);
                    }}
                    style={[styles.option, isSel && styles.optionSel]}
                  >
                    <View style={[styles.optLetter, isSel && styles.optLetterSel]}>
                      <Text style={[styles.optLetterText, isSel && styles.optLetterTextSel]}>{String.fromCharCode(65 + i)}</Text>
                    </View>
                    <Text style={styles.optText}>{tr(opt, lang)}</Text>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.surface },
  header: { backgroundColor: c.surface, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: c.border },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  closeBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "900", color: c.onSurface },
  subtitle: { fontSize: 13, color: c.muted, marginTop: 1 },
  correctBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#DCFCE7", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  correctText: { color: c.success, fontSize: 13, fontWeight: "800" },
  progressRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 14, marginBottom: 6 },
  qCount: { fontSize: 13, fontWeight: "700", color: c.onSurface },
  pct: { fontSize: 13, fontWeight: "800", color: c.brandPrimary },
  progTrack: { height: 6, borderRadius: 999, backgroundColor: c.surfaceTertiary, overflow: "hidden" },
  progFill: { height: "100%", backgroundColor: c.brandPrimary, borderRadius: 999 },
  body: { padding: 16, gap: 16 },
  questionCard: { backgroundColor: c.surfaceInverse, borderRadius: 20, padding: 20 },
  qHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  qBadge: { backgroundColor: c.brandPrimary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  qBadgeText: { color: c.onBrandPrimary, fontSize: 14, fontWeight: "900" },
  qOf: { color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: "600" },
  questionText: { color: "#FFFFFF", fontSize: 21, fontWeight: "800", lineHeight: 28 },
  questionTrans: { color: "#CBD5E1", fontSize: 15, marginTop: 8, lineHeight: 21 },
  tapRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 16 },
  tapText: { color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "600" },
  options: { gap: 12 },
  option: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: c.surfaceSecondary, borderRadius: 16, padding: 16, borderWidth: 2, borderColor: "transparent", minHeight: 60 },
  optionSel: { borderColor: c.brandPrimary, backgroundColor: c.brandTertiary },
  optLetter: { width: 40, height: 40, borderRadius: 10, backgroundColor: c.surfaceInverse, alignItems: "center", justifyContent: "center" },
  optLetterSel: { backgroundColor: c.brandPrimary },
  optLetterText: { color: c.onSurfaceInverse, fontSize: 17, fontWeight: "900" },
  optLetterTextSel: { color: c.onBrandPrimary },
  optText: { flex: 1, fontSize: 16, fontWeight: "700", color: c.onSurface },
}));
