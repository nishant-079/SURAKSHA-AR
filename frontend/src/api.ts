import { useCallback, useEffect, useState } from "react";

import { storage } from "@/src/utils/storage";

export const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "";
export const API = `${BASE_URL}/api`;

export type Profile = {
  id?: string; // backend id
  name: string;
  workerId: string;
  password?: string;
  language: string;
  ageGroup?: string;
  sector?: string;
  organization?: string;
  createdAt?: string;
};

export type AttemptResult = {
  moduleId: string;
  moduleTitle: string;
  score: number;
  correct: number;
  total: number;
  passed: boolean;
  durationSec: number;
  attempts?: number;
  completedAt?: string;
  userId?: string;
};

export type Certificate = {
  certificateId: string;
  userId?: string;
  name: string;
  workerId?: string;
  moduleId: string;
  moduleTitle: string;
  score: number;
  issueDate: string;
  verificationStatus: string;
  org?: string;
  synced?: boolean;
};

const PROFILE_KEY = "suraksha.profile";
const ATTEMPTS_KEY = "suraksha.attempts";
const CERTS_KEY = "suraksha.certs";

export const LAST_RESULT_KEY = "suraksha.lastResult";
const ADMIN_TOKEN_KEY = "suraksha.adminToken";

// ---------------- Admin Auth ----------------
export async function adminLogin(id: string, password: string): Promise<string> {
  const res = await req<{ access_token: string }>("/admin/login", {
    method: "POST",
    body: JSON.stringify({ id, password }),
  });
  await storage.secureSet(ADMIN_TOKEN_KEY, res.access_token);
  return res.access_token;
}
export async function userLogin(
  workerId: string,
  password: string
 ): Promise<Profile> {
  const res = await req<{
    access_token: string;
    user: Profile;
  }>("/users/login", {
    method: "POST",
    body: JSON.stringify({
      workerId,
      password,
    }),
  });

  await saveProfileLocal(res.user);

  return res.user;
}

export async function getAdminToken(): Promise<string | null> {
  return storage.secureGet<string | null>(ADMIN_TOKEN_KEY, null);
}

export async function adminLogout(): Promise<void> {
  await storage.secureRemove(ADMIN_TOKEN_KEY);
}

export async function adminGet<T>(path: string): Promise<T> {
  const token = await getAdminToken();
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token || ""}` } });
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

export async function adminMe(): Promise<boolean> {
  try {
    await adminGet("/admin/me");
    return true;
  } catch {
    return false;
  }
}

async function req<T>(path: string, options?: RequestInit, timeoutMs = 8000): Promise<T> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(id);
  }
}

// ---------------- Profile ----------------
export async function loadProfile(): Promise<Profile | null> {
  return storage.getItem<Profile | null>(PROFILE_KEY, null);
}

export async function saveProfileLocal(p: Profile): Promise<void> {
  await storage.setItem(PROFILE_KEY, p);
}

export async function registerProfile(p: Profile): Promise<Profile> {
  let result = p;

  try {
    const server = await req<Profile>("/users", {
      method: "POST",
      body: JSON.stringify(p),
    });

    result = {
      ...p,
      id: server.id,
      createdAt: server.createdAt,
    };
  } catch {
    // offline — keep local only
  }

  await saveProfileLocal(result);
  return result;
}

export async function clearProfile(): Promise<void> {
  await storage.removeItem(PROFILE_KEY);
}

// ---------------- Attempts (local-first) ----------------
export async function loadAttempts(profileId?: string): Promise<AttemptResult[]> {
  const all = (await storage.getItem<AttemptResult[]>(ATTEMPTS_KEY, [])) || [];

  if (!profileId) {
    return [];
  }

  return all.filter((attempt) => attempt.userId === profileId);
}

export async function saveAttempt(
  profile: Profile | null,
  a: AttemptResult
): Promise<AttemptResult> {
  const all =
    (await storage.getItem<AttemptResult[]>(ATTEMPTS_KEY, [])) || [];

  const userAttempts = profile?.id
    ? all.filter((x) => x.userId === profile.id)
    : [];

  const priorSame = userAttempts.filter(
    (x) => x.moduleId === a.moduleId
  ).length;

  const withMeta: AttemptResult = {
    ...a,
    userId: profile?.id,
    attempts: priorSame + 1,
    completedAt: new Date().toISOString(),
  };

  const next = [...all, withMeta];

  await storage.setItem(ATTEMPTS_KEY, next);

  if (profile?.id) {
    try {
      await req("/attempts", {
        method: "POST",
        body: JSON.stringify({
          userId: profile.id,
          workerName: profile.name,
          moduleId: a.moduleId,
          moduleTitle: a.moduleTitle,
          score: a.score,
          correct: a.correct,
          total: a.total,
          passed: a.passed,
          durationSec: a.durationSec,
          language: profile.language,
        }),
      });
    } catch {
      /* offline, stays local */
    }
  }

  return withMeta;
}

export function bestScoreFor(attempts: AttemptResult[], moduleId: string): number {
  return Math.max(0, ...attempts.filter((a) => a.moduleId === moduleId).map((a) => a.score));
}
export function attemptCountFor(attempts: AttemptResult[], moduleId: string): number {
  return attempts.filter((a) => a.moduleId === moduleId).length;
}
export function isModulePassed(attempts: AttemptResult[], moduleId: string): boolean {
  return attempts.some((a) => a.moduleId === moduleId && a.passed);
}

// ---------------- Certificates ----------------
export async function loadCerts(profileId?: string): Promise<Certificate[]> {
  const all =
    (await storage.getItem<Certificate[]>(CERTS_KEY, [])) || [];

  if (!profileId) {
    return [];
  }

  return all.filter((cert) => cert.userId === profileId);
}

function localCertId(): string {
  const year = new Date().getFullYear();
  const n = Math.floor(100000 + Math.random() * 899999);
  return `JH-SAFE-${year}-${String(n).slice(0, 6)}`;
}

export async function issueCertificate(
  profile: Profile,
  moduleId: string,
  moduleTitle: string,
  score: number
): Promise<Certificate> {
  let cert: Certificate | null = null;

  if (profile.id) {
    try {
      const server = await req<Certificate>("/certificates", {
        method: "POST",
        body: JSON.stringify({
          userId: profile.id,
          name: profile.name,
          workerId: profile.workerId,
          moduleId,
          moduleTitle,
          score,
          language: profile.language,
        }),
      });

      cert = { ...server, synced: true };
    } catch {
      /* offline */
    }
  }

  if (!cert) {
    cert = {
      certificateId: localCertId(),
      userId: profile.id,
      name: profile.name,
      workerId: profile.workerId,
      moduleId,
      moduleTitle,
      score,
      issueDate: new Date().toISOString(),
      verificationStatus: "VERIFIED",
      org: "SURAKSHA AR — Vocational Safety Training",
      synced: false,
    };
  }

  const all =
    (await storage.getItem<Certificate[]>(CERTS_KEY, [])) || [];

  const existingIndex = all.findIndex(
    (c) => c.userId === profile.id && c.moduleId === moduleId
  );

  let next: Certificate[];

  if (existingIndex !== -1) {
    next = [...all];
    next[existingIndex] = cert;
  } else {
    next = [...all, cert];
  }

  await storage.setItem(CERTS_KEY, next);

  return cert;
}

export async function verifyCertificate(certId: string): Promise<Certificate & { found: boolean }> {
  try {
    const server = await req<Certificate & { found: boolean }>(`/certificates/verify/${certId}`);
    if (server.found) return server;
  } catch {
    /* fall through to local */
  }
  const all = await loadCerts();
  const local = all.find((c) => c.certificateId === certId);
  if (local) return { ...local, found: true };
  return { found: false } as Certificate & { found: boolean };
}

// ---------------- Config ----------------
let cachedThreshold: number | null = null;
export async function getPassThreshold(): Promise<number> {
  if (cachedThreshold != null) return cachedThreshold;
  try {
    const cfg = await req<{ passThreshold: number }>("/config");
    cachedThreshold = cfg.passThreshold ?? 70;
  } catch {
    cachedThreshold = 70;
  }
  return cachedThreshold;
}

// ---------------- Hooks ----------------
export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setProfile(await loadProfile());
    setLoading(false);
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);
  return { profile, loading, refresh, setProfile };
}
export async function clearLocalTrainingData(): Promise<void> {
  await storage.removeItem(ATTEMPTS_KEY);
  await storage.removeItem(CERTS_KEY);
}
