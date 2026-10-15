import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import NetInfo from "@react-native-community/netinfo";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  View,
  type ViewStyle,
  type StyleProp,
  type TextStyle,
} from "react-native";

import { useI18n } from "@/src/i18n";
import { makeStyles, useTheme } from "@/src/theme";

// -------------------- Icon --------------------
export function Icon({
  name,
  size = 24,
  color,
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  const { colors } = useTheme();
  return (
    // @ts-expect-error MDI glyph name is a broad string set
    <MaterialDesignIcons name={name} size={size} color={color || colors.onSurface} />
  );
}

// -------------------- Button --------------------
type BtnVariant = "primary" | "secondary" | "outline" | "success" | "ghost";
export function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  disabled,
  loading,
  testID,
  style,
  full = true,
}: {
  label: string;
  onPress?: () => void;
  variant?: BtnVariant;
  icon?: string;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  full?: boolean;
}) {
  const s = useBtnStyles();
  const { colors } = useTheme();
  const bg: Record<BtnVariant, string> = {
    primary: colors.brandPrimary,
    secondary: colors.brandSecondary,
    outline: "transparent",
    success: colors.success,
    ghost: "transparent",
  };
  const fg: Record<BtnVariant, string> = {
    primary: colors.onBrandPrimary,
    secondary: colors.onBrandSecondary,
    outline: colors.onSurface,
    success: colors.onSuccess,
    ghost: colors.brandPrimary,
  };
  return (
    <Pressable
      testID={testID}
      disabled={disabled || loading}
      onPress={() => {
        if (Platform.OS !== "web") Haptics.selectionAsync();
        onPress?.();
      }}
      style={({ pressed }) => [
        s.btn,
        full && s.full,
        { backgroundColor: bg[variant] },
        variant === "outline" && s.outline,
        (disabled || loading) && s.disabled,
        pressed && s.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg[variant]} />
      ) : (
        <View style={s.row}>
          {icon ? <Icon name={icon} size={20} color={fg[variant]} /> : null}
          <Text style={[s.label, { color: fg[variant] }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

// -------------------- Card --------------------
export function Card({
  children,
  style,
  onPress,
  testID,
  accent,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  testID?: string;
  accent?: string;
}) {
  const s = useCardStyles();
  const content = (
    <View style={[s.card, accent ? { borderLeftWidth: 4, borderLeftColor: accent } : null, style]}>
      {children}
    </View>
  );
  if (onPress) {
    return (
      <Pressable testID={testID} onPress={onPress} style={({ pressed }) => pressed && s.pressed}>
        {content}
      </Pressable>
    );
  }
  return <View testID={testID}>{content}</View>;
}

// -------------------- Progress Bar --------------------
export function ProgressBar({ value, color }: { value: number; color?: string }) {
  const s = useProgressStyles();
  const { colors } = useTheme();
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View style={s.track}>
      <View style={[s.fill, { width: `${pct}%`, backgroundColor: color || colors.brandPrimary }]} />
    </View>
  );
}

// -------------------- Badge --------------------
export function Badge({ label, color, textColor, icon }: { label: string; color: string; textColor: string; icon?: string }) {
  const s = useBadgeStyles();
  return (
    <View style={[s.badge, { backgroundColor: color }]}>
      {icon ? <Icon name={icon} size={14} color={textColor} /> : null}
      <Text style={[s.badgeText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

// -------------------- Section Title --------------------
export function SectionTitle({ children, right }: { children: string; right?: string }) {
  const s = useSectionStyles();
  return (
    <View style={s.row}>
      <Text style={s.title}>{children}</Text>
      {right ? <Text style={s.right}>{right}</Text> : null}
    </View>
  );
}

// -------------------- Connection Banner --------------------
export function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setOnline(state.isConnected !== false);
    });
    NetInfo.fetch().then((s) => setOnline(s.isConnected !== false));
    return () => unsub();
  }, []);
  return online;
}

export function ConnectionBanner() {
  const online = useOnline();
  const { t } = useI18n();
  const s = useConnStyles();
  const { colors } = useTheme();
  return (
    <View style={[s.banner, { backgroundColor: online ? colors.brandTertiary : colors.warning }]}>
      <View style={[s.dot, { backgroundColor: online ? colors.success : colors.onWarning }]} />
      <Text style={[s.text, { color: online ? colors.onBrandTertiary : colors.onWarning }]} numberOfLines={1}>
        {online ? t("online") : t("offline")}
      </Text>
    </View>
  );
}

// -------------------- Toast (inline feedback) --------------------
export function FeedbackBar({ ok, message }: { ok: boolean; message: string }) {
  const s = useFeedbackStyles();
  const { colors } = useTheme();
  return (
    <View style={[s.bar, { backgroundColor: ok ? colors.success : colors.error }]}>
      <Icon name={ok ? "check-circle" : "close-circle"} size={22} color={colors.onSuccess} />
      <Text style={s.text}>{message}</Text>
    </View>
  );
}

const useBtnStyles = makeStyles((c) => ({
  btn: { minHeight: 52, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  full: { alignSelf: "stretch" },
  outline: { borderWidth: 1.5, borderColor: c.borderStrong },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { fontSize: 16, fontWeight: "700" },
}));

const useCardStyles = makeStyles((c) => ({
  card: {
    backgroundColor: c.surfaceSecondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: c.border,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  pressed: { opacity: 0.92 },
}));

const useProgressStyles = makeStyles((c) => ({
  track: { height: 10, borderRadius: 999, backgroundColor: c.surfaceTertiary, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 999 },
}));

const useBadgeStyles = makeStyles(() => ({
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: "700" },
}));

const useSectionStyles = makeStyles((c) => ({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  title: { fontSize: 20, fontWeight: "800", color: c.onSurface },
  right: { fontSize: 13, color: c.muted },
}));

const useConnStyles = makeStyles(() => ({
  banner: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { fontSize: 12, fontWeight: "700" },
}));

const useFeedbackStyles = makeStyles((c) => ({
  bar: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 12 },
  text: { color: c.onSuccess, fontSize: 15, fontWeight: "700", flex: 1 } as TextStyle,
}));
