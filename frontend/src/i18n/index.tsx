import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { storage } from "@/src/utils/storage";

export type Lang = "en" | "hi" | "sat";

export const LANGUAGES: { code: Lang; label: string; native: string; flag: string }[] = [
  { code: "en", label: "English", native: "English", flag: "🌐" },
  { code: "hi", label: "Hindi", native: "हिंदी", flag: "🇮🇳" },
  { code: "sat", label: "Santali", native: "ᱥᱟᱱᱛᱟᱲᱤ", flag: "🏔️" },
];

// UI strings. hi complete, sat on core screens (falls back to en).
type Dict = Record<string, { en: string; hi: string; sat?: string }>;

const S: Dict = {
  appName: { en: "SURAKSHA AR", hi: "सुरक्षा AR", sat: "SURAKSHA AR" },
  tagline: { en: "AR Industrial Safety Training", hi: "AR औद्योगिक सुरक्षा प्रशिक्षण", sat: "AR ᱥᱩᱨᱠᱷᱮᱚ ᱛᱟᱞᱤᱢ" },
  govtLine: { en: "Vocational Safety Training — Jharkhand", hi: "व्यावसायिक सुरक्षा प्रशिक्षण — झारखंड", sat: "ᱡᱷᱟᱨᱠᱷᱚᱸᱰ" },

  continue: { en: "Continue", hi: "आगे बढ़ें", sat: "ᱟᱭᱩᱨ" },
  start: { en: "Start", hi: "शुरू करें", sat: "ᱮᱦᱚᱵ" },
  next: { en: "Next", hi: "अगला", sat: "ᱤᱱᱟᱹ ᱛᱟᱭᱚᱢ" },
  back: { en: "Back", hi: "पीछे", sat: "ᱛᱟᱭᱚᱢ" },
  retry: { en: "Try Again", hi: "फिर से करें", sat: "ᱫᱚᱦᱲᱟ" },
  hint: { en: "Hint", hi: "संकेत", sat: "ᱥᱟᱶᱛᱮ" },
  correct: { en: "Correct", hi: "सही", sat: "ᱴᱷᱤᱠ" },
  incorrect: { en: "Incorrect", hi: "गलत", sat: "ᱵᱷᱩᱞ" },
  online: { en: "Online", hi: "ऑनलाइन", sat: "ᱚᱱᱞᱟᱭᱤᱱ" },
  offline: { en: "Offline — Progress saved locally", hi: "ऑफ़लाइन — प्रगति सहेजी गई", sat: "ᱚᱨᱮᱞᱟᱭᱤᱱ" },
  demoMode: { en: "Demo Mode", hi: "डेमो मोड", sat: "ᱰᱮᱢᱚ" },

  // Language screen
  chooseLanguage: { en: "Choose your language", hi: "अपनी भाषा चुनें", sat: "ᱟᱢᱟᱜ ᱯᱟᱹᱨᱥᱤ ᱵᱟᱪᱷᱟᱣ" },
  langSubtitle: { en: "Select a language to continue", hi: "जारी रखने के लिए भाषा चुनें", sat: "ᱟᱭᱩᱨ ᱞᱟᱹᱜᱤᱫ ᱯᱟᱹᱨᱥᱤ ᱵᱟᱪᱷᱟᱣ" },

  // Register
  registration: { en: "Registration", hi: "पंजीकरण", sat: "ᱨᱮᱡᱤᱥᱴᱨᱮᱥᱚᱱ" },
  fullName: { en: "Full Name", hi: "पूरा नाम", sat: "ᱯᱩᱨᱟᱹ ᱧᱩᱛᱩᱢ" },
  fullNamePh: { en: "Enter your full name", hi: "अपना पूरा नाम लिखें", sat: "ᱧᱩᱛᱩᱢ ᱚᱞ" },
  workerId: { en: "Worker ID", hi: "वर्कर आईडी", sat: "ᱠᱟᱹᱢᱤ ID" },
  workerIdPh: { en: "e.g. WK-2026-001", hi: "जैसे WK-2026-001", sat: "WK-2026-001" },
  ageGroup: { en: "Age Group", hi: "आयु समूह", sat: "ᱩᱢᱮᱨ" },
  sector: { en: "Sector", hi: "क्षेत्र", sat: "ᱮᱞᱟᱠᱟ" },
  organization: { en: "Organization", hi: "संगठन", sat: "ᱥᱚᱸᱜᱚᱛᱷᱚᱱ" },
  organizationPh: { en: "Workplace / Company name", hi: "कार्यस्थल / कंपनी का नाम", sat: "ᱠᱟᱹᱢᱤ ᱡᱟᱭᱜᱟ" },
  register: { en: "Register", hi: "पंजीकरण करें", sat: "ᱨᱮᱡᱤᱥᱴᱟᱨ" },
  mining: { en: "Mining", hi: "खनन", sat: "ᱠᱷᱟᱱᱤᱡ" },
  steel: { en: "Steel", hi: "इस्पात", sat: "ᱤᱥᱯᱟᱛ" },
  mica: { en: "Mica", hi: "अभ्रक", sat: "ᱟᱵᱷᱨᱚᱠ" },
  other: { en: "Other", hi: "अन्य", sat: "ᱮᱴᱟᱜ" },
  nameRequired: { en: "Please enter your name", hi: "कृपया अपना नाम लिखें", sat: "ᱧᱩᱛᱩᱢ ᱚᱞ" },

  // Dashboard
  greeting: { en: "Namaste", hi: "नमस्ते", sat: "ᱡᱚᱦᱟᱨ" },
  readyToTrain: { en: "Ready to train safely?", hi: "सुरक्षित प्रशिक्षण के लिए तैयार?", sat: "ᱛᱟᱞᱤᱢ ᱞᱟᱹᱜᱤᱫ ᱛᱮᱭᱟᱨ?" },
  trainingProgress: { en: "Training Progress", hi: "प्रशिक्षण प्रगति", sat: "ᱛᱟᱞᱤᱢ ᱢᱟᱲᱟᱝ" },
  latestScore: { en: "Latest Score", hi: "नवीनतम स्कोर", sat: "ᱱᱟᱶᱟ ᱥᱠᱚᱨ" },
  certificates: { en: "Certificates", hi: "प्रमाण पत्र", sat: "ᱥᱟᱨᱴᱤᱯᱷᱤᱠᱮᱴ" },
  safetyModules: { en: "Safety Modules", hi: "सुरक्षा मॉड्यूल", sat: "ᱥᱩᱨᱠᱷᱮᱚ ᱢᱚᱰᱭᱩᱞ" },
  completed: { en: "Completed", hi: "पूर्ण", sat: "ᱯᱩᱨᱟᱹᱣ" },
  inProgress: { en: "In Progress", hi: "जारी", sat: "ᱪᱟᱞᱟᱜ" },
  startTraining: { en: "Start Training", hi: "प्रशिक्षण शुरू करें", sat: "ᱛᱟᱞᱤᱢ ᱮᱦᱚᱵ" },
  comingSoon: { en: "Coming Soon", hi: "जल्द आ रहा है", sat: "ᱞᱟᱦᱟᱛᱮ" },
  locked: { en: "Locked", hi: "बंद", sat: "ᱵᱚᱸᱫᱚ" },
  lessons: { en: "lessons", hi: "पाठ", sat: "ᱯᱟᱠᱷᱟᱛᱩ" },
  myCertificates: { en: "My Certificates", hi: "मेरे प्रमाण पत्र", sat: "ᱟᱢᱟᱜ ᱥᱟᱨᱴᱤᱯᱷᱤᱠᱮᱴ" },
  verifyCertificate: { en: "Verify Certificate", hi: "प्रमाण पत्र सत्यापित करें", sat: "ᱥᱟᱨᱴᱤᱯᱷᱤᱠᱮᱴ ᱡᱟᱸᱪ" },
  helpInstructions: { en: "Help & Instructions", hi: "सहायता और निर्देश", sat: "ᱜᱚᱲᱚ" },
  noScore: { en: "Not attempted yet", hi: "अभी तक नहीं", sat: "ᱟᱞᱮ ᱵᱟᱹᱝ" },

  // AR onboarding
  arReady: { en: "AR Safety Simulation", hi: "AR सुरक्षा सिमुलेशन", sat: "AR ᱥᱩᱨᱠᱷᱮᱚ" },
  allowCamera: { en: "Allow Camera Access", hi: "कैमरा एक्सेस दें", sat: "ᱠᱮᱢᱨᱟ ᱮᱢ" },
  cameraWhy: { en: "Camera is used to place virtual safety hazards in your surroundings for training.", hi: "प्रशिक्षण के लिए आपके आसपास वर्चुअल सुरक्षा खतरे दिखाने हेतु कैमरे का उपयोग होता है।", sat: "ᱛᱟᱞᱤᱢ ᱞᱟᱹᱜᱤᱫ ᱠᱮᱢᱨᱟ ᱵᱮᱵᱷᱟᱨ" },
  cameraDenied: { en: "Camera access is required for AR training.", hi: "AR प्रशिक्षण के लिए कैमरा एक्सेस आवश्यक है।", sat: "AR ᱛᱟᱞᱤᱢ ᱞᱟᱹᱜᱤᱫ ᱠᱮᱢᱨᱟ ᱡᱚᱨᱩᱨ" },
  openSettings: { en: "Open Settings", hi: "सेटिंग्स खोलें", sat: "ᱥᱮᱴᱤᱝ ᱡᱷᱤᱡ" },
  continueSim: { en: "Continue without camera", hi: "बिना कैमरे के जारी रखें", sat: "ᱠᱮᱢᱨᱟ ᱵᱟᱝ ᱛᱮ ᱟᱭᱩᱨ" },
  scanArea: { en: "Move your phone slowly to scan the area", hi: "क्षेत्र स्कैन करने के लिए फोन धीरे-धीरे घुमाएं", sat: "ᱮᱞᱟᱠᱟ ᱥᱠᱮᱱ ᱞᱟᱹᱜᱤᱫ ᱯᱷᱚᱱ ᱟᱞᱜᱟ ᱚᱲᱚᱠ" },
  surfaceDetected: { en: "Surface detected!", hi: "सतह मिल गई!", sat: "ᱡᱟᱭᱜᱟ ᱧᱟᱢ!" },
  placeScenario: { en: "Place Training Scenario", hi: "प्रशिक्षण दृश्य रखें", sat: "ᱛᱟᱞᱤᱢ ᱡᱟᱭᱜᱟ" },
  startSimulation: { en: "Start Simulation", hi: "सिमुलेशन शुरू करें", sat: "ᱮᱦᱚᱵ" },
  poorTracking: { en: "Move the phone slowly and point it toward a textured surface.", hi: "फोन धीरे घुमाएं और किसी सतह की ओर रखें।", sat: "ᱯᱷᱚᱱ ᱟᱞᱜᱟ ᱚᱲᱚᱠ" },

  // AR tasks overlay
  task: { en: "Task", hi: "कार्य", sat: "ᱠᱟᱹᱢᱤ" },
  tapToSelect: { en: "Tap an object to select", hi: "चुनने के लिए ऑब्जेक्ट पर टैप करें", sat: "ᱵᱟᱪᱷᱟᱣ ᱞᱟᱹᱜᱤᱫ ᱴᱟᱯ" },
  taskComplete: { en: "Task Complete!", hi: "कार्य पूर्ण!", sat: "ᱠᱟᱹᱢᱤ ᱯᱩᱨᱟᱹᱣ!" },
  moduleComplete: { en: "All tasks complete!", hi: "सभी कार्य पूर्ण!", sat: "ᱡᱷᱚᱛᱚ ᱠᱟᱹᱢᱤ ᱯᱩᱨᱟᱹᱣ!" },
  startAssessment: { en: "Start Assessment", hi: "मूल्यांकन शुरू करें", sat: "ᱡᱟᱸᱪ ᱮᱦᱚᱵ" },
  arrangeOrder: { en: "Tap in the correct order", hi: "सही क्रम में टैप करें", sat: "ᱴᱷᱤᱠ ᱛᱚᱨᱮᱛᱮ ᱴᱟᱯ" },
  resetOrder: { en: "Reset", hi: "फिर से", sat: "ᱫᱚᱦᱲᱟ" },

  // Assessment
  assessment: { en: "Assessment", hi: "मूल्यांकन", sat: "ᱡᱟᱸᱪ" },
  question: { en: "Question", hi: "प्रश्न", sat: "ᱠᱩᱠᱞᱤ" },
  of: { en: "of", hi: "में से", sat: "ᱠᱷᱚᱱ" },
  submit: { en: "Submit", hi: "जमा करें", sat: "ᱡᱚᱢᱟ" },
  tapAnswer: { en: "Tap the correct answer", hi: "सही उत्तर पर टैप करें", sat: "ᱴᱷᱤᱠ ᱛᱮᱞᱟ ᱴᱟᱯ" },

  // Result
  passed: { en: "PASSED!", hi: "उत्तीर्ण!", sat: "ᱯᱟᱥ!" },
  failed: { en: "Not Passed", hi: "उत्तीर्ण नहीं", sat: "ᱵᱟᱝ ᱯᱟᱥ" },
  congrats: { en: "Congratulations! You completed the training.", hi: "बधाई! आपने प्रशिक्षण पूरा किया।", sat: "ᱡᱚᱦᱟᱨ! ᱛᱟᱞᱤᱢ ᱯᱩᱨᱟᱹᱣ" },
  reviewNeeded: { en: "Please review the training and try the assessment again.", hi: "कृपया प्रशिक्षण दोहराएं और मूल्यांकन फिर से करें।", sat: "ᱛᱟᱞᱤᱢ ᱫᱚᱦᱲᱟ ᱟᱨ ᱡᱟᱸᱪ ᱫᱚᱦᱲᱟ" },
  timeTaken: { en: "Time Taken", hi: "लगा समय", sat: "ᱚᱠᱛᱚ" },
  passMark: { en: "Pass Mark", hi: "पास अंक", sat: "ᱯᱟᱥ ᱢᱟᱨᱠ" },
  getCertificate: { en: "Get Certificate", hi: "प्रमाण पत्र प्राप्त करें", sat: "ᱥᱟᱨᱴᱤᱯᱷᱤᱠᱮᱴ ᱧᱟᱢ" },
  backToDashboard: { en: "Back to Dashboard", hi: "डैशबोर्ड पर जाएं", sat: "ᱰᱮᱥᱵᱚᱰ" },
  reviewTraining: { en: "Review Training", hi: "प्रशिक्षण देखें", sat: "ᱛᱟᱞᱤᱢ ᱧᱮᱞ" },
  retryAssessment: { en: "Retry Assessment", hi: "मूल्यांकन फिर से", sat: "ᱡᱟᱸᱪ ᱫᱚᱦᱲᱟ" },
  answerReview: { en: "Answer Review", hi: "उत्तर समीक्षा", sat: "ᱛᱮᱞᱟ ᱧᱮᱞ" },
  yourAnswer: { en: "Your answer", hi: "आपका उत्तर", sat: "ᱟᱢᱟᱜ ᱛᱮᱞᱟ" },
  correctAnswer: { en: "Correct answer", hi: "सही उत्तर", sat: "ᱴᱷᱤᱠ ᱛᱮᱞᱟ" },
  attempt: { en: "Attempt", hi: "प्रयास", sat: "ᱠᱚᱥᱮᱥ" },

  // Certificate
  certificateTitle: { en: "SAFETY TRAINING CERTIFICATE", hi: "सुरक्षा प्रशिक्षण प्रमाण पत्र", sat: "ᱥᱩᱨᱠᱷᱮᱚ ᱛᱟᱞᱤᱢ ᱥᱟᱨᱴᱤᱯᱷᱤᱠᱮᱴ" },
  certifiedWorker: { en: "Certified Worker", hi: "प्रमाणित कर्मचारी", sat: "ᱥᱟᱨᱴᱤᱯᱷᱟᱭᱤᱰ ᱠᱟᱹᱢᱤᱭᱟᱹ" },
  module: { en: "Module", hi: "मॉड्यूल", sat: "ᱢᱚᱰᱭᱩᱞ" },
  score: { en: "Score", hi: "स्कोर", sat: "ᱥᱠᱚᱨ" },
  certificateId: { en: "Certificate ID", hi: "प्रमाण पत्र आईडी", sat: "ᱥᱟᱨᱴᱤᱯᱷᱤᱠᱮᱴ ID" },
  completedOn: { en: "Completed", hi: "पूर्ण तिथि", sat: "ᱯᱩᱨᱟᱹᱣ" },
  scanToVerify: { en: "Scan to verify", hi: "सत्यापन हेतु स्कैन करें", sat: "ᱡᱟᱸᱪ ᱞᱟᱹᱜᱤᱫ ᱥᱠᱮᱱ" },
  shareCertificate: { en: "Share Certificate", hi: "प्रमाण पत्र साझा करें", sat: "ᱥᱟᱨᱴᱤᱯᱷᱤᱠᱮᱴ ᱦᱟᱴᱤᱧ" },
  syncing: { en: "Saving to server…", hi: "सर्वर पर सहेजा जा रहा है…", sat: "ᱥᱟᱶᱛᱮ ᱫᱚᱦᱚ" },

  // Verify
  verification: { en: "Certificate Verification", hi: "प्रमाण पत्र सत्यापन", sat: "ᱥᱟᱨᱴᱤᱯᱷᱤᱠᱮᱴ ᱡᱟᱸᱪ" },
  verified: { en: "VERIFIED", hi: "सत्यापित", sat: "ᱡᱟᱸᱪ ᱯᱩᱨᱟᱹᱣ" },
  notFound: { en: "Certificate Not Found", hi: "प्रमाण पत्र नहीं मिला", sat: "ᱥᱟᱨᱴᱤᱯᱷᱤᱠᱮᱴ ᱵᱟᱝ ᱧᱟᱢ" },
  enterCertId: { en: "Enter Certificate ID", hi: "प्रमाण पत्र आईडी लिखें", sat: "ᱥᱟᱨᱴᱤᱯᱷᱤᱠᱮᱴ ID ᱚᱞ" },
  verifyNow: { en: "Verify", hi: "सत्यापित करें", sat: "ᱡᱟᱸᱪ" },
  status: { en: "Status", hi: "स्थिति", sat: "ᱚᱵᱚᱥᱛᱷᱟ" },
  worker: { en: "Worker", hi: "कर्मचारी", sat: "ᱠᱟᱹᱢᱤᱭᱟᱹ" },

  // Disclaimer
  disclaimer: {
    en: "This simulator is an educational training tool. In real emergencies and industrial environments, always follow site-specific SOPs, emergency procedures, trained supervision, and applicable safety regulations.",
    hi: "यह सिमुलेटर एक शैक्षिक प्रशिक्षण उपकरण है। वास्तविक आपात स्थिति में हमेशा साइट के SOP, आपातकालीन प्रक्रियाओं और प्रशिक्षित पर्यवेक्षण का पालन करें।",
    sat: "ᱱᱚᱶᱟ ᱮᱠᱲᱟᱣ ᱛᱟᱞᱤᱢ ᱞᱟᱹᱜᱤᱫ ᱠᱷᱟᱱ। ᱥᱟᱹᱴ ᱛᱮ ᱥᱚᱦᱚᱛ ᱥᱚᱦᱚᱛ SOP ᱢᱟᱱ।",
  },
  ppeNote: { en: "Real industrial work must follow workplace SOPs and trained supervision.", hi: "वास्तविक कार्य में कार्यस्थल SOP और प्रशिक्षित पर्यवेक्षण का पालन करें।", sat: "ᱠᱟᱹᱢᱤ ᱛᱮ SOP ᱢᱟᱱ" },

  // Role selection & admin login
  chooseRole: { en: "Who are you?", hi: "आप कौन हैं?", sat: "ᱟᱢ ᱠᱚᱱ?" },
  roleSubtitle: { en: "Select your role to continue", hi: "जारी रखने के लिए अपनी भूमिका चुनें", sat: "ᱟᱭᱩᱨ ᱞᱟᱹᱜᱤᱫ ᱵᱟᱪᱷᱟᱣ" },
  workerRole: { en: "Worker", hi: "कर्मचारी", sat: "ᱠᱟᱹᱢᱤᱭᱟᱹ" },
  workerRoleDesc: { en: "Start safety training & certificates", hi: "सुरक्षा प्रशिक्षण और प्रमाण पत्र शुरू करें", sat: "ᱛᱟᱞᱤᱢ ᱮᱦᱚᱵ" },
  adminRole: { en: "Admin", hi: "एडमिन", sat: "ᱮᱰᱢᱤᱱ" },
  adminRoleDesc: { en: "Coordinator dashboard & compliance", hi: "कोऑर्डिनेटर डैशबोर्ड और अनुपालन", sat: "ᱰᱮᱥᱵᱚᱰ" },
  adminLogin: { en: "Admin Login", hi: "एडमिन लॉगिन", sat: "ᱮᱰᱢᱤᱱ ᱞᱚᱜᱤᱱ" },
  adminLoginSub: { en: "Coordinators & training admins only", hi: "केवल कोऑर्डिनेटर और प्रशिक्षण एडमिन", sat: "ᱠᱚᱱᱴᱨᱚᱞ ᱞᱟᱹᱜᱤᱫ" },
  adminId: { en: "Admin ID", hi: "एडमिन आईडी", sat: "ᱮᱰᱢᱤᱱ ID" },
  password: { en: "Password", hi: "पासवर्ड", sat: "ᱯᱟᱥᱣᱟᱨᱰ" },
  signIn: { en: "Sign In", hi: "साइन इन करें", sat: "ᱚᱛᱟᱭ" },
  signOut: { en: "Sign Out", hi: "साइन आउट", sat: "ᱵᱟᱦᱨᱮ" },
  invalidCreds: { en: "Invalid ID or password", hi: "गलत आईडी या पासवर्ड", sat: "ᱵᱷᱩᱞ ID ᱥᱮ ᱯᱟᱥᱣᱟᱨᱰ" },
  enterIdPass: { en: "Enter admin ID and password", hi: "एडमिन आईडी और पासवर्ड डालें", sat: "ID ᱟᱨ ᱯᱟᱥᱣᱟᱨᱰ ᱚᱞ" },
};

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof S) => string;
  ready: boolean;
};

const LangContext = createContext<Ctx | null>(null);
const LANG_KEY = "suraksha.lang";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await storage.getItem<Lang>(LANG_KEY, "en");
      if (stored) setLangState(stored);
      setReady(true);
    })();
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    storage.setItem(LANG_KEY, l);
  }, []);

  const t = useCallback(
    (key: keyof typeof S) => {
      const entry = S[key];
      if (!entry) return String(key);
      return entry[lang] || entry.en;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t, ready }), [lang, setLang, t, ready]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useI18n must be used within LanguageProvider");
  return ctx;
}

// Resolve content localized text objects { en, hi, sat? }
export type LocalizedText = { en: string; hi?: string; sat?: string };
export function tr(obj: LocalizedText | undefined, lang: Lang): string {
  if (!obj) return "";
  return obj[lang] || obj.en;
}
