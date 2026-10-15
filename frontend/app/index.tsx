import { useRouter } from "expo-router";
import { useEffect } from "react";

import { loadProfile } from "@/src/api";
import { useI18n } from "@/src/i18n";

export default function IndexScreen() {
  const router = useRouter();
  const { ready } = useI18n();

  useEffect(() => {
    if (!ready) return;

    const timer = setTimeout(async () => {
      const profile = await loadProfile();

      if (profile) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }, 1600);

    return () => clearTimeout(timer);
  }, [ready, router]);

  return null;
}