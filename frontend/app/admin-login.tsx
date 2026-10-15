import { useState } from "react";
import { Alert, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

import { Button, Card } from "@/src/components/ui";
import { adminLogin } from "@/src/api";
import { makeStyles, useTheme } from "@/src/theme";

export default function AdminLoginScreen() {
  const router = useRouter();
  const styles = useStyles();
  const { colors } = useTheme();

  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!id || !password) {
      Alert.alert("Login Required", "Please enter Admin ID and password.");
      return;
    }

    try {
      setLoading(true);

      await adminLogin(id, password);

      router.replace("/admin");
    } catch {
      Alert.alert("Login Failed", "Invalid Admin ID or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.title}>Admin Login</Text>

        <Text style={styles.subtitle}>
          Coordinators & training admins only
        </Text>

        <TextInput
          value={id}
          onChangeText={setId}
          placeholder="Admin ID"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          style={styles.input}
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={colors.muted}
          secureTextEntry
          style={styles.input}
        />

        <Button
          label="Login"
          loading={loading}
          onPress={handleLogin}
        />
      </Card>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: {
    flex: 1,
    backgroundColor: c.surface,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 450,
    gap: 14,
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: c.onSurface,
  },
  subtitle: {
    fontSize: 14,
    color: c.muted,
    marginBottom: 8,
  },
  input: {
    backgroundColor: c.surfaceTertiary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: c.onSurface,
    minHeight: 46,
  },
}));