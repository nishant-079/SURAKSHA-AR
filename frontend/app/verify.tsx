import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Card, Icon } from "@/src/components/ui";
import { verifyCertificate, type Certificate } from "@/src/api";
import { useI18n } from "@/src/i18n";
import { makeStyles, useTheme } from "@/src/theme";

export default function VerifyScreen() {
  const { cid } = useLocalSearchParams<{ cid?: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [input, setInput] = useState(cid || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<(Certificate & { found: boolean }) | null>(null);

  const doVerify = async (certId: string) => {
    if (!certId.trim()) return;
    setLoading(true);
    setResult(null);
    const res = await verifyCertificate(certId.trim());
    setResult(res);
    setLoading(false);
  };

  useEffect(() => {
    if (cid) doVerify(cid);
  }, [cid]);

  const dateStr = result?.issueDate
    ? new Date(result.issueDate).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <View style={styles.container} testID="verify-screen">
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <View style={styles.logo}><Icon name="shield-check" size={24} color={colors.brandPrimary} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t("verification")}</Text>
            <Text style={styles.sub}>SURAKSHA AR</Text>
          </View>
          {Platform.OS !== "web" ? (
            <Button label={t("back")} variant="ghost" icon="arrow-left" full={false} onPress={() => router.back()} />
          ) : null}
        </View>
      </View>

      <KeyboardAwareScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]} bottomOffset={20} showsVerticalScrollIndicator={false}>
        <Card style={styles.searchCard}>
          <Text style={styles.searchLabel}>{t("enterCertId")}</Text>
          <TextInput
            testID="verify-input"
            value={input}
            onChangeText={setInput}
            placeholder="JH-SAFE-2026-000124"
            placeholderTextColor={colors.muted}
            autoCapitalize="characters"
            style={styles.input}
          />
          <Button testID="verify-submit" label={t("verifyNow")} icon="magnify" loading={loading} onPress={() => doVerify(input)} />
        </Card>

        {loading ? <ActivityIndicator color={colors.brandPrimary} style={{ marginTop: 20 }} /> : null}

        {result ? (
          result.found ? (
            <Card style={styles.resultCard} testID="verify-result-valid">
              <View style={styles.validHead}>
                <View style={styles.validIcon}><Icon name="check-decagram" size={40} color={colors.onSuccess} /></View>
                <Text style={styles.validTitle}>{t("verified")}</Text>
              </View>
              <Row label={t("certificateId")} value={result.certificateId} accent />
              <Row label={t("worker")} value={result.name} />
              <Row label={t("module")} value={result.moduleTitle} />
              <Row label={t("score")} value={`${result.score}%`} />
              <Row label={t("status")} value={`✓ ${result.verificationStatus}`} />
              <Row label={t("completedOn")} value={dateStr} />
            </Card>
          ) : (
            <Card style={styles.notFoundCard} testID="verify-result-invalid">
              <Icon name="close-octagon" size={48} color={colors.error} />
              <Text style={styles.notFoundTitle}>{t("notFound")}</Text>
              <Text style={styles.notFoundSub}>{input}</Text>
            </Card>
          )
        ) : null}
      </KeyboardAwareScrollView>
    </View>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, accent && { color: colors.brandPrimary, fontWeight: "800" }]}>{value}</Text>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.surface },
  header: { backgroundColor: c.surfaceInverse, paddingHorizontal: 20, paddingBottom: 18, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: { width: 48, height: 48, borderRadius: 24, backgroundColor: c.onBrand, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "900", color: c.onSurfaceInverse },
  sub: { fontSize: 12, color: c.muted, marginTop: 2 },
  body: { padding: 16, gap: 16, maxWidth: 640, width: "100%", alignSelf: "center" },
  searchCard: { gap: 12 },
  searchLabel: { fontSize: 15, fontWeight: "700", color: c.onSurface },
  input: { backgroundColor: c.surfaceTertiary, borderRadius: 12, borderWidth: 1, borderColor: c.border, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: c.onSurface, minHeight: 52 },
  resultCard: { gap: 4 },
  validHead: { alignItems: "center", gap: 10, marginBottom: 12 },
  validIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: c.success, alignItems: "center", justifyContent: "center" },
  validTitle: { fontSize: 22, fontWeight: "900", color: c.success },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.divider, gap: 12 },
  rowLabel: { fontSize: 13, color: c.muted, fontWeight: "600" },
  rowValue: { fontSize: 14, color: c.onSurface, fontWeight: "700", flexShrink: 1, textAlign: "right" },
  notFoundCard: { alignItems: "center", gap: 12, paddingVertical: 32 },
  notFoundTitle: { fontSize: 20, fontWeight: "900", color: c.error },
  notFoundSub: { fontSize: 14, color: c.muted, fontWeight: "600" },
}));
