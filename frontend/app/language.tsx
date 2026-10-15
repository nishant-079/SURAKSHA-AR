import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Icon } from "@/src/components/ui";
import { LANGUAGES, useI18n, type Lang } from "@/src/i18n";
import { makeStyles, useTheme } from "@/src/theme";

export default function LanguageScreen() {
  const router = useRouter();
  const { t, lang, setLang } = useI18n();
  const [selected, setSelected] = useState<Lang>(lang);
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="language-screen">
      <View style={styles.header}>
        <View style={styles.logo}>
          <Icon name="hard-hat" size={40} color={colors.brandPrimary} />
        </View>
        <Text style={styles.appName}>{t("appName")}</Text>
        <Text style={styles.title}>{t("chooseLanguage")}</Text>
        <Text style={styles.subtitle}>{t("langSubtitle")}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {LANGUAGES.map((l, i) => {
          const active = selected === l.code;
          return (
            <Animated.View key={l.code} entering={FadeInUp.delay(i * 100)}>
              <Pressable
                testID={`lang-${l.code}`}
                onPress={() => setSelected(l.code)}
                style={[styles.card, active && styles.cardActive]}
              >
                <Text style={styles.flag}>{l.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.native, active && styles.textActive]}>{l.native}</Text>
                  <Text style={styles.label}>{l.label}</Text>
                </View>
                {active ? <Icon name="check-circle" size={26} color={colors.brandPrimary} /> : <View style={styles.radio} />}
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          testID="lang-continue"
          label={t("continue")}
          icon="arrow-right"
          onPress={() => {
            setLang(selected);
            router.push("/register");
          }}
        />
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.surfaceInverse },
  header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24, alignItems: "center" },
  logo: { width: 80, height: 80, borderRadius: 40, backgroundColor: c.onBrand, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  appName: { fontSize: 20, fontWeight: "900", color: c.onSurfaceInverse, letterSpacing: 1 },
  title: { fontSize: 24, fontWeight: "800", color: c.onSurfaceInverse, marginTop: 16, textAlign: "center" },
  subtitle: { fontSize: 14, color: c.muted, marginTop: 6, textAlign: "center" },
  list: { paddingHorizontal: 20, paddingTop: 8, gap: 14 },
  card: {
    flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: c.surfaceSecondary,
    borderRadius: 16, padding: 18, borderWidth: 2, borderColor: "transparent", minHeight: 72,
  },
  cardActive: { borderColor: c.brandPrimary, backgroundColor: c.brandTertiary },
  flag: { fontSize: 30 },
  native: { fontSize: 20, fontWeight: "800", color: c.onSurfaceSecondary },
  textActive: { color: c.onBrandTertiary },
  label: { fontSize: 13, color: c.muted, marginTop: 2 },
  radio: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: c.border },
  footer: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: c.surfaceInverse },
}));
