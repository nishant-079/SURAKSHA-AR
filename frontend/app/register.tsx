import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Icon } from "@/src/components/ui";
import { registerProfile } from "@/src/api";
import { LANGUAGES, useI18n, type Lang } from "@/src/i18n";
import { makeStyles, useTheme } from "@/src/theme";

const AGE_GROUPS = ["18-25", "26-35", "36-45", "46-55", "55+"];
const SECTORS = [
  { key: "mining", icon: "pickaxe" },
  { key: "steel", icon: "factory" },
  { key: "mica", icon: "diamond-stone" },
  { key: "other", icon: "wrench" },
] as const;

export default function RegisterScreen() {
  const router = useRouter();
  const { t, lang, setLang } = useI18n();
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState<string | null>(null);
  const [sector, setSector] = useState<string | null>(null);
  const [org, setOrg] = useState("");
  const [prefLang, setPrefLang] = useState<Lang>(lang);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const onSubmit = async () => {
    if (!name.trim()) {
      setError(t("nameRequired"));
      return;
    }
    if (!password.trim()) {
      setError("Password is required");
      return;
    }
    setError("");
    setSaving(true);
    setLang(prefLang);
    const wid = workerId.trim() || `WK-2026-${Math.floor(100 + Math.random() * 899)}`;
    await registerProfile({
       name: name.trim(),
       workerId: wid,
       password: password.trim(),
       language: prefLang,
       ageGroup: age || undefined,
       sector: sector || undefined,
       organization: org.trim() || undefined,
    });
    setSaving(false);
    router.replace("/dashboard");
  };

  return (
    <View style={styles.container} testID="register-screen">
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLogo}>
            <Icon name="hard-hat" size={26} color={colors.brandPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{t("registration")}</Text>
            <Text style={styles.headerSub}>{t("appName")} — Govt. of Jharkhand</Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepText}>Step 1/1</Text>
          </View>
        </View>
      </View>

      <KeyboardAwareScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        bottomOffset={20}
        showsVerticalScrollIndicator={false}
      >
        <Field icon="account" label={t("fullName")}>
          <TextInput
            testID="input-name"
            value={name}
            onChangeText={setName}
            placeholder={t("fullNamePh")}
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
        </Field>

        <Field icon="card-account-details" label={t("workerId")}>
          <TextInput
            testID="input-workerid"
            value={workerId}
            onChangeText={setWorkerId}
            placeholder={t("workerIdPh")}
            placeholderTextColor={colors.muted}
            autoCapitalize="characters"
            style={styles.input}
          />
        </Field>
        <Field icon="lock" label="Password">
          <TextInput
            testID="input-password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            placeholderTextColor={colors.muted}
            secureTextEntry
            style={styles.input}
           />
        </Field>

        <Text style={styles.groupLabel}>{t("ageGroup")}</Text>
        <View style={styles.chipWrap}>
          {AGE_GROUPS.map((a) => (
            <Pressable
              key={a}
              testID={`age-${a}`}
              onPress={() => setAge(a)}
              style={[styles.chip, age === a && styles.chipActive]}
            >
              <Text style={[styles.chipText, age === a && styles.chipTextActive]}>{a}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.groupLabel}>{t("sector")}</Text>
        <View style={styles.sectorGrid}>
          {SECTORS.map((sc) => (
            <Pressable
              key={sc.key}
              testID={`sector-${sc.key}`}
              onPress={() => setSector(sc.key)}
              style={[styles.sectorCard, sector === sc.key && styles.sectorActive]}
            >
              <Icon name={sc.icon} size={26} color={sector === sc.key ? colors.brandPrimary : colors.onSurfaceSecondary} />
              <Text style={styles.sectorText}>{t(sc.key as any)}</Text>
            </Pressable>
          ))}
        </View>

        <Field icon="office-building" label={t("organization")}>
          <TextInput
            testID="input-org"
            value={org}
            onChangeText={setOrg}
            placeholder={t("organizationPh")}
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
        </Field>

        <Text style={styles.groupLabel}>{t("chooseLanguage")}</Text>
        <View style={{ gap: 10 }}>
          {LANGUAGES.map((l) => (
            <Pressable
              key={l.code}
              testID={`preflang-${l.code}`}
              onPress={() => setPrefLang(l.code)}
              style={[styles.langRow, prefLang === l.code && styles.langRowActive]}
            >
              <Text style={styles.flag}>{l.flag}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.langNative}>{l.native}</Text>
                <Text style={styles.langLabel}>{l.label}</Text>
              </View>
              {prefLang === l.code ? <Icon name="check-circle" size={22} color={colors.brandPrimary} /> : null}
            </Pressable>
          ))}
        </View>

        {error ? <Text style={styles.error} testID="register-error">{error}</Text> : null}

        <Button testID="register-submit" label={t("register")} icon="rocket-launch" loading={saving} onPress={onSubmit} style={{ marginTop: 8 }} />
        <View style={{ height: insets.bottom + 16 }} />
      </KeyboardAwareScrollView>
    </View>
  );
}

function Field({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <View style={styles.fieldLabelRow}>
        <Icon name={icon} size={18} color={colors.info} />
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.surface },
  header: { backgroundColor: c.surfaceInverse, paddingHorizontal: 20, paddingBottom: 18, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerLogo: { width: 48, height: 48, borderRadius: 24, backgroundColor: c.onBrand, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 22, fontWeight: "900", color: c.onSurfaceInverse },
  headerSub: { fontSize: 12, color: c.muted, marginTop: 2 },
  step: { backgroundColor: c.brandPrimary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  stepText: { color: c.onBrandPrimary, fontSize: 12, fontWeight: "700" },
  body: { flex: 1 },
  bodyContent: { padding: 20, gap: 16 },
  field: { gap: 8 },
  fieldLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  fieldLabel: { fontSize: 15, fontWeight: "700", color: c.onSurface },
  input: {
    backgroundColor: c.surfaceSecondary, borderRadius: 12, borderWidth: 1, borderColor: c.border,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: c.onSurface, minHeight: 52,
  },
  groupLabel: { fontSize: 15, fontWeight: "700", color: c.onSurface, marginTop: 4 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border, minHeight: 48, justifyContent: "center" },
  chipActive: { backgroundColor: c.brandTertiary, borderColor: c.brandPrimary },
  chipText: { fontSize: 15, fontWeight: "700", color: c.onSurfaceSecondary },
  chipTextActive: { color: c.onBrandTertiary },
  sectorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  sectorCard: {
    width: "47.5%", flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: c.surfaceSecondary,
    borderRadius: 14, padding: 16, borderWidth: 1, borderColor: c.border, minHeight: 60,
  },
  sectorActive: { borderColor: c.brandPrimary, backgroundColor: c.brandTertiary },
  sectorText: { fontSize: 15, fontWeight: "700", color: c.onSurfaceSecondary },
  langRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: c.surfaceSecondary, borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: c.border, minHeight: 60 },
  langRowActive: { borderColor: c.brandPrimary, backgroundColor: c.brandTertiary },
  flag: { fontSize: 24 },
  langNative: { fontSize: 16, fontWeight: "700", color: c.onSurfaceSecondary },
  langLabel: { fontSize: 12, color: c.muted },
  error: { color: c.error, fontSize: 14, fontWeight: "600" },
}));
