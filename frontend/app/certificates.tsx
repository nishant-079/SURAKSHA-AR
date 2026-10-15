
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Card, Icon } from "@/src/components/ui";
import {
  loadCerts,
  loadProfile,
  type Certificate,
} from "@/src/api";
import { useI18n } from "@/src/i18n";
import { makeStyles, useTheme } from "@/src/theme";

export default function CertificatesScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [certs, setCerts] = useState<Certificate[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const profile = await loadProfile();

        if (!profile) {
          setCerts([]);
          return;
        }

        const userCerts = await loadCerts(profile.id);
        setCerts(userCerts);
      })();
    }, []),
  );

  return (
    <View style={styles.container} testID="certificates-screen">
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 8 },
        ]}
      >
        <Button
          label={t("back")}
          variant="ghost"
          icon="arrow-left"
          full={false}
          onPress={() => router.replace("/dashboard")}
        />

        <Text style={styles.title}>
          {t("myCertificates")}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {certs.length === 0 ? (
          <View style={styles.empty}>
            <Icon
              name="certificate-outline"
              size={64}
              color={colors.muted}
            />

            <Text style={styles.emptyText}>
              No certificates yet.
            </Text>

            <Text style={styles.emptySub}>
              Complete a training module and pass the assessment to earn one.
            </Text>

            <Button
              label={t("startTraining")}
              icon="play"
              onPress={() => router.replace("/dashboard")}
              style={{ marginTop: 8 }}
              full={false}
            />
          </View>
        ) : (
          certs.map((c) => (
            <Card
              key={c.certificateId}
              style={styles.certCard}
              onPress={() =>
                router.push(`/certificate/${c.moduleId}`)
              }
              testID={`cert-${c.certificateId}`}
            >
              <View style={styles.certRow}>
                <View style={styles.certIcon}>
                  <Icon
                    name="certificate"
                    size={26}
                    color={colors.brandPrimary}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.certModule}>
                    {c.moduleTitle}
                  </Text>

                  <Text style={styles.certId}>
                    {c.certificateId}
                  </Text>

                  <View style={styles.certMeta}>
                    <View style={styles.scoreBadge}>
                      <Text style={styles.scoreText}>
                        {c.score}%
                      </Text>
                    </View>

                    <View style={styles.verifiedBadge}>
                      <Icon
                        name="shield-check"
                        size={12}
                        color={colors.onSuccess}
                      />

                      <Text style={styles.verifiedText}>
                        {t("verified")}
                      </Text>
                    </View>
                  </View>
                </View>

                <Icon
                  name="chevron-right"
                  size={24}
                  color={colors.muted}
                />
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: {
    flex: 1,
    backgroundColor: c.surface,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },

  title: {
    fontSize: 20,
    fontWeight: "900",
    color: c.onSurface,
  },

  body: {
    padding: 16,
    gap: 12,
  },

  empty: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 60,
  },

  emptyText: {
    fontSize: 18,
    fontWeight: "800",
    color: c.onSurface,
  },

  emptySub: {
    fontSize: 14,
    color: c.muted,
    textAlign: "center",
    paddingHorizontal: 32,
  },

  certCard: {},

  certRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  certIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: c.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },

  certModule: {
    fontSize: 16,
    fontWeight: "800",
    color: c.onSurface,
  },

  certId: {
    fontSize: 12,
    color: c.brandPrimary,
    fontWeight: "700",
    marginTop: 2,
  },

  certMeta: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },

  scoreBadge: {
    backgroundColor: c.surfaceTertiary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },

  scoreText: {
    fontSize: 12,
    fontWeight: "800",
    color: c.onSurface,
  },

  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: c.success,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },

  verifiedText: {
    color: c.onSuccess,
    fontSize: 11,
    fontWeight: "800",
  },
}));

