import type { LocalizedText } from "@/src/i18n";

export type MarkerKind =
  | "fire" | "warning" | "extinguisher" | "exit" | "arrow" | "assembly"
  | "gas" | "zone-safe" | "zone-caution" | "zone-hazard" | "ppe" | "worker";

export type ARMarker = {
  id: string;
  kind: MarkerKind;
  icon: string; // MaterialCommunityIcons name
  color: string; // fill color literal (semantic hazard colors, identical in both themes)
  label: LocalizedText;
  x: number; // 0..1 horizontal position
  y: number; // 0..1 vertical position
  size?: number;
};

export type Task =
  | {
      type: "tap";
      prompt: LocalizedText;
      markerIds: string[]; // subset of scene markers active this task
      correctId: string;
      correctFb: LocalizedText;
      wrongFb: LocalizedText;
    }
  | {
      type: "choice";
      prompt: LocalizedText;
      options: LocalizedText[];
      correctIndex: number;
      explanation: LocalizedText;
    }
  | {
      type: "order";
      prompt: LocalizedText;
      items: LocalizedText[]; // in CORRECT order
    };

export type Question = {
  q: LocalizedText;
  options: LocalizedText[];
  correctIndex: number;
};

export type Module = {
  id: string;
  icon: string;
  color: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  description: LocalizedText;
  scenario: LocalizedText;
  lessons: number;
  minutes: number;
  status: "available" | "coming-soon";
  markers: ARMarker[];
  tasks: Task[];
  questions: Question[];
};

// ---- Hazard color literals (must be identical light/dark) ----
const RED = "#DC2626";
const ORANGE = "#F97316";
const GREEN = "#16A34A";
const YELLOW = "#F59E0B";
const BLUE = "#2563EB";
const SLATE = "#475569";

export const FIRE_MODULE: Module = {
  id: "fire",
  icon: "fire",
  color: ORANGE,
  title: { en: "Fire & Explosion Response", hi: "आग और विस्फोट प्रतिक्रिया", sat: "ᱥᱮᱸᱜᱮᱞ ᱟᱨ ᱵᱤᱥᱯᱷᱚᱴ" },
  subtitle: { en: "Identify hazards and evacuate safely", hi: "खतरे पहचानें और सुरक्षित निकलें", sat: "ᱡᱚᱠᱷᱚᱢ ᱪᱤᱱᱦᱟᱹᱣ" },
  description: {
    en: "Learn to detect fire hazards, choose the right extinguisher, follow the evacuation sequence and reach the assembly point.",
    hi: "आग के खतरे पहचानना, सही अग्निशामक चुनना, निकासी क्रम और असेंबली पॉइंट तक पहुँचना सीखें।",
  },
  scenario: {
    en: "Emergency! A fire has been detected. Identify the hazard and reach the safest exit.",
    hi: "आपातकाल! आग का पता चला है। खतरे को पहचानें और सुरक्षित निकास तक पहुँचें।",
    sat: "ᱡᱚᱠᱷᱚᱢ! ᱥᱮᱸᱜᱮᱞ ᱧᱟᱢ ᱮᱱᱟ।",
  },
  lessons: 10,
  minutes: 45,
  status: "available",
  markers: [
    { id: "fire1", kind: "fire", icon: "fire", color: RED, label: { en: "Fire Hazard", hi: "आग का खतरा" }, x: 0.5, y: 0.28, size: 72 },
    { id: "warn1", kind: "warning", icon: "alert", color: YELLOW, label: { en: "Warning", hi: "चेतावनी" }, x: 0.5, y: 0.46 },
    { id: "ext-correct", kind: "extinguisher", icon: "fire-extinguisher", color: RED, label: { en: "ABC Extinguisher", hi: "ABC अग्निशामक" }, x: 0.18, y: 0.62 },
    { id: "ext-water", kind: "extinguisher", icon: "fire-extinguisher", color: BLUE, label: { en: "Water Type", hi: "पानी वाला" }, x: 0.5, y: 0.68 },
    { id: "ext-damaged", kind: "extinguisher", icon: "fire-extinguisher", color: SLATE, label: { en: "Damaged", hi: "क्षतिग्रस्त" }, x: 0.82, y: 0.62 },
    { id: "exit-correct", kind: "exit", icon: "exit-run", color: GREEN, label: { en: "Exit", hi: "निकास" }, x: 0.85, y: 0.35 },
    { id: "exit-blocked", kind: "exit", icon: "door-closed", color: RED, label: { en: "Blocked Exit", hi: "बंद निकास" }, x: 0.15, y: 0.35 },
    { id: "arrow1", kind: "arrow", icon: "arrow-right-bold", color: GREEN, label: { en: "Safe Route", hi: "सुरक्षित रास्ता" }, x: 0.68, y: 0.5 },
    { id: "assembly1", kind: "assembly", icon: "map-marker-radius", color: GREEN, label: { en: "Assembly Point", hi: "असेंबली पॉइंट" }, x: 0.75, y: 0.78 },
    { id: "assembly-wrong", kind: "assembly", icon: "map-marker", color: SLATE, label: { en: "Parking", hi: "पार्किंग" }, x: 0.3, y: 0.8 },
  ],
  tasks: [
    {
      type: "tap",
      prompt: { en: "Identify the nearest safe exit.", hi: "निकटतम सुरक्षित निकास पहचानें।", sat: "ᱥᱩᱨᱠᱷᱮᱚ ᱫᱩᱣᱟᱨ ᱪᱤᱱᱦᱟᱹᱣ।" },
      markerIds: ["exit-correct", "exit-blocked", "fire1"],
      correctId: "exit-correct",
      correctFb: { en: "Safe exit identified.", hi: "सुरक्षित निकास पहचाना गया।", sat: "ᱥᱩᱨᱠᱷᱮᱚ ᱫᱩᱣᱟᱨ ᱧᱟᱢ।" },
      wrongFb: { en: "This route contains a hazard. Try again.", hi: "इस रास्ते में खतरा है। फिर से करें।", sat: "ᱱᱚᱶᱟ ᱨᱟᱦᱟ ᱡᱚᱠᱷᱚᱢ।" },
    },
    {
      type: "tap",
      prompt: { en: "Select the appropriate extinguisher for this fire.", hi: "इस आग के लिए उपयुक्त अग्निशामक चुनें।", sat: "ᱴᱷᱤᱠ ᱟᱜᱱᱤᱥᱟᱢᱚᱠ ᱵᱟᱪᱷᱟᱣ।" },
      markerIds: ["ext-correct", "ext-water", "ext-damaged"],
      correctId: "ext-correct",
      correctFb: { en: "Correct — an ABC extinguisher is safe for most fires.", hi: "सही — ABC अग्निशामक अधिकांश आग के लिए सुरक्षित है।" },
      wrongFb: { en: "Not suitable for this fire. Try again.", hi: "इस आग के लिए उपयुक्त नहीं। फिर से करें।" },
    },
    {
      type: "order",
      prompt: { en: "Arrange the correct evacuation sequence.", hi: "सही निकासी क्रम बनाएं।", sat: "ᱴᱷᱤᱠ ᱛᱚᱨᱮᱛᱮ ᱥᱟᱡᱟᱣ।" },
      items: [
        { en: "Recognize emergency", hi: "आपातकाल पहचानें" },
        { en: "Raise the alarm", hi: "अलार्म बजाएं" },
        { en: "Alert others", hi: "दूसरों को सचेत करें" },
        { en: "Identify safe exit", hi: "सुरक्षित निकास पहचानें" },
        { en: "Evacuate", hi: "बाहर निकलें" },
        { en: "Reach assembly point", hi: "असेंबली पॉइंट पहुँचें" },
      ],
    },
    {
      type: "tap",
      prompt: { en: "After evacuation, identify the designated assembly point.", hi: "निकासी के बाद निर्धारित असेंबली पॉइंट पहचानें।", sat: "ᱟᱥᱮᱢᱵᱞᱤ ᱡᱟᱭᱜᱟ ᱪᱤᱱᱦᱟᱹᱣ।" },
      markerIds: ["assembly1", "assembly-wrong"],
      correctId: "assembly1",
      correctFb: { en: "Correct assembly point reached.", hi: "सही असेंबली पॉइंट पहुँचा।" },
      wrongFb: { en: "That is not the assembly point. Try again.", hi: "यह असेंबली पॉइंट नहीं है। फिर से करें।" },
    },
  ],
  questions: [
    {
      q: { en: "What should you do FIRST when you discover a fire?", hi: "आग दिखने पर सबसे पहले क्या करें?", sat: "ᱥᱮᱸᱜᱮᱞ ᱧᱟᱢ ᱠᱷᱟᱱ ᱯᱩᱭᱞᱩ ᱪᱮᱫ?" },
      options: [
        { en: "Ignore it and keep working", hi: "अनदेखा करें और काम करते रहें" },
        { en: "Raise the alarm and follow emergency procedure", hi: "अलार्म बजाएं और आपात प्रक्रिया अपनाएं" },
        { en: "Enter the hazardous area", hi: "खतरनाक क्षेत्र में जाएं" },
        { en: "Collect your belongings first", hi: "पहले अपना सामान इकट्ठा करें" },
      ],
      correctIndex: 1,
    },
    {
      q: { en: "Which extinguisher works on most common fires?", hi: "अधिकांश सामान्य आग पर कौन सा अग्निशामक काम करता है?" },
      options: [
        { en: "Damaged extinguisher", hi: "क्षतिग्रस्त अग्निशामक" },
        { en: "Water on an electrical fire", hi: "बिजली की आग पर पानी" },
        { en: "ABC dry powder extinguisher", hi: "ABC ड्राई पाउडर अग्निशामक" },
        { en: "None — just run", hi: "कोई नहीं — बस भागें" },
      ],
      correctIndex: 2,
    },
    {
      q: { en: "During evacuation you should use:", hi: "निकासी के दौरान आपको उपयोग करना चाहिए:" },
      options: [
        { en: "The lift/elevator", hi: "लिफ्ट" },
        { en: "The marked safe exit route", hi: "चिह्नित सुरक्षित निकास मार्ग" },
        { en: "The blocked exit", hi: "बंद निकास" },
        { en: "Any window", hi: "कोई भी खिड़की" },
      ],
      correctIndex: 1,
    },
    {
      q: { en: "After evacuating a building you must:", hi: "इमारत से निकलने के बाद आपको:" },
      options: [
        { en: "Go home immediately", hi: "तुरंत घर जाएं" },
        { en: "Re-enter to help", hi: "मदद के लिए वापस जाएं" },
        { en: "Go to the assembly point for headcount", hi: "गिनती हेतु असेंबली पॉइंट जाएं" },
        { en: "Stand near the fire", hi: "आग के पास खड़े रहें" },
      ],
      correctIndex: 2,
    },
    {
      q: { en: "Smoke is filling a corridor. You should:", hi: "गलियारे में धुआं भर रहा है। आपको:" },
      options: [
        { en: "Run upright quickly", hi: "सीधे तेज़ी से भागें" },
        { en: "Stay low and move to the exit", hi: "नीचे झुककर निकास की ओर बढ़ें" },
        { en: "Open all windows", hi: "सभी खिड़कियाँ खोलें" },
        { en: "Wait for the smoke to clear", hi: "धुआं साफ होने का इंतज़ार करें" },
      ],
      correctIndex: 1,
    },
    {
      q: { en: "The fire alarm sounds. The correct action is:", hi: "फायर अलार्म बजता है। सही कार्य है:" },
      options: [
        { en: "Assume it is a false alarm", hi: "इसे झूठा अलार्म मानें" },
        { en: "Finish your task first", hi: "पहले अपना काम पूरा करें" },
        { en: "Evacuate calmly using safe routes", hi: "सुरक्षित मार्ग से शांति से निकलें" },
        { en: "Hide under a desk", hi: "मेज़ के नीचे छिपें" },
      ],
      correctIndex: 2,
    },
    {
      q: { en: "Who should attempt to fight a large, spreading fire?", hi: "बड़ी, फैलती आग से किसे लड़ना चाहिए?" },
      options: [
        { en: "Any worker nearby", hi: "पास का कोई भी कर्मचारी" },
        { en: "Only trained fire teams / emergency services", hi: "केवल प्रशिक्षित दमकल दल / आपात सेवा" },
        { en: "The newest employee", hi: "सबसे नया कर्मचारी" },
        { en: "Nobody, ever", hi: "कभी कोई नहीं" },
      ],
      correctIndex: 1,
    },
  ],
};

export const GAS_MODULE: Module = {
  id: "gas",
  icon: "skull-crossbones",
  color: RED,
  title: { en: "Gas Leak & Confined Space", hi: "गैस रिसाव और संकुचित स्थान", sat: "ᱜᱮᱥ ᱟᱨ ᱵᱚᱸᱫᱚ ᱡᱟᱭᱜᱟ" },
  subtitle: { en: "Recognize hazard zones and stay safe", hi: "खतरे वाले क्षेत्र पहचानें और सुरक्षित रहें", sat: "ᱡᱚᱠᱷᱚᱢ ᱮᱞᱟᱠᱟ ᱪᱤᱱᱦᱟᱹᱣ" },
  description: {
    en: "Identify hazardous gas zones, select the right PPE, follow the buddy/permit system and spot unsafe actions.",
    hi: "खतरनाक गैस क्षेत्र पहचानें, सही PPE चुनें, बडी/परमिट प्रणाली अपनाएं और असुरक्षित कार्य पहचानें।",
  },
  scenario: {
    en: "Gas leak suspected. Identify the hazardous zone and select the correct safety response.",
    hi: "गैस रिसाव का संदेह। खतरनाक क्षेत्र पहचानें और सही सुरक्षा प्रतिक्रिया चुनें।",
    sat: "ᱜᱮᱥ ᱞᱤᱠ। ᱡᱚᱠᱷᱚᱢ ᱮᱞᱟᱠᱟ ᱪᱤᱱᱦᱟᱹᱣ।",
  },
  lessons: 8,
  minutes: 35,
  status: "available",
  markers: [
    { id: "zone-safe", kind: "zone-safe", icon: "check-circle", color: GREEN, label: { en: "Safe Area", hi: "सुरक्षित क्षेत्र" }, x: 0.2, y: 0.35, size: 64 },
    { id: "zone-caution", kind: "zone-caution", icon: "alert-circle", color: YELLOW, label: { en: "Caution Zone", hi: "सावधानी क्षेत्र" }, x: 0.5, y: 0.35, size: 64 },
    { id: "zone-hazard", kind: "zone-hazard", icon: "biohazard", color: RED, label: { en: "Gas Hazard", hi: "गैस खतरा" }, x: 0.8, y: 0.35, size: 64 },
    { id: "worker1", kind: "worker", icon: "account-hard-hat", color: BLUE, label: { en: "Worker", hi: "कर्मचारी" }, x: 0.5, y: 0.7 },
    // PPE options for task 2
    { id: "ppe-respirator", kind: "ppe", icon: "gas-mask", color: GREEN, label: { en: "Respirator", hi: "श्वास सुरक्षा" }, x: 0.25, y: 0.55 },
    { id: "ppe-helmet", kind: "ppe", icon: "hard-hat", color: BLUE, label: { en: "Helmet", hi: "हेलमेट" }, x: 0.5, y: 0.55 },
    { id: "ppe-cap", kind: "ppe", icon: "hat-fedora", color: SLATE, label: { en: "Cloth Cap", hi: "कपड़े की टोपी" }, x: 0.75, y: 0.55 },
  ],
  tasks: [
    {
      type: "tap",
      prompt: { en: "Identify the hazardous area.", hi: "खतरनाक क्षेत्र पहचानें।", sat: "ᱡᱚᱠᱷᱚᱢ ᱮᱞᱟᱠᱟ ᱪᱤᱱᱦᱟᱹᱣ।" },
      markerIds: ["zone-safe", "zone-caution", "zone-hazard"],
      correctId: "zone-hazard",
      correctFb: { en: "Correct — the red zone is the gas hazard. Stay away.", hi: "सही — लाल क्षेत्र गैस खतरा है। दूर रहें।" },
      wrongFb: { en: "That zone is not the main hazard. Try again.", hi: "यह मुख्य खतरा नहीं है। फिर से करें।" },
    },
    {
      type: "tap",
      prompt: { en: "Select the required PPE before proceeding.", hi: "आगे बढ़ने से पहले आवश्यक PPE चुनें।", sat: "ᱟᱭᱩᱨ ᱞᱟᱦᱟ PPE ᱵᱟᱪᱷᱟᱣ।" },
      markerIds: ["ppe-respirator", "ppe-helmet", "ppe-cap"],
      correctId: "ppe-respirator",
      correctFb: { en: "Correct — respiratory protection is required for gas hazards.", hi: "सही — गैस खतरे में श्वास सुरक्षा आवश्यक है।" },
      wrongFb: { en: "This alone won't protect against gas. Try again.", hi: "यह अकेले गैस से नहीं बचाएगा। फिर से करें।" },
    },
    {
      type: "choice",
      prompt: { en: "A confined-space entry is required. What should the worker do?", hi: "संकुचित स्थान में प्रवेश आवश्यक है। कर्मचारी को क्या करना चाहिए?", sat: "ᱵᱚᱸᱫᱚ ᱡᱟᱭᱜᱟ ᱚᱛᱟᱭ। ᱪᱮᱫ ᱠᱟᱹᱢᱤ?" },
      options: [
        { en: "Enter alone quickly", hi: "अकेले जल्दी प्रवेश करें" },
        { en: "Follow the permit + buddy/attendant system", hi: "परमिट + बडी/अटेंडेंट प्रणाली अपनाएं" },
        { en: "Enter without checking hazards", hi: "खतरे जाँचे बिना प्रवेश करें" },
        { en: "Ignore the alarm", hi: "अलार्म को अनदेखा करें" },
      ],
      correctIndex: 1,
      explanation: {
        en: "A permit and a buddy/attendant ensure someone monitors the atmosphere and can rescue you — never enter a confined space alone.",
        hi: "परमिट और बडी/अटेंडेंट सुनिश्चित करते हैं कि कोई वातावरण की निगरानी करे और बचा सके — कभी अकेले प्रवेश न करें।",
      },
    },
    {
      type: "choice",
      prompt: { en: "Which is the UNSAFE action?", hi: "कौन सा असुरक्षित कार्य है?", sat: "ᱚᱠᱟ ᱠᱟᱹᱢᱤ ᱡᱚᱠᱷᱚᱢ?" },
      options: [
        { en: "Testing the air before entry", hi: "प्रवेश से पहले हवा जाँचना" },
        { en: "Wearing a respirator", hi: "श्वास सुरक्षा पहनना" },
        { en: "Entering the confined space alone", hi: "अकेले संकुचित स्थान में प्रवेश करना" },
        { en: "Informing the attendant", hi: "अटेंडेंट को सूचित करना" },
      ],
      correctIndex: 2,
      explanation: {
        en: "Entering a confined space alone is unsafe — always work with an attendant and a valid permit.",
        hi: "अकेले संकुचित स्थान में प्रवेश असुरक्षित है — हमेशा अटेंडेंट और वैध परमिट के साथ काम करें।",
      },
    },
  ],
  questions: [
    {
      q: { en: "What is the MOST important action before entering a confined space?", hi: "संकुचित स्थान में प्रवेश से पहले सबसे महत्वपूर्ण कदम क्या है?", sat: "ᱵᱚᱸᱫᱚ ᱡᱟᱭᱜᱟ ᱚᱛᱟᱭ ᱞᱟᱦᱟ ᱪᱮᱫ?" },
      options: [
        { en: "Check if the area looks safe visually", hi: "देखकर सुरक्षित लगता है जाँचें" },
        { en: "Test the atmosphere for oxygen and toxic gases", hi: "ऑक्सीजन और विषैली गैसों के लिए वातावरण जाँचें" },
        { en: "Inform your family before entering", hi: "प्रवेश से पहले परिवार को सूचित करें" },
        { en: "Carry extra food and water", hi: "अतिरिक्त भोजन और पानी लें" },
      ],
      correctIndex: 1,
    },
    {
      q: { en: "You smell gas at your workstation. First you should:", hi: "आपके कार्यस्थल पर गैस की गंध आती है। पहले आपको:" },
      options: [
        { en: "Light a match to check", hi: "जाँचने हेतु माचिस जलाएं" },
        { en: "Switch on the fan", hi: "पंखा चालू करें" },
        { en: "Alert others, avoid sparks and move to fresh air", hi: "दूसरों को सचेत करें, चिंगारी से बचें, ताज़ी हवा में जाएं" },
        { en: "Keep working normally", hi: "सामान्य रूप से काम करते रहें" },
      ],
      correctIndex: 2,
    },
    {
      q: { en: "The buddy/attendant system means:", hi: "बडी/अटेंडेंट प्रणाली का अर्थ है:" },
      options: [
        { en: "Two workers enter together with no one outside", hi: "दो कर्मचारी साथ जाएं, बाहर कोई नहीं" },
        { en: "A trained person stays outside to monitor and help", hi: "एक प्रशिक्षित व्यक्ति बाहर निगरानी और मदद हेतु रहे" },
        { en: "Working faster to finish early", hi: "जल्दी खत्म करने हेतु तेज़ काम" },
        { en: "Skipping the permit", hi: "परमिट छोड़ना" },
      ],
      correctIndex: 1,
    },
    {
      q: { en: "For a suspected gas hazard, the correct PPE includes:", hi: "संभावित गैस खतरे हेतु सही PPE में शामिल है:" },
      options: [
        { en: "A cloth cap", hi: "कपड़े की टोपी" },
        { en: "Sunglasses only", hi: "केवल धूप का चश्मा" },
        { en: "Appropriate respiratory protection", hi: "उपयुक्त श्वास सुरक्षा" },
        { en: "No PPE needed", hi: "कोई PPE नहीं चाहिए" },
      ],
      correctIndex: 2,
    },
    {
      q: { en: "A colleague collapses inside a confined space. You should:", hi: "एक साथी संकुचित स्थान में गिर जाता है। आपको:" },
      options: [
        { en: "Rush in immediately to pull them out", hi: "तुरंत अंदर जाकर बाहर खींचें" },
        { en: "Raise the alarm and call trained rescuers", hi: "अलार्म बजाएं और प्रशिक्षित बचावकर्मी बुलाएं" },
        { en: "Wait and watch", hi: "इंतज़ार करें और देखें" },
        { en: "Enter without a respirator", hi: "बिना श्वास सुरक्षा प्रवेश करें" },
      ],
      correctIndex: 1,
    },
    {
      q: { en: "A valid entry permit is:", hi: "वैध प्रवेश परमिट है:" },
      options: [
        { en: "Optional if you are experienced", hi: "अनुभवी हों तो वैकल्पिक" },
        { en: "Mandatory before confined-space entry", hi: "संकुचित स्थान प्रवेश से पहले अनिवार्य" },
        { en: "Only for supervisors", hi: "केवल पर्यवेक्षकों हेतु" },
        { en: "Needed after entry", hi: "प्रवेश के बाद आवश्यक" },
      ],
      correctIndex: 1,
    },
    {
      q: { en: "The green zone in the scenario represents:", hi: "दृश्य में हरा क्षेत्र दर्शाता है:" },
      options: [
        { en: "The gas hazard", hi: "गैस खतरा" },
        { en: "The caution zone", hi: "सावधानी क्षेत्र" },
        { en: "The safe area", hi: "सुरक्षित क्षेत्र" },
        { en: "The exit", hi: "निकास" },
      ],
      correctIndex: 2,
    },
  ],
};

export const COMING_SOON: Module[] = [
  {
    id: "machinery", icon: "cog", color: "#475569",
    title: { en: "Machinery Safety", hi: "मशीनरी सुरक्षा" }, subtitle: { en: "Lockout / tagout basics", hi: "लॉकआउट/टैगआउट मूल बातें" },
    description: { en: "", hi: "" }, scenario: { en: "", hi: "" }, lessons: 12, minutes: 50, status: "coming-soon",
    markers: [], tasks: [], questions: [],
  },
  {
    id: "ppe", icon: "safety-goggles", color: "#F59E0B",
    title: { en: "PPE & Workplace Safety", hi: "PPE और कार्यस्थल सुरक्षा" }, subtitle: { en: "Personal protective equipment", hi: "व्यक्तिगत सुरक्षा उपकरण" },
    description: { en: "", hi: "" }, scenario: { en: "", hi: "" }, lessons: 9, minutes: 40, status: "coming-soon",
    markers: [], tasks: [], questions: [],
  },
];

export const MODULES: Module[] = [FIRE_MODULE, GAS_MODULE, ...COMING_SOON];

export function getModule(id: string): Module | undefined {
  return MODULES.find((m) => m.id === id);
}
