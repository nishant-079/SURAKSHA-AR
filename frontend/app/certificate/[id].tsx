
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Share, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, Icon } from "@/src/components/ui";
import {
  BASE_URL,
  issueCertificate,
  loadCerts,
  loadProfile,
  type Certificate,
} from "@/src/api";
import { getModule } from "@/src/content/modules";
import { tr, useI18n } from "@/src/i18n";
import { makeStyles, useTheme } from "@/src/theme";
import { storage } from "@/src/utils/storage";
import { LAST_RESULT_KEY } from "@/src/api";

export default function CertificateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, lang } = useI18n();
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const module = getModule(String(id));
  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const profile = await loadProfile();

      if (!profile || !module) {
        setLoading(false);
        return;
      }

      const existing = (await loadCerts(profile.id)).find(
        (c) => c.moduleId === module.id
      );

      if (existing) {
        setCert(existing);
        setLoading(false);
        return;
      }

      const last = await storage.getItem<{ score: number } | null>(
        LAST_RESULT_KEY,
        null
      );

      const score = last?.score ?? 100;

      const c = await issueCertificate(
        profile,
        module.id,
        tr(module.title, "en"),
        score
      );

      setCert(c);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingWrap]}>
        <ActivityIndicator color={colors.brandPrimary} size="large" />
        <Text style={styles.loadingText}>{t("syncing")}</Text>
      </View>
    );
  }

  if (!cert) {
    return (
      <View style={[styles.container, styles.loadingWrap]}>
        <Icon
          name="certificate-outline"
          size={56}
          color={colors.muted}
        />

        <Text style={styles.loadingText}>
          Complete the module assessment first.
        </Text>

        <Button
          label={t("backToDashboard")}
          icon="home"
          full={false}
          onPress={() => router.replace("/dashboard")}
        />
      </View>
    );
  }

  const verifyUrl = `${BASE_URL}/verify?cid=${cert.certificateId}`;

  const dateStr = new Date(cert.issueDate).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const onShare = async () => {
    try {
      await Share.share({
        message: `${t("certificateTitle")}\n${cert.name}\n${tr(
          module!.title,
          lang
        )} — ${cert.score}%\nID: ${cert.certificateId}\nVerify: ${verifyUrl}`,
      });
    } catch {
      /* cancelled */
    }
  };

  return (
    <View style={styles.container} testID="certificate-screen">
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
      </View>

      <View style={styles.body}>
        {/* Certificate card */}
        <View style={styles.cert} testID="certificate-card">
          <View style={styles.certBorder}>
            <View style={styles.certLogoRow}>
              <View style={styles.certLogo}>
                <Icon
                  name="hard-hat"
                  size={24}
                  color={colors.brandPrimary}
                />
              </View>

              <View style={styles.ribbon}>
                <Icon
                  name="medal"
                  size={26}
                  color={colors.brandPrimary}
                />
              </View>
            </View>

            <Text style={styles.certTitle}>
              {t("certificateTitle")}
            </Text>

            <View style={styles.certDivider} />

            <Text style={styles.certLabel}>
              {t("certifiedWorker")}
            </Text>

            <Text style={styles.certName}>
              {cert.name.toUpperCase()}
            </Text>

            <View style={styles.certRow}>
              <View style={styles.certCol}>
                <Text style={styles.certLabelSm}>
                  {t("module")}
                </Text>

                <Text style={styles.certValue}>
                  {tr(module!.title, lang)}
                </Text>
              </View>

              <View style={styles.certColRight}>
                <Text style={styles.certLabelSm}>
                  {t("score")}
                </Text>

                <Text
                  style={[
                    styles.certValue,
                    { color: colors.success },
                  ]}
                >
                  {cert.score}%
                </Text>
              </View>
            </View>

            <View style={styles.certRow}>
              <View style={styles.certCol}>
                <Text style={styles.certLabelSm}>
                  {t("certificateId")}
                </Text>

                <Text style={styles.certId}>
                  {cert.certificateId}
                </Text>
              </View>

              <View style={styles.certColRight}>
                <Text style={styles.certLabelSm}>
                  {t("completedOn")}
                </Text>

                <Text style={styles.certValue}>
                  {dateStr}
                </Text>
              </View>
            </View>

            <View style={styles.qrWrap}>
              <View style={styles.qrBox}>
                <QRCode
                  value={verifyUrl}
                  size={110}
                  backgroundColor="#FFFFFF"
                  color="#0F172A"
                />
              </View>

              <Text style={styles.qrText}>
                {t("scanToVerify")}
              </Text>

              <View style={styles.verifiedBadge}>
                <Icon
                  name="shield-check"
                  size={14}
                  color={colors.onSuccess}
                />

                <Text style={styles.verifiedText}>
                  {t("verified")}
                </Text>
              </View>
            </View>

            <Text style={styles.certOrg}>
              {cert.org}
            </Text>
          </View>
        </View>

        {!cert.synced ? (
          <View style={styles.offlineNote}>
            <Icon
              name="cloud-off-outline"
              size={16}
              color={colors.warning}
            />

            <Text style={styles.offlineText}>
              {t("offline")}
            </Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Button
            testID="share-cert-btn"
            label={t("shareCertificate")}
            icon="share-variant"
            onPress={onShare}
          />

          <Button
            testID="verify-cert-btn2"
            label={t("verifyCertificate")}
            variant="outline"
            icon="shield-check-outline"
            onPress={() =>
              router.push(
                `/verify?cid=${cert.certificateId}`
              )
            }
          />
        </View>
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: {
    flex: 1,
    backgroundColor: c.surface,
  },

  loadingWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },

  loadingText: {
    color: c.muted,
    fontSize: 14,
    fontWeight: "600",
  },

  header: {
    paddingHorizontal: 8,
    paddingBottom: 4,
  },

  body: {
    flex: 1,
    padding: 16,
    gap: 16,
  },

  cert: {
    backgroundColor: c.surfaceInverse,
    borderRadius: 20,
    padding: 8,
  },

  certBorder: {
    borderWidth: 2,
    borderColor: c.brandPrimary,
    borderRadius: 14,
    padding: 20,
    backgroundColor: c.surfaceSecondary,
    alignItems: "center",
  },

  certLogoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignSelf: "stretch",
  },

  certLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },

  ribbon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },

  certTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: c.onSurface,
    letterSpacing: 1,
    marginTop: 12,
    textAlign: "center",
  },

  certDivider: {
    height: 2,
    backgroundColor: c.brandPrimary,
    width: 60,
    marginVertical: 12,
    borderRadius: 2,
  },

  certLabel: {
    fontSize: 12,
    color: c.muted,
    fontWeight: "600",
  },

  certName: {
    fontSize: 24,
    fontWeight: "900",
    color: c.onSurface,
    marginTop: 4,
    marginBottom: 16,
    textAlign: "center",
  },

  certRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignSelf: "stretch",
    marginBottom: 14,
  },

  certCol: {
    flex: 1,
  },

  certColRight: {
    flex: 1,
    alignItems: "flex-end",
  },

  certLabelSm: {
    fontSize: 11,
    color: c.muted,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  certValue: {
    fontSize: 14,
    fontWeight: "700",
    color: c.onSurface,
    marginTop: 2,
  },

  certId: {
    fontSize: 13,
    fontWeight: "800",
    color: c.brandPrimary,
    marginTop: 2,
  },

  qrWrap: {
    alignItems: "center",
    marginTop: 6,
    gap: 8,
  },

  qrBox: {
    padding: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
  },

  qrText: {
    fontSize: 12,
    color: c.muted,
    fontWeight: "600",
  },

  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: c.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },

  verifiedText: {
    color: c.onSuccess,
    fontSize: 12,
    fontWeight: "800",
  },

  certOrg: {
    fontSize: 11,
    color: c.muted,
    marginTop: 16,
    textAlign: "center",
  },

  offlineNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
  },

  offlineText: {
    fontSize: 12,
    color: c.warning,
    fontWeight: "600",
  },

  actions: {
    gap: 10,
  },
}));
