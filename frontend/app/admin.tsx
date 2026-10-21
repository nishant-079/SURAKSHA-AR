import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card, Icon } from "@/src/components/ui";
import { adminGet, adminPost } from "@/src/api";
import { makeStyles, useTheme } from "@/src/theme";

async function get<T>(path: string): Promise<T> {
  return adminGet<T>(path);
}

type Stats = {
  totalWorkers: number;
  trainingCompleted: number;
  passRate: number;
  certificatesIssued: number;
};

type Worker = {
  id: string;
  name: string;
  workerId: string;
  language: string;
  sector?: string;
  bestScore: number;
  totalAttempts: number;
  completed: boolean;
  certificates: number;
};

type Analytics = {
  modules: {
    module: string;
    attempts: number;
    passed: number;
    failed: number;
    avgScore: number;
  }[];
};

type Cert = {
  certificateId: string;
  name: string;
  workerId?: string;
  moduleTitle: string;
  score: number;
  verificationStatus: string;
};

export default function AdminScreen() {
  const router = useRouter();
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const qc = useQueryClient();
  const wide = width > 720;

  const [search, setSearch] = useState("");
  const [certQuery, setCertQuery] = useState("");
  const [seedMessage, setSeedMessage] = useState("");

  const stats = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => get<Stats>("/admin/stats"),
  });

  const workers = useQuery({
    queryKey: ["admin-workers"],
    queryFn: () => get<Worker[]>("/admin/workers"),
  });

  const analytics = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => get<Analytics>("/admin/analytics"),
  });

  const certs = useQuery({
    queryKey: ["admin-certs", certQuery],
    queryFn: () =>
      get<Cert[]>(
        `/admin/certificates?query=${encodeURIComponent(certQuery)}`
      ),
  });

  const seed = useMutation({
    mutationFn: () =>
      adminPost<{ message?: string }>("/admin/seed"),

    onSuccess: async (result) => {
      setSeedMessage(result?.message || "Demo data request completed.");

      await Promise.all([
        qc.invalidateQueries({ queryKey: ["admin-stats"] }),
        qc.invalidateQueries({ queryKey: ["admin-workers"] }),
        qc.invalidateQueries({ queryKey: ["admin-analytics"] }),
        qc.invalidateQueries({ queryKey: ["admin-certs"] }),
      ]);
    },

    onError: (error: Error) => {
      setSeedMessage(
        error.message === "unauthorized"
          ? "Admin session expired. Please log in again."
          : `Could not seed demo data: ${error.message}`
      );
    },
  });

  const filteredWorkers = (workers.data || []).filter((worker) => {
    const query = search.trim().toLowerCase();

    return (
      !query ||
      worker.name.toLowerCase().includes(query) ||
      worker.workerId.toLowerCase().includes(query)
    );
  });

  const statCards = [
    {
      label: "Total Workers",
      value: stats.data?.totalWorkers ?? "—",
      icon: "account-group",
      color: colors.info,
    },
    {
      label: "Training Completed",
      value: stats.data?.trainingCompleted ?? "—",
      icon: "school",
      color: colors.success,
    },
    {
      label: "Pass Rate",
      value: stats.data ? `${stats.data.passRate}%` : "—",
      icon: "chart-line",
      color: colors.brandPrimary,
    },
    {
      label: "Certificates Issued",
      value: stats.data?.certificatesIssued ?? "—",
      icon: "certificate",
      color: colors.warning,
    },
  ];

  const maxAttempts = Math.max(
    1,
    ...(analytics.data?.modules.map((module) => module.attempts) || [1])
  );

  return (
    <View style={styles.container} testID="admin-screen">
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 12 },
        ]}
      >
        <View style={styles.headerInner}>
          <View style={styles.headerRow}>
            <View style={styles.logo}>
              <Icon
                name="view-dashboard"
                size={22}
                color={colors.brandPrimary}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Compliance Dashboard</Text>
              <Text style={styles.sub}>
                SURAKSHA AR — Admin &amp; Training Coordinators
              </Text>
            </View>

            <Pressable
              onPress={() => {
                setSeedMessage("");
                seed.mutate();
              }}
              disabled={seed.isPending}
              accessibilityRole="button"
              accessibilityLabel="Seed demo data"
              style={({ pressed }) => [
                styles.seedButton,
                {
                  opacity: seed.isPending ? 0.65 : pressed ? 0.8 : 1,
                },
              ]}
            >
              {seed.isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Icon
                  name="database-plus"
                  size={18}
                  color="#FFFFFF"
                />
              )}

              <Text style={styles.seedButtonText}>
                {seed.isPending ? "Loading..." : "Seed Demo"}
              </Text>
            </Pressable>
          </View>

          {seedMessage ? (
            <Text
              accessibilityRole="alert"
              style={styles.seedMessage}
            >
              {seedMessage}
            </Text>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>
          {/* Stat cards */}
          <View style={styles.statGrid}>
            {statCards.map((stat) => (
              <View
                key={stat.label}
                style={wide ? styles.statWide : styles.statNarrow}
              >
                <Card style={styles.statCard}>
                  <View
                    style={[
                      styles.statIcon,
                      { backgroundColor: `${stat.color}22` },
                    ]}
                  >
                    <Icon
                      name={stat.icon}
                      size={24}
                      color={stat.color}
                    />
                  </View>

                  <Text style={styles.statValue} numberOfLines={1}>
                    {String(stat.value)}
                  </Text>

                  <Text style={styles.statLabel} numberOfLines={2}>
                    {stat.label}
                  </Text>
                </Card>
              </View>
            ))}
          </View>

          {/* Analytics */}
          <Card style={{ gap: 14 }}>
            <Text style={styles.cardTitle}>Module Performance</Text>

            {analytics.isLoading ? (
              <ActivityIndicator color={colors.brandPrimary} />
            ) : null}

            {analytics.isError ? (
              <Text style={styles.errorText}>
                Could not load module analytics.
              </Text>
            ) : null}

            {(analytics.data?.modules || []).map((module) => (
              <View key={module.module} style={styles.barRow}>
                <View style={styles.barHead}>
                  <Text style={styles.barLabel}>
                    {module.module}
                  </Text>

                  <Text style={styles.barMeta}>
                    avg {module.avgScore}% · {module.attempts} attempts
                  </Text>
                </View>

                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barPassed,
                      { flex: module.passed },
                    ]}
                  />

                  <View
                    style={[
                      styles.barFailed,
                      { flex: module.failed },
                    ]}
                  />

                  <View
                    style={{
                      flex: Math.max(
                        0,
                        maxAttempts - module.attempts
                      ),
                    }}
                  />
                </View>

                <View style={styles.legend}>
                  <View style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendDot,
                        { backgroundColor: colors.success },
                      ]}
                    />
                    <Text style={styles.legendText}>
                      {module.passed} passed
                    </Text>
                  </View>

                  <View style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendDot,
                        { backgroundColor: colors.error },
                      ]}
                    />
                    <Text style={styles.legendText}>
                      {module.failed} failed
                    </Text>
                  </View>
                </View>
              </View>
            ))}

            {!analytics.isLoading &&
            !analytics.isError &&
            analytics.data?.modules.length === 0 ? (
              <Text style={styles.emptyHint}>
                No attempts yet. Use Seed Demo if demo data is needed.
              </Text>
            ) : null}
          </Card>

          {/* Worker management */}
          <Card style={{ gap: 12 }}>
            <Text style={styles.cardTitle}>Worker Management</Text>

            <TextInput
              testID="admin-worker-search"
              value={search}
              onChangeText={setSearch}
              placeholder="Search by name or worker ID"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />

            <View style={styles.tableHead}>
              <Text style={[styles.th, { flex: 2 }]}>Worker</Text>
              <Text style={[styles.th, { flex: 1 }]}>Sector</Text>
              <Text
                style={[
                  styles.th,
                  { flex: 1, textAlign: "center" },
                ]}
              >
                Best
              </Text>
              <Text
                style={[
                  styles.th,
                  { flex: 1, textAlign: "center" },
                ]}
              >
                Status
              </Text>
            </View>

            {workers.isLoading ? (
              <ActivityIndicator color={colors.brandPrimary} />
            ) : null}

            {workers.isError ? (
              <Text style={styles.errorText}>
                Could not load workers. Check your admin session.
              </Text>
            ) : null}

            {filteredWorkers.slice(0, 50).map((worker) => (
              <View key={worker.id} style={styles.tableRow}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.wName}>{worker.name}</Text>
                  <Text style={styles.wId}>
                    {worker.workerId} · {worker.language.toUpperCase()}
                  </Text>
                </View>

                <Text style={[styles.td, { flex: 1 }]}>
                  {worker.sector || "—"}
                </Text>

                <Text
                  style={[
                    styles.td,
                    {
                      flex: 1,
                      textAlign: "center",
                      fontWeight: "800",
                    },
                  ]}
                >
                  {worker.bestScore}%
                </Text>

                <View style={{ flex: 1, alignItems: "center" }}>
                  <View
                    style={[
                      styles.statusChip,
                      {
                        backgroundColor: worker.completed
                          ? colors.success
                          : colors.surfaceTertiary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        {
                          color: worker.completed
                            ? colors.onSuccess
                            : colors.onSurfaceTertiary,
                        },
                      ]}
                    >
                      {worker.completed ? "Done" : "Pending"}
                    </Text>
                  </View>
                </View>
              </View>
            ))}

            {!workers.isLoading &&
            !workers.isError &&
            filteredWorkers.length === 0 ? (
              <Text style={styles.emptyHint}>
                No workers found.
              </Text>
            ) : null}
          </Card>

          {/* Certificate management */}
          <Card style={{ gap: 12 }}>
            <Text style={styles.cardTitle}>Certificate Management</Text>

            <View style={styles.certSearchRow}>
              <TextInput
                testID="admin-cert-search"
                value={certQuery}
                onChangeText={setCertQuery}
                placeholder="Certificate ID, worker name or ID"
                placeholderTextColor={colors.muted}
                style={[styles.input, { flex: 1 }]}
              />
            </View>

            {certs.isLoading ? (
              <ActivityIndicator color={colors.brandPrimary} />
            ) : null}

            {certs.isError ? (
              <Text style={styles.errorText}>
                Could not load certificates. Check your admin session.
              </Text>
            ) : null}

            {(certs.data || []).slice(0, 50).map((cert) => (
              <View
                key={cert.certificateId}
                style={styles.certRow}
              >
                <Icon
                  name="certificate"
                  size={20}
                  color={colors.brandPrimary}
                />

                <View style={{ flex: 1 }}>
                  <Text style={styles.certId}>
                    {cert.certificateId}
                  </Text>

                  <Text style={styles.certMeta}>
                    {cert.name} · {cert.moduleTitle} · {cert.score}%
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusChip,
                    { backgroundColor: colors.success },
                  ]}
                >
                  <Icon
                    name="check"
                    size={12}
                    color={colors.onSuccess}
                  />

                  <Text
                    style={[
                      styles.statusChipText,
                      { color: colors.onSuccess },
                    ]}
                  >
                    {cert.verificationStatus || "Valid"}
                  </Text>
                </View>
              </View>
            ))}

            {!certs.isLoading &&
            !certs.isError &&
            (certs.data || []).length === 0 ? (
              <Text style={styles.emptyHint}>
                No certificates found.
              </Text>
            ) : null}
          </Card>

          <Pressable
            style={styles.backLink}
            onPress={() => router.replace("/dashboard")}
            accessibilityRole="button"
          >
            <Icon
              name="arrow-left"
              size={16}
              color={colors.muted}
            />
            <Text style={styles.backText}>Back to app</Text>
          </Pressable>
        </View>
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
    backgroundColor: c.surfaceInverse,
    paddingBottom: 18,
  },

  headerInner: {
    paddingHorizontal: 20,
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  logo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: c.onBrand,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontSize: 20,
    fontWeight: "900",
    color: c.onSurfaceInverse,
  },

  sub: {
    fontSize: 12,
    color: c.muted,
    marginTop: 2,
  },

  seedButton: {
    backgroundColor: "#17365D",
    borderColor: "#7DB7FF",
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  seedButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  seedMessage: {
    color: "#FFFFFF",
    fontSize: 12,
    marginTop: 10,
  },

  body: {
    padding: 16,
  },

  inner: {
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
    gap: 16,
  },

  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  statCard: {
    gap: 8,
    paddingVertical: 18,
    alignItems: "flex-start",
  },

  statWide: {
    width: "23.5%",
    minWidth: 200,
  },

  statNarrow: {
    width: "47.5%",
    minWidth: 150,
  },

  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  statValue: {
    fontSize: 26,
    fontWeight: "900",
    color: c.onSurface,
  },

  statLabel: {
    fontSize: 12,
    color: c.muted,
    fontWeight: "600",
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: c.onSurface,
  },

  barRow: {
    gap: 6,
  },

  barHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  barLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: c.onSurface,
  },

  barMeta: {
    fontSize: 12,
    color: c.muted,
  },

  barTrack: {
    flexDirection: "row",
    height: 16,
    borderRadius: 8,
    backgroundColor: c.surfaceTertiary,
    overflow: "hidden",
  },

  barPassed: {
    backgroundColor: c.success,
  },

  barFailed: {
    backgroundColor: c.error,
  },

  legend: {
    flexDirection: "row",
    gap: 16,
    marginTop: 2,
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  legendText: {
    fontSize: 11,
    color: c.muted,
  },

  input: {
    backgroundColor: c.surfaceTertiary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: c.onSurface,
    minHeight: 46,
  },

  tableHead: {
    flexDirection: "row",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },

  th: {
    fontSize: 11,
    fontWeight: "800",
    color: c.muted,
    textTransform: "uppercase",
  },

  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: c.divider,
  },

  wName: {
    fontSize: 14,
    fontWeight: "700",
    color: c.onSurface,
  },

  wId: {
    fontSize: 11,
    color: c.muted,
    marginTop: 1,
  },

  td: {
    fontSize: 13,
    color: c.onSurfaceSecondary,
  },

  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },

  statusChipText: {
    fontSize: 11,
    fontWeight: "800",
  },

  certSearchRow: {
    flexDirection: "row",
    gap: 10,
  },

  certRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: c.divider,
  },

  certId: {
    fontSize: 13,
    fontWeight: "800",
    color: c.brandPrimary,
  },

  certMeta: {
    fontSize: 12,
    color: c.muted,
    marginTop: 1,
  },

  emptyHint: {
    fontSize: 13,
    color: c.muted,
    fontStyle: "italic",
    paddingVertical: 8,
  },

  errorText: {
    fontSize: 13,
    color: c.error,
    paddingVertical: 8,
  },

  backLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },

  backText: {
    fontSize: 13,
    color: c.muted,
    fontWeight: "600",
  },
}));
