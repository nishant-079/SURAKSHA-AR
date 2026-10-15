import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Dimensions, Linking, Platform, Pressable, ScrollView, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Icon } from "@/src/components/ui";
import { getModule, type ARMarker, type Module, type Task } from "@/src/content/modules";
import { tr, useI18n, type Lang } from "@/src/i18n";
import { makeStyles, useTheme } from "@/src/theme";

type Phase = "permission" | "scanning" | "ready" | "active" | "done";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ARScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, lang } = useI18n();
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const module = getModule(String(id));
  const [permission, requestPermission] = useCameraPermissions();
  const [simMode, setSimMode] = useState(false);
  const [phase, setPhase] = useState<Phase>("permission");
  const [taskIndex, setTaskIndex] = useState(0);
  const tasks = module?.tasks ?? [];

  // decide initial phase from permission
  useEffect(() => {
    if (!permission) return;
    if (permission.granted || simMode) {
      setPhase((p) => (p === "permission" ? "scanning" : p));
    }
  }, [permission, simMode]);

  const onFinishTask = useCallback(() => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (taskIndex + 1 >= tasks.length) {
      setPhase("done");
    } else {
      setTaskIndex((i) => i + 1);
    }
  }, [taskIndex, tasks.length]);

  if (!module) return null;
  const currentTask = tasks[taskIndex];

  // ---------------- Permission phase ----------------
  if (phase === "permission") {
    const denied = permission && !permission.granted && !permission.canAskAgain;
    return (
      <View style={[styles.permContainer, { paddingTop: insets.top }]} testID="ar-permission-screen">
        <Pressable style={styles.closeTop} onPress={() => router.back()}>
          <Icon name="close" size={26} color={colors.onSurfaceInverse} />
        </Pressable>
        <View style={styles.permCenter}>
          <View style={styles.permIcon}>
            <Icon name="camera" size={48} color={colors.brandPrimary} />
          </View>
          <Text style={styles.permTitle}>{t("arReady")}</Text>
          <Text style={styles.permText}>{t("cameraWhy")}</Text>
          {denied ? (
            <>
              <Text style={styles.permDenied}>{t("cameraDenied")}</Text>
              <Button testID="open-settings-btn" label={t("openSettings")} icon="cog" onPress={() => Linking.openSettings()} style={{ marginTop: 12 }} />
            </>
          ) : (
            <Button
              testID="allow-camera-btn"
              label={t("allowCamera")}
              icon="camera"
              onPress={async () => {
                const res = await requestPermission();
                if (res.granted) setPhase("scanning");
              }}
              style={{ marginTop: 20 }}
            />
          )}
          <Pressable testID="continue-sim-btn" style={styles.simLink} onPress={() => { setSimMode(true); setPhase("scanning"); }}>
            <Icon name="cube-outline" size={18} color={colors.muted} />
            <Text style={styles.simLinkText}>{t("continueSim")}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const useCamera = permission?.granted && !simMode;

  return (
    <View style={styles.arRoot} testID="ar-screen">
      {/* Camera / simulated background */}
      {useCamera ? (
        <CameraView style={styles.camera} facing="back" />
      ) : (
        <LinearGradient colors={["#0B1220", "#111827", "#0B1220"]} style={styles.camera}>
          <SimGrid />
        </LinearGradient>
      )}

      {/* Scanning overlay */}
      {phase === "scanning" ? (
        <ScanningOverlay onDone={() => setPhase("ready")} label={t("scanArea")} />
      ) : null}

      {phase === "ready" ? (
        <Animated.View entering={FadeIn} style={styles.readyOverlay}>
          <View style={styles.detectedBadge}>
            <Icon name="check-circle" size={20} color={colors.onSuccess} />
            <Text style={styles.detectedText}>{t("surfaceDetected")}</Text>
          </View>
          <Text style={styles.placeText}>{t("placeScenario")}</Text>
          <Button testID="start-simulation-btn" label={t("startSimulation")} icon="play" onPress={() => setPhase("active")} full={false} />
        </Animated.View>
      ) : null}

      {/* Active scenario */}
      {phase === "active" && currentTask ? (
        <ActiveScenario
          key={taskIndex}
          module={module}
          task={currentTask}
          taskIndex={taskIndex}
          totalTasks={tasks.length}
          lang={lang}
          onFinishTask={onFinishTask}
          onExit={() => router.back()}
        />
      ) : null}

      {/* Done overlay */}
      {phase === "done" ? (
        <Animated.View entering={FadeIn} style={styles.doneOverlay}>
          <View style={styles.doneCard}>
            <View style={styles.doneIcon}>
              <Icon name="check-decagram" size={56} color={colors.success} />
            </View>
            <Text style={styles.doneTitle}>{t("moduleComplete")}</Text>
            <Text style={styles.doneSub}>{tr(module.title, lang)}</Text>
            <Button testID="start-assessment-btn" label={t("startAssessment")} icon="clipboard-check" onPress={() => router.replace(`/assessment/${module.id}`)} style={{ marginTop: 20 }} />
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

// ---------------- Simulated AR grid ----------------
function SimGrid() {
  const styles = useStyles();
  const cols = Array.from({ length: 6 });
  const rows = Array.from({ length: 10 });
  return (
    <View style={styles.grid} pointerEvents="none">
      {cols.map((_, i) => (
        <View key={`c${i}`} style={[styles.gridLineV, { left: `${(i + 1) * (100 / 7)}%` }]} />
      ))}
      {rows.map((_, i) => (
        <View key={`r${i}`} style={[styles.gridLineH, { top: `${(i + 1) * (100 / 11)}%` }]} />
      ))}
    </View>
  );
}

// ---------------- Scanning overlay ----------------
function ScanningOverlay({ onDone, label }: { onDone: () => void; label: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const scale = useSharedValue(0.8);
  const rot = useSharedValue(0);

  useEffect(() => {
    scale.value = withRepeat(withSequence(withTiming(1.1, { duration: 900 }), withTiming(0.8, { duration: 900 })), -1);
    rot.value = withRepeat(withTiming(360, { duration: 4000, easing: Easing.linear }), -1);
    const timer = setTimeout(onDone, 2600);
    return () => clearTimeout(timer);
  }, []);

  const ring = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const corner = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));

  return (
    <View style={styles.scanOverlay} pointerEvents="none">
      <Animated.View style={[styles.scanCorner, corner]}>
        <View style={[styles.cornerTL]} />
        <View style={[styles.cornerTR]} />
        <View style={[styles.cornerBL]} />
        <View style={[styles.cornerBR]} />
      </Animated.View>
      <Animated.View style={[styles.scanRing, ring]} />
      <View style={styles.scanLabelWrap}>
        <Icon name="cellphone-screenshot" size={22} color={colors.onSurfaceInverse} />
        <Text style={styles.scanLabel}>{label}</Text>
      </View>
    </View>
  );
}

// ---------------- Active scenario ----------------
function ActiveScenario({
  module,
  task,
  taskIndex,
  totalTasks,
  lang,
  onFinishTask,
  onExit,
}: {
  module: Module;
  task: Task;
  taskIndex: number;
  totalTasks: number;
  lang: Lang;
  onFinishTask: () => void;
  onExit: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [taskDone, setTaskDone] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [orderSel, setOrderSel] = useState<number[]>([]);

  const progress = Math.round(((taskIndex + (taskDone ? 1 : 0)) / totalTasks) * 100);

  // markers active for this task (tap type)
  const activeMarkers: ARMarker[] =
    task.type === "tap"
      ? task.markerIds.map((mid) => module.markers.find((m) => m.id === mid)).filter(Boolean) as ARMarker[]
      : [];

  const shuffledOrder = useMemo(
    () => (task.type === "order" ? shuffle(task.items.map((_, i) => i)) : []),
    [task],
  );

  const handleTap = (markerId: string) => {
    if (task.type !== "tap" || taskDone) return;
    setSelectedId(markerId);
    const ok = markerId === task.correctId;
    if (Platform.OS !== "web") Haptics.notificationAsync(ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error);
    setFeedback({ ok, msg: tr(ok ? task.correctFb : task.wrongFb, lang) });
    if (ok) setTaskDone(true);
    else setTimeout(() => setSelectedId(null), 700);
  };

  const handleChoice = (idx: number) => {
    if (task.type !== "choice" || taskDone) return;
    setSelectedId(String(idx));
    const ok = idx === task.correctIndex;
    if (Platform.OS !== "web") Haptics.notificationAsync(ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error);
    setFeedback({ ok, msg: ok ? tr(task.explanation, lang) : t("incorrect") });
    if (ok) setTaskDone(true);
    else setTimeout(() => setSelectedId(null), 700);
  };

  const handleOrder = (itemIdx: number) => {
    if (task.type !== "order" || taskDone) return;
    if (orderSel.includes(itemIdx)) return;
    const next = [...orderSel, itemIdx];
    setOrderSel(next);
    if (next.length === task.items.length) {
      const correct = next.every((v, i) => v === i);
      if (Platform.OS !== "web") Haptics.notificationAsync(correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error);
      if (correct) {
        setFeedback({ ok: true, msg: t("correct") });
        setTaskDone(true);
      } else {
        setFeedback({ ok: false, msg: tr((task as any).wrongFb || { en: "Wrong order. Try again." }, lang) || "Try again" });
        setTimeout(() => { setOrderSel([]); setFeedback(null); }, 1200);
      }
    }
  };

  return (
    <View style={styles.activeRoot} pointerEvents="box-none">
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <View style={styles.topRow}>
          <Pressable testID="ar-exit-btn" style={styles.exitBtn} onPress={onExit}>
            <Icon name="close" size={22} color={colors.onSurfaceInverse} />
          </Pressable>
          <View style={styles.taskBadge}>
            <Text style={styles.taskBadgeText}>{t("task")} {taskIndex + 1}/{totalTasks}</Text>
          </View>
          <View style={styles.progWrap}>
            <View style={styles.progTrack}><View style={[styles.progFill, { width: `${progress}%` }]} /></View>
          </View>
        </View>
        <Text style={styles.promptText} testID="ar-task-prompt">{tr((task as any).prompt, lang)}</Text>
        {task.type === "tap" ? <Text style={styles.promptHint}>{t("tapToSelect")}</Text> : null}
        {task.type === "order" ? <Text style={styles.promptHint}>{t("arrangeOrder")}</Text> : null}
      </View>

      {/* TAP markers */}
      {task.type === "tap"
        ? activeMarkers.map((m) => (
            <ARMarkerView
              key={m.id}
              marker={m}
              lang={lang}
              selected={selectedId === m.id}
              correct={taskDone && m.id === (task as any).correctId}
              disabled={taskDone}
              onPress={() => handleTap(m.id)}
            />
          ))
        : null}

      {/* Worker anchor marker (context, non-interactive) for gas module */}
      {task.type === "tap" && module.id === "gas" && taskIndex === 0
        ? null
        : null}

      {/* Feedback bar */}
      {feedback ? (
        <Animated.View entering={FadeIn} style={[styles.feedbackWrap, { top: insets.top + 130 }]}>
          <View style={[styles.feedback, { backgroundColor: feedback.ok ? colors.success : colors.error }]}>
            <Icon name={feedback.ok ? "check-circle" : "close-circle"} size={22} color="#FFFFFF" />
            <Text style={styles.feedbackText} testID="ar-feedback">{feedback.msg}</Text>
          </View>
        </Animated.View>
      ) : null}

      {/* Bottom panel */}
      <View style={[styles.bottomPanel, { paddingBottom: insets.bottom + 16 }]} pointerEvents="box-none">
        {/* CHOICE options */}
        {task.type === "choice" ? (
          <ScrollView style={styles.choiceScroll} contentContainerStyle={{ gap: 10, paddingBottom: 8 }}>
            {task.options.map((opt, i) => {
              const isSel = selectedId === String(i);
              const isCorrect = taskDone && i === task.correctIndex;
              return (
                <Pressable
                  key={i}
                  testID={`ar-choice-${i}`}
                  disabled={taskDone}
                  onPress={() => handleChoice(i)}
                  style={[styles.choiceCard, isSel && !taskDone && styles.choiceSel, isCorrect && styles.choiceCorrect]}
                >
                  <View style={[styles.choiceLetter, isCorrect && { backgroundColor: colors.success }]}>
                    <Text style={styles.choiceLetterText}>{String.fromCharCode(65 + i)}</Text>
                  </View>
                  <Text style={styles.choiceText}>{tr(opt, lang)}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        {/* ORDER items */}
        {task.type === "order" ? (
          <View style={styles.orderWrap}>
            {orderSel.length > 0 ? (
              <View style={styles.orderChosen}>
                {orderSel.map((v, i) => (
                  <View key={i} style={styles.orderStep}>
                    <Text style={styles.orderStepNum}>{i + 1}</Text>
                    <Text style={styles.orderStepText} numberOfLines={1}>{tr(task.items[v], lang)}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            <View style={styles.orderOptions}>
              {shuffledOrder.map((v) => {
                const used = orderSel.includes(v);
                return (
                  <Pressable
                    key={v}
                    testID={`ar-order-${v}`}
                    disabled={used || taskDone}
                    onPress={() => handleOrder(v)}
                    style={[styles.orderChip, used && styles.orderChipUsed]}
                  >
                    <Text style={[styles.orderChipText, used && { color: colors.muted }]}>{tr(task.items[v], lang)}</Text>
                  </Pressable>
                );
              })}
            </View>
            {orderSel.length > 0 && !taskDone ? (
              <Pressable style={styles.resetBtn} onPress={() => { setOrderSel([]); setFeedback(null); }} testID="ar-order-reset">
                <Icon name="refresh" size={16} color={colors.onSurfaceInverse} />
                <Text style={styles.resetText}>{t("resetOrder")}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {/* Controls row */}
        <View style={styles.controlsRow}>
          <Pressable testID="ar-hint-btn" style={styles.hintBtn} onPress={() => setShowHint((v) => !v)}>
            <Icon name="lightbulb-on-outline" size={20} color={colors.onBrandTertiary} />
            <Text style={styles.hintBtnText}>{t("hint")}</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Button
              testID="ar-continue-btn"
              label={taskIndex + 1 >= totalTasks ? t("continue") : t("next")}
              icon="arrow-right"
              disabled={!taskDone}
              onPress={onFinishTask}
            />
          </View>
        </View>
        {showHint ? (
          <View style={styles.hintBox}>
            <Text style={styles.hintText}>
              {task.type === "tap" ? "Look for the green / safe marker." : task.type === "order" ? "Start by recognizing the emergency." : "Choose the option that keeps everyone safest."}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

// ---------------- Single AR marker ----------------
function ARMarkerView({
  marker,
  lang,
  selected,
  correct,
  disabled,
  onPress,
}: {
  marker: ARMarker;
  lang: Lang;
  selected: boolean;
  correct: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const styles = useStyles();
  const { width, height } = Dimensions.get("window");
  const float = useSharedValue(0);
  useEffect(() => {
    float.value = withRepeat(withSequence(withTiming(-6, { duration: 1200 }), withTiming(6, { duration: 1200 })), -1);
  }, []);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: float.value }] }));
  const size = marker.size || 56;
  const left = marker.x * width - size / 2;
  const top = marker.y * height - size / 2;

  return (
    <Animated.View style={[styles.markerWrap, { left, top }, anim]}>
      <Pressable testID={`ar-marker-${marker.id}`} disabled={disabled} onPress={onPress} style={{ alignItems: "center" }}>
        <View
          style={[
            styles.marker,
            { width: size, height: size, borderRadius: size / 2, backgroundColor: marker.color },
            selected && styles.markerSelected,
            correct && styles.markerCorrect,
          ]}
        >
          <Icon name={marker.icon} size={size * 0.5} color="#FFFFFF" />
        </View>
        <View style={styles.markerLabel}>
          <Text style={styles.markerLabelText} numberOfLines={1}>{tr(marker.label, lang)}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const useStyles = makeStyles((c) => ({
  arRoot: { flex: 1, backgroundColor: "#000000" },
  camera: { ...({ position: "absolute" } as const), width: "100%", height: "100%" },
  grid: { flex: 1 },
  gridLineV: { position: "absolute", top: 0, bottom: 0, width: 1, backgroundColor: "rgba(148,163,184,0.15)" },
  gridLineH: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: "rgba(148,163,184,0.15)" },

  // permission
  permContainer: { flex: 1, backgroundColor: c.surfaceInverse },
  closeTop: { position: "absolute", top: 0, right: 0, margin: 16, marginTop: 48, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  permCenter: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  permIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: c.onBrand, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  permTitle: { fontSize: 24, fontWeight: "900", color: c.onSurfaceInverse, textAlign: "center" },
  permText: { fontSize: 15, color: c.muted, textAlign: "center", marginTop: 12, lineHeight: 22 },
  permDenied: { fontSize: 14, color: c.warning, textAlign: "center", marginTop: 16, fontWeight: "600" },
  simLink: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 20, padding: 12 },
  simLinkText: { color: c.muted, fontSize: 14, fontWeight: "600", textDecorationLine: "underline" },

  // scanning
  scanOverlay: { ...({ position: "absolute" } as const), width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  scanCorner: { position: "absolute", width: 240, height: 240 },
  cornerTL: { position: "absolute", top: 0, left: 0, width: 40, height: 40, borderTopWidth: 4, borderLeftWidth: 4, borderColor: c.brandPrimary, borderTopLeftRadius: 12 },
  cornerTR: { position: "absolute", top: 0, right: 0, width: 40, height: 40, borderTopWidth: 4, borderRightWidth: 4, borderColor: c.brandPrimary, borderTopRightRadius: 12 },
  cornerBL: { position: "absolute", bottom: 0, left: 0, width: 40, height: 40, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: c.brandPrimary, borderBottomLeftRadius: 12 },
  cornerBR: { position: "absolute", bottom: 0, right: 0, width: 40, height: 40, borderBottomWidth: 4, borderRightWidth: 4, borderColor: c.brandPrimary, borderBottomRightRadius: 12 },
  scanRing: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: "rgba(249,115,22,0.6)" },
  scanLabelWrap: { position: "absolute", bottom: 120, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(15,23,42,0.85)", paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999, marginHorizontal: 32 },
  scanLabel: { color: c.onSurfaceInverse, fontSize: 14, fontWeight: "700", flexShrink: 1 },

  // ready
  readyOverlay: { ...({ position: "absolute" } as const), width: "100%", height: "100%", alignItems: "center", justifyContent: "center", gap: 16, backgroundColor: "rgba(15,23,42,0.55)" },
  detectedBadge: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: c.success, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999 },
  detectedText: { color: c.onSuccess, fontSize: 15, fontWeight: "800" },
  placeText: { color: c.onSurfaceInverse, fontSize: 18, fontWeight: "700", marginBottom: 8 },

  // active
  activeRoot: { ...({ position: "absolute" } as const), width: "100%", height: "100%" },
  topBar: { paddingHorizontal: 16, paddingBottom: 14, backgroundColor: "rgba(15,23,42,0.82)", borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  exitBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  taskBadge: { backgroundColor: c.brandPrimary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  taskBadgeText: { color: c.onBrandPrimary, fontSize: 12, fontWeight: "800" },
  progWrap: { flex: 1 },
  progTrack: { height: 8, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.2)", overflow: "hidden" },
  progFill: { height: "100%", backgroundColor: c.brandPrimary, borderRadius: 999 },
  promptText: { color: "#FFFFFF", fontSize: 17, fontWeight: "800", marginTop: 12, lineHeight: 23 },
  promptHint: { color: "#CBD5E1", fontSize: 12, marginTop: 4 },

  feedbackWrap: { position: "absolute", left: 16, right: 16, alignItems: "center" },
  feedback: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, maxWidth: "100%" },
  feedbackText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700", flexShrink: 1 },

  markerWrap: { position: "absolute", alignItems: "center" },
  marker: { alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "rgba(255,255,255,0.9)", shadowColor: "#000", shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  markerSelected: { borderColor: "#FFFFFF", transform: [{ scale: 1.12 }] },
  markerCorrect: { borderColor: "#16A34A", borderWidth: 5 },
  markerLabel: { marginTop: 6, backgroundColor: "rgba(15,23,42,0.9)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, maxWidth: 130 },
  markerLabelText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },

  bottomPanel: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  choiceScroll: { maxHeight: 260 },
  choiceCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: c.surfaceSecondary, borderRadius: 14, padding: 14, borderWidth: 2, borderColor: "transparent", minHeight: 56 },
  choiceSel: { borderColor: c.brandPrimary },
  choiceCorrect: { borderColor: c.success, backgroundColor: "#DCFCE7" },
  choiceLetter: { width: 34, height: 34, borderRadius: 8, backgroundColor: c.surfaceInverse, alignItems: "center", justifyContent: "center" },
  choiceLetterText: { color: c.onSurfaceInverse, fontSize: 15, fontWeight: "800" },
  choiceText: { flex: 1, fontSize: 14, fontWeight: "700", color: c.onSurface },

  orderWrap: { gap: 10, backgroundColor: "rgba(15,23,42,0.82)", padding: 12, borderRadius: 16 },
  orderChosen: { gap: 6 },
  orderStep: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: c.brandPrimary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  orderStepNum: { color: c.onBrandPrimary, fontSize: 13, fontWeight: "900", width: 18 },
  orderStepText: { color: c.onBrandPrimary, fontSize: 13, fontWeight: "700", flex: 1 },
  orderOptions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  orderChip: { backgroundColor: c.surfaceSecondary, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, minHeight: 44, justifyContent: "center" },
  orderChipUsed: { backgroundColor: c.surfaceTertiary, opacity: 0.5 },
  orderChipText: { fontSize: 13, fontWeight: "700", color: c.onSurface },
  resetBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8 },
  resetText: { color: c.onSurfaceInverse, fontSize: 13, fontWeight: "700" },

  controlsRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  hintBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: c.brandTertiary, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, minHeight: 52 },
  hintBtnText: { color: c.onBrandTertiary, fontSize: 14, fontWeight: "800" },
  hintBox: { backgroundColor: "rgba(15,23,42,0.9)", padding: 12, borderRadius: 12 },
  hintText: { color: "#E2E8F0", fontSize: 13, fontWeight: "600" },

  // done
  doneOverlay: { ...({ position: "absolute" } as const), width: "100%", height: "100%", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(15,23,42,0.75)", padding: 24 },
  doneCard: { backgroundColor: c.surfaceSecondary, borderRadius: 24, padding: 28, alignItems: "center", width: "100%" },
  doneIcon: { marginBottom: 16 },
  doneTitle: { fontSize: 22, fontWeight: "900", color: c.onSurface, textAlign: "center" },
  doneSub: { fontSize: 15, color: c.muted, marginTop: 6, textAlign: "center" },
}));
