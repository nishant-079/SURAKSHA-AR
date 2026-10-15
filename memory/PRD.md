# SURAKSHA AR — Product Requirements Document

## Original Problem Statement
Build a Mobile AR-Based Industrial Safety Training & Certification Platform ("AR-Based Vocational Training Simulator for Industrial Safety in Jharkhand's Mining & Manufacturing Sector"). Runs on mid-range Android 10+ without VR/AR headsets. Core showcase = interactive camera-overlay AR training: Camera → scan → virtual hazards → tap interaction → task completion → assessment → score → pass/fail → QR certificate → verification. Plus a web admin/compliance dashboard.

## User Choices
- AR: Camera-overlay AR (real camera + interactive AR-style markers + scan simulation) — works in Expo Go & web preview.
- Admin dashboard: in-app `/admin` web route.
- Santali: EN/HI complete, Santali on core screens.
- QR verification: in-app `/verify` web route.
- App name: SURAKSHA AR.

## Architecture
- Frontend: Expo Router (stack), React Native. Theme from `src/theme.ts` (navy `#0F172A` + saffron `#F97316`). i18n in `src/i18n` (en/hi/sat). Content (modules, AR markers, tasks, questions) in `src/content/modules.ts`. Local-first data + backend sync in `src/api.ts` (AsyncStorage). QR via react-native-qrcode-svg, camera via expo-camera, icons via @react-native-vector-icons/material-design-icons.
- Backend: FastAPI + MongoDB. Routes under `/api`: config, users, attempts, certificates (+ verify), admin (stats/workers/analytics/certificates/seed). Cert IDs JH-SAFE-YYYY-NNNNNN. Pass threshold configurable via PASS_THRESHOLD env (default 70).

## User Personas
- Vocational trainee / industrial worker (mining, steel, mica) — low-literacy friendly, bilingual, large touch targets.
- Training coordinator / admin — compliance dashboard on web.
- Hackathon judge — Demo Mode for instant end-to-end experience.

## Core Requirements (static)
1. Trilingual onboarding + worker profile.
2. Dashboard hub with progress, modules, certificates, demo mode.
3. Camera-overlay AR: permission handling, scan simulation, marker placement, tap/order/choice tasks, feedback, progress.
4. Fire & Gas AR modules (4 tasks each).
5. Assessment engine (MCQ), configurable pass threshold, retry.
6. QR certificate generation + verification.
7. Offline-first storage + sync + connection status.
8. Web admin/compliance dashboard.
9. Safety disclaimer throughout.

## Implemented (2026-09-28)
- ✅ Splash → Language (EN/HI/Santali) → Registration → Dashboard.
- ✅ Fire & Gas AR modules: permission flow (allow / continue-without-camera / open-settings), scan animation, surface detected, 4 interactive tasks (tap markers, evacuation ordering, PPE, buddy/unsafe-action choices), live feedback + progress.
- ✅ Assessment (7 Q each), score, pass/fail result with circular chart, answer review, retry system.
- ✅ QR certificate + `/verify` (and `/verify?cid=`) verification page.
- ✅ Admin `/admin`: stats, module performance bars, worker table + search, certificate search, seed.
- ✅ Demo Mode, Help/Instructions, offline-first local storage + online/offline banner.
- ✅ Backend 15/15 pytest pass; frontend full E2E verified.

## Backlog (prioritized)
- P1: Audio/voice guidance for Hindi & Santali (structure ready).
- P2: Machinery Safety & PPE modules (currently "Coming Soon").
- P2: Certificate PDF export / print.
- P3: True ARCore plane anchoring in native build.
