import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";

import { Button } from "@/src/components/ui";
import { userLogin } from "@/src/api";
import { makeStyles, useTheme } from "@/src/theme";

export default function LoginScreen() {
  const router = useRouter();
  const styles = useStyles();
  const { colors } = useTheme();

  const [workerId, setWorkerId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!workerId.trim() || !password.trim()) {
      Alert.alert("Login", "Please enter Worker ID and password.");
      return;
    }

    try {
      setLoading(true);

      await userLogin(workerId.trim(), password);

      router.replace("/dashboard");
    } catch (error) {
      Alert.alert(
        "Login Failed",
        "Invalid Worker ID or password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container} testID="login-screen">
      <View style={styles.card}>
        <Text style={styles.title}>Worker Login</Text>

        <Text style={styles.subtitle}>
          Login to continue your safety training
        </Text>

        <Text style={styles.label}>Worker ID</Text>

        <TextInput
          testID="login-worker-id"
          value={workerId}
          onChangeText={setWorkerId}
          placeholder="Enter Worker ID"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          style={styles.input}
        />

        <Text style={styles.label}>Password</Text>

        <TextInput
          testID="login-password"
          value={password}
          onChangeText={setPassword}
          placeholder="Enter Password"
          placeholderTextColor={colors.muted}
          secureTextEntry
          style={styles.input}
        />

        <View style={styles.buttonContainer}>
          <Button
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
        </View>

        <Pressable
          onPress={() => router.push("/language")}
          style={styles.registerButton}
        >
          <Text style={styles.registerText}>
            New worker? Register here
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: {
    flex: 1,
    backgroundColor: c.surface,
    justifyContent: "center",
    padding: 24,
  },

  card: {
    backgroundColor: c.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: c.border,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: c.onSurface,
    textAlign: "center",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    color: c.muted,
    textAlign: "center",
    marginBottom: 24,
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    color: c.onSurface,
    marginBottom: 8,
    marginTop: 12,
  },

  input: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: c.onSurface,
    backgroundColor: c.surface,
  },

  buttonContainer: {
    marginTop: 24,
  },

  registerButton: {
    alignItems: "center",
    marginTop: 20,
    paddingVertical: 10,
  },

  registerText: {
    color: c.brandPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
}));
