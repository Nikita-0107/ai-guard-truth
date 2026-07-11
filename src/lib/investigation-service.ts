/**
 * Sentinel AI — Rule-Based Investigation Engine
 *
 * Fully offline. No external AI API. Deterministic: identical input always
 * produces an identical report. Modular: the exported analyze* functions are
 * the swap points for a future real AI model — the UI never changes.
 */

export type InvestigationType =
  | "sms"
  | "whatsapp"
  | "email"
  | "url"
  | "transcript"
  | "image";

export type RiskLevel = "safe" | "low" | "medium" | "high" | "critical";

export interface EvidenceItem {
  phrase: string;
  reason: string;
  severity: "low" | "medium" | "high";
}

export interface ScamDNATrait {
  trait: string;
  score: number; // 0-100
  description: string;
}

export interface Recommendation {
  title: string;
  description: string;
  urgency: "info" | "warn" | "critical";
}

export type ScamCategoryId =
  | "digital_arrest"
  | "banking_kyc"
  | "otp"
  | "courier"
  | "investment"
  | "lottery"
  | "upi"
  | "job"
  | "phishing"
  | "safe";

export interface InvestigationReport {
  riskScore: number;
  riskLevel: RiskLevel;
  scamCategory: string;
  categoryId: ScamCategoryId;
  summary: string;
  evidence: EvidenceItem[];
  scamDNA: ScamDNATrait[];
  recommendations: Recommendation[];
}

/* ---------- Rule definitions ---------- */

interface KeywordRule {
  phrase: string;
  reason: string;
  severity: EvidenceItem["severity"];
}

interface CategoryRule {
  id: ScamCategoryId;
  label: string;
  weight: number; // used to prioritize when multiple categories match
  minScore: number;
  maxScore: number;
  keywords: KeywordRule[];
  dna: ScamDNATrait[];
  summary: string;
  recommendations: Recommendation[];
  followUps: string[];
}

const CATEGORIES: CategoryRule[] = [
  {
    id: "digital_arrest",
    label: "Digital Arrest Scam",
    weight: 10,
    minScore: 90,
    maxScore: 100,
    keywords: [
      { phrase: "CBI", reason: "Impersonates Central Bureau of Investigation to establish false authority.", severity: "high" },
      { phrase: "ED", reason: "Impersonates Enforcement Directorate to intimidate the target.", severity: "high" },
      { phrase: "Police", reason: "Impersonates law enforcement to force compliance.", severity: "high" },
      { phrase: "Crime Branch", reason: "Fake law-enforcement branch used to intimidate.", severity: "high" },
      { phrase: "Customs", reason: "Fake customs authority to justify a bogus penalty.", severity: "medium" },
      { phrase: "Aadhaar", reason: "Government identity referenced to establish false authority.", severity: "high" },
      { phrase: "PAN", reason: "Government ID misuse to sound official.", severity: "medium" },
      { phrase: "Money Laundering", reason: "Serious criminal accusation used to induce panic.", severity: "high" },
      { phrase: "Arrest", reason: "Threat of arrest used as fear tactic.", severity: "high" },
      { phrase: "Legal Action", reason: "Fear-based manipulation to force compliance.", severity: "high" },
      { phrase: "Investigation", reason: "Fake official investigation to justify urgency.", severity: "medium" },
      { phrase: "National Security", reason: "Weaponised national-security framing to intimidate.", severity: "high" },
      { phrase: "Do not tell anyone", reason: "Isolation tactic to prevent the target from seeking help.", severity: "high" },
      { phrase: "Stay on the call", reason: "Isolation tactic to prevent consulting family or authorities.", severity: "high" },
      { phrase: "Transfer money", reason: "Financial demand — the goal of the scam.", severity: "high" },
      { phrase: "Security Deposit", reason: "Fake refundable deposit — a classic extortion pretext.", severity: "high" },
    ],
    dna: [
      { trait: "Authority Impersonation", score: 100, description: "Impersonates law enforcement or government agencies." },
      { trait: "Fear Tactics", score: 95, description: "Threats of arrest, penalties or reputational damage." },
      { trait: "Urgency", score: 90, description: "Demands action within minutes to prevent reflection." },
      { trait: "Financial Demand", score: 90, description: "Requests transfers, deposits or account credentials." },
      { trait: "Isolation", score: 100, description: "Instructs the target to stay on the call and not consult anyone." },
      { trait: "Psychological Manipulation", score: 95, description: "Combines shame, fear and authority to override caution." },
    ],
    summary:
      "This message impersonates Indian government or law-enforcement agencies (CBI/ED/Police/Customs) and combines fabricated legal threats with instructions that isolate the target and demand a money transfer. It is a textbook 'Digital Arrest' operation designed to panic victims into paying before they can verify anything.",
    recommendations: [
      { title: "Disconnect immediately", description: "Real agencies never conduct investigations over WhatsApp or continuous calls. Hang up and walk away.", urgency: "critical" },
      { title: "Never transfer money", description: "No legitimate authority demands 'security deposits' or instant transfers to clear your name.", urgency: "critical" },
      { title: "Report to cybercrime.gov.in", description: "File a complaint at cybercrime.gov.in or call 1930 (India cybercrime helpline).", urgency: "warn" },
      { title: "Call your bank", description: "If you already transferred money, request a fraud freeze within 24 hours.", urgency: "warn" },
    ],
    followUps: [
      "Did they ask you to stay on the call and not talk to anyone?",
      "Did they show you a fake ID card or arrest warrant on video?",
      "Did they mention a specific amount as a 'security deposit' or 'refundable fee'?",
    ],
  },
  {
    id: "banking_kyc",
    label: "Banking / KYC Scam",
    weight: 8,
    minScore: 75,
    maxScore: 95,
    keywords: [
      { phrase: "KYC", reason: "Fake KYC update — a classic banking-scam hook.", severity: "high" },
      { phrase: "Account Blocked", reason: "Fear-based tactic to force immediate action.", severity: "high" },
      { phrase: "Account Frozen", reason: "Fake urgency to bypass rational verification.", severity: "high" },
      { phrase: "Verify Account", reason: "Attempt to harvest banking credentials.", severity: "high" },
      { phrase: "Update PAN", reason: "Fake ID-update request used to phish personal data.", severity: "medium" },
      { phrase: "Update Aadhaar", reason: "Fake ID-update request used to phish personal data.", severity: "medium" },
      { phrase: "RBI", reason: "Impersonates the Reserve Bank of India to appear official.", severity: "high" },
      { phrase: "Debit Card", reason: "Targets card credentials for takeover.", severity: "medium" },
      { phrase: "Credit Card", reason: "Targets card credentials for takeover.", severity: "medium" },
      { phrase: "Bank", reason: "Generic bank reference used to feign legitimacy.", severity: "low" },
    ],
    dna: [
      { trait: "Authority Impersonation", score: 85, description: "Impersonates a bank or the RBI." },
      { trait: "Fear Tactics", score: 80, description: "Threatens account suspension or loss of access." },
      { trait: "Urgency", score: 85, description: "Demands action within hours." },
      { trait: "Financial Demand", score: 80, description: "Aims to harvest banking credentials." },
      { trait: "Isolation", score: 40, description: "Discourages contacting the bank directly." },
      { trait: "Psychological Manipulation", score: 75, description: "Uses trust in banks to bypass scrutiny." },
    ],
    summary:
      "This message impersonates a bank or the RBI and pressures the target into 'updating KYC', 'verifying' or 'unblocking' their account. Legitimate banks never request credentials, PAN/Aadhaar updates or card details over SMS, WhatsApp or unsolicited links.",
    recommendations: [
      { title: "Never share card, CVV or PIN", description: "No bank will ever ask for these over a call or message.", urgency: "critical" },
      { title: "Do not click links", description: "Open your bank's official app or website by typing the address yourself.", urgency: "critical" },
      { title: "Call your bank directly", description: "Use the number printed on your debit card, not any number from the message.", urgency: "warn" },
      { title: "Report the message", description: "Forward to your bank's fraud line and report to cybercrime.gov.in.", urgency: "info" },
    ],
    followUps: [
      "Did they ask you to click a link to 'update KYC'?",
      "Did they ask for your debit card number or CVV?",
      "Did they claim your account will be blocked within 24 hours?",
    ],
  },
  {
    id: "otp",
    label: "OTP Scam",
    weight: 9,
    minScore: 80,
    maxScore: 95,
    keywords: [
      { phrase: "OTP", reason: "Attempts to harvest a one-time password — full account takeover risk.", severity: "high" },
      { phrase: "Verification Code", reason: "OTP-harvesting pretext.", severity: "high" },
      { phrase: "PIN", reason: "Requests banking PIN — never share.", severity: "high" },
      { phrase: "Password", reason: "Requests account password — credential theft.", severity: "high" },
      { phrase: "Net Banking", reason: "Targets net-banking access.", severity: "high" },
    ],
    dna: [
      { trait: "Authority Impersonation", score: 60, description: "May impersonate bank, delivery or support staff." },
      { trait: "Fear Tactics", score: 65, description: "Threats of losing access if the OTP isn't shared." },
      { trait: "Urgency", score: 90, description: "OTP is time-limited — the scam pushes fast action." },
      { trait: "Financial Demand", score: 95, description: "The OTP unlocks money movement." },
      { trait: "Isolation", score: 40, description: "Discourages verification with anyone else." },
      { trait: "Psychological Manipulation", score: 80, description: "Frames the OTP request as 'just verification'." },
    ],
    summary:
      "The content asks for an OTP, PIN or password. Sharing an OTP hands complete control of your bank or wallet to the attacker. No legitimate business — bank, delivery agent or support desk — ever needs your OTP.",
    recommendations: [
      { title: "Never share an OTP", description: "OTPs authorise transactions. Sharing one is the same as sending the money yourself.", urgency: "critical" },
      { title: "Hang up immediately", description: "If someone is on a call asking for an OTP, end the call now.", urgency: "critical" },
      { title: "Change your password", description: "If you already shared any credentials, reset them from a trusted device.", urgency: "warn" },
      { title: "Report to your bank", description: "Alert your bank's fraud line and freeze transactions if needed.", urgency: "warn" },
    ],
    followUps: [
      "Did they ask you to read out an OTP you received?",
      "Did they claim they'd 'refund' or 'verify' by sending you a code first?",
      "Did they call from a number that looked like your bank?",
    ],
  },
  {
    id: "courier",
    label: "Courier Scam",
    weight: 7,
    minScore: 75,
    maxScore: 95,
    keywords: [
      { phrase: "FedEx", reason: "Impersonates FedEx — a common courier-scam vector.", severity: "high" },
      { phrase: "DHL", reason: "Impersonates DHL to fabricate a held parcel.", severity: "high" },
      { phrase: "Courier", reason: "Fake courier premise to justify fees or ID checks.", severity: "medium" },
      { phrase: "Parcel", reason: "Fabricates a suspicious parcel in the target's name.", severity: "medium" },
      { phrase: "Customs", reason: "Fake customs charge to extract payment.", severity: "high" },
      { phrase: "Package Held", reason: "Fear-based hook to force immediate payment.", severity: "high" },
    ],
    dna: [
      { trait: "Authority Impersonation", score: 80, description: "Impersonates a courier company or customs officer." },
      { trait: "Fear Tactics", score: 80, description: "Threats about seized parcels or legal action." },
      { trait: "Urgency", score: 85, description: "Warns of parcel destruction or legal escalation." },
      { trait: "Financial Demand", score: 80, description: "Demands 'clearance fees' or fines." },
      { trait: "Isolation", score: 60, description: "May transfer the call to a fake 'police officer'." },
      { trait: "Psychological Manipulation", score: 80, description: "Manufactures guilt over illegal contents." },
    ],
    summary:
      "This message claims a courier parcel in your name is being held by customs or contains illegal contents, and demands a fee or personal details to release it. Real couriers never call to collect customs fines or threaten arrest.",
    recommendations: [
      { title: "Ignore the message", description: "You aren't obliged to respond to any courier you didn't book.", urgency: "warn" },
      { title: "Verify on the official app", description: "Track any real parcel only on the courier's official website or app.", urgency: "info" },
      { title: "Never pay 'clearance fees'", description: "Customs charges are collected only at delivery or through official portals.", urgency: "critical" },
      { title: "Block the sender", description: "Block the number and report it to your telecom operator.", urgency: "info" },
    ],
    followUps: [
      "Did the caller transfer you to a 'police officer' or 'CBI officer'?",
      "Did they claim your Aadhaar was found on an illegal package?",
      "Did they ask you to pay a customs fee to release the parcel?",
    ],
  },
  {
    id: "investment",
    label: "Investment Scam",
    weight: 8,
    minScore: 80,
    maxScore: 95,
    keywords: [
      { phrase: "Guaranteed Returns", reason: "No legitimate investment can guarantee returns.", severity: "high" },
      { phrase: "Crypto", reason: "Unregulated crypto pitches are a common investment-scam vector.", severity: "medium" },
      { phrase: "Double Money", reason: "Classic ponzi/pyramid promise.", severity: "high" },
      { phrase: "Investment Group", reason: "Fake private groups used to build false credibility.", severity: "medium" },
      { phrase: "Trading Tips", reason: "Unsolicited tips are typically pump-and-dump setups.", severity: "medium" },
      { phrase: "Stock Tips", reason: "Unregistered advisors — SEBI violation.", severity: "medium" },
      { phrase: "WhatsApp Group", reason: "Recruiting into a paid tipster group is a scam pattern.", severity: "low" },
    ],
    dna: [
      { trait: "Authority Impersonation", score: 70, description: "Fake 'analysts' or 'fund managers'." },
      { trait: "Fear Tactics", score: 40, description: "FOMO framing — 'you'll miss the opportunity'." },
      { trait: "Urgency", score: 85, description: "Limited-slot pitches to force quick decisions." },
      { trait: "Financial Demand", score: 90, description: "Demands deposits into unverified accounts." },
      { trait: "Isolation", score: 55, description: "Private groups reduce outside scrutiny." },
      { trait: "Psychological Manipulation", score: 85, description: "Greed and social proof exploitation." },
    ],
    summary:
      "The content promotes an investment opportunity with unrealistic returns or recruits the target into an unverified trading/crypto group. Legitimate SEBI-registered advisors do not cold-DM strangers, do not guarantee returns and do not take deposits into personal accounts.",
    recommendations: [
      { title: "Never invest under pressure", description: "Any 'act within 24 hours' pitch is a scam. Real markets don't work that way.", urgency: "critical" },
      { title: "Verify SEBI registration", description: "Search the advisor's name on the SEBI website before sending a rupee.", urgency: "warn" },
      { title: "Block the sender", description: "Leave the group, block the contact and report the number.", urgency: "warn" },
      { title: "Report to cybercrime.gov.in", description: "File a complaint if you already transferred money.", urgency: "info" },
    ],
    followUps: [
      "Did they promise guaranteed or fixed returns?",
      "Did they ask you to deposit into a personal account or crypto wallet?",
      "Were you added to a WhatsApp or Telegram group without asking?",
    ],
  },
  {
    id: "lottery",
    label: "Lottery Scam",
    weight: 8,
    minScore: 90,
    maxScore: 100,
    keywords: [
      { phrase: "Lottery", reason: "Unentered lotteries never pay out — pure scam premise.", severity: "high" },
      { phrase: "Winner", reason: "You can't win a contest you never entered.", severity: "high" },
      { phrase: "Prize", reason: "Fabricated prize used to extract 'processing fees'.", severity: "high" },
      { phrase: "Congratulations", reason: "Common lottery-scam opener.", severity: "medium" },
      { phrase: "Lucky Draw", reason: "Fake draws used to justify a payout request.", severity: "high" },
    ],
    dna: [
      { trait: "Authority Impersonation", score: 60, description: "Fake 'lottery board' or 'brand promotion'." },
      { trait: "Fear Tactics", score: 30, description: "Low fear — driven by greed instead." },
      { trait: "Urgency", score: 85, description: "Prize 'expires' in hours to force fees." },
      { trait: "Financial Demand", score: 95, description: "Demands 'processing' or 'tax' payment before payout." },
      { trait: "Isolation", score: 40, description: "Asks to keep the win 'confidential'." },
      { trait: "Psychological Manipulation", score: 90, description: "Exploits greed and dream-of-a-windfall." },
    ],
    summary:
      "This message announces a lottery, prize or lucky-draw win the target never entered, and will inevitably request a 'processing fee' or personal/banking details to release the payout. This is a pure fraud pattern with no exception.",
    recommendations: [
      { title: "Ignore the message", description: "There is no lottery. Delete and move on.", urgency: "warn" },
      { title: "Never pay processing fees", description: "No genuine prize requires you to pay to receive it.", urgency: "critical" },
      { title: "Do not share ID or bank details", description: "Your details will be used for further scams.", urgency: "critical" },
      { title: "Block and report", description: "Block the sender and report the number to your telecom operator.", urgency: "info" },
    ],
    followUps: [
      "Did they ask for a 'processing fee' before releasing the prize?",
      "Did they ask you to keep the win confidential?",
      "Did they ask for your Aadhaar or bank details to 'verify identity'?",
    ],
  },
  {
    id: "upi",
    label: "UPI Payment Scam",
    weight: 7,
    minScore: 75,
    maxScore: 90,
    keywords: [
      { phrase: "UPI", reason: "UPI-based social-engineering vector.", severity: "medium" },
      { phrase: "Google Pay", reason: "Impersonates Google Pay support or requests.", severity: "medium" },
      { phrase: "PhonePe", reason: "Impersonates PhonePe support or requests.", severity: "medium" },
      { phrase: "Paytm", reason: "Impersonates Paytm support or requests.", severity: "medium" },
      { phrase: "Collect Request", reason: "Reverse-payment trick — you pay instead of receive.", severity: "high" },
      { phrase: "Payment Link", reason: "Unsolicited payment link — high phishing risk.", severity: "high" },
    ],
    dna: [
      { trait: "Authority Impersonation", score: 65, description: "Impersonates UPI apps or support agents." },
      { trait: "Fear Tactics", score: 55, description: "Threats about wallet suspension or failed refunds." },
      { trait: "Urgency", score: 80, description: "Payment links expire fast to force action." },
      { trait: "Financial Demand", score: 90, description: "Aims to trigger an unintended UPI debit." },
      { trait: "Isolation", score: 40, description: "Discourages calling official support." },
      { trait: "Psychological Manipulation", score: 75, description: "Uses the trust of familiar UPI brands." },
    ],
    summary:
      "The content weaponises UPI apps — often via a 'collect request' or a payment link disguised as a refund or reward. Approving the request debits your account instead of crediting it. Never approve a UPI request you didn't initiate.",
    recommendations: [
      { title: "Never approve unknown requests", description: "In UPI, approving a request sends money — it never receives.", urgency: "critical" },
      { title: "Do not open payment links", description: "Open your UPI app yourself and check pending requests there.", urgency: "critical" },
      { title: "Verify via official app", description: "Contact support only through the UPI app's built-in help section.", urgency: "warn" },
      { title: "Report to your UPI app", description: "Report the number inside PhonePe/GPay/Paytm's 'Report fraud' flow.", urgency: "info" },
    ],
    followUps: [
      "Did they send you a 'collect request' asking you to enter your UPI PIN?",
      "Did they claim they'd refund extra money by mistake?",
      "Did they send a payment link outside the UPI app?",
    ],
  },
  {
    id: "job",
    label: "Job Scam",
    weight: 6,
    minScore: 70,
    maxScore: 90,
    keywords: [
      { phrase: "Work From Home", reason: "Common opener for fake-job recruitment.", severity: "medium" },
      { phrase: "Easy Income", reason: "Unrealistic income claim — classic job-scam pattern.", severity: "high" },
      { phrase: "Part Time Job", reason: "Unsolicited part-time offers are frequently task-fraud setups.", severity: "medium" },
      { phrase: "Telegram Job", reason: "Recruitment into Telegram groups is a known scam funnel.", severity: "high" },
      { phrase: "Earn ₹5000 Daily", reason: "Unrealistic daily-income promise.", severity: "high" },
    ],
    dna: [
      { trait: "Authority Impersonation", score: 55, description: "Fake HR from real-sounding companies." },
      { trait: "Fear Tactics", score: 25, description: "Low fear — driven by financial need instead." },
      { trait: "Urgency", score: 70, description: "'Limited slots' framing forces fast decisions." },
      { trait: "Financial Demand", score: 75, description: "Later asks for 'registration' or 'training' fees or deposits." },
      { trait: "Isolation", score: 60, description: "Moves conversation to Telegram/WhatsApp away from oversight." },
      { trait: "Psychological Manipulation", score: 80, description: "Exploits desire for easy income and flexibility." },
    ],
    summary:
      "The content offers unrealistic income for trivial tasks — liking videos, rating products, or 'part-time WFH'. These 'jobs' escalate into task-fraud where victims deposit money to unlock 'higher earnings' and eventually lose it all.",
    recommendations: [
      { title: "Ignore easy-income offers", description: "No real employer pays ₹5,000/day for liking videos.", urgency: "warn" },
      { title: "Never pay to work", description: "Legitimate employers never charge a registration, training or 'deposit' fee.", urgency: "critical" },
      { title: "Verify the company", description: "Search the company name plus 'scam' before engaging.", urgency: "warn" },
      { title: "Report the sender", description: "Report the number in-app and to cybercrime.gov.in if money was lost.", urgency: "info" },
    ],
    followUps: [
      "Did they ask you to deposit money to 'unlock' higher earnings?",
      "Did they move the conversation to Telegram or WhatsApp?",
      "Did they show fake payment screenshots as proof?",
    ],
  },
  {
    id: "phishing",
    label: "Phishing Website",
    weight: 5,
    minScore: 70,
    maxScore: 90,
    keywords: [
      { phrase: "login", reason: "Fake login page attempting to harvest credentials.", severity: "high" },
      { phrase: "verify", reason: "Fake verification prompt to phish personal data.", severity: "medium" },
      { phrase: "secure", reason: "'Secure' wording weaponised to look trustworthy.", severity: "low" },
      { phrase: ".xyz", reason: "Low-cost TLD frequently used by phishing sites.", severity: "medium" },
      { phrase: ".top", reason: "Low-cost TLD frequently used by phishing sites.", severity: "medium" },
      { phrase: "bit.ly", reason: "URL shortener hiding the real destination.", severity: "medium" },
      { phrase: "tinyurl", reason: "URL shortener hiding the real destination.", severity: "medium" },
    ],
    dna: [
      { trait: "Authority Impersonation", score: 80, description: "Mimics a trusted brand's login page." },
      { trait: "Fear Tactics", score: 60, description: "Warnings about account compromise or expiry." },
      { trait: "Urgency", score: 75, description: "Short-lived links pressure fast clicks." },
      { trait: "Financial Demand", score: 65, description: "Ultimately targets banking or wallet credentials." },
      { trait: "Isolation", score: 50, description: "Discourages checking with the real brand." },
      { trait: "Psychological Manipulation", score: 75, description: "Visual cloning defeats surface-level checks." },
    ],
    summary:
      "This URL/message shows signs of a phishing site — a masked destination, an unusual TLD, or a login/verify prompt tied to a message. Do not enter credentials. Always type the real brand's address into the browser yourself.",
    recommendations: [
      { title: "Do not enter credentials", description: "Close the page immediately. Do not submit anything.", urgency: "critical" },
      { title: "Verify the URL", description: "Compare the domain character-by-character with the real brand's site.", urgency: "warn" },
      { title: "Report the link", description: "Report it to Google Safe Browsing and to the brand being impersonated.", urgency: "info" },
    ],
    followUps: [
      "Did the link ask you to log in with your bank or email password?",
      "Was the domain slightly different from the real brand (e.g. missing/extra letter)?",
      "Did you already enter any credentials on the page?",
    ],
  },
];

const SAFE_DNA: ScamDNATrait[] = [
  { trait: "Authority Impersonation", score: 5, description: "No impersonation cues detected." },
  { trait: "Fear Tactics", score: 5, description: "No threatening language detected." },
  { trait: "Urgency", score: 10, description: "No time-pressure indicators detected." },
  { trait: "Financial Demand", score: 5, description: "No requests for money or credentials detected." },
  { trait: "Isolation", score: 5, description: "No attempt to isolate you from advice." },
  { trait: "Psychological Manipulation", score: 10, description: "No manipulation patterns detected." },
];

const SAFE_RECOMMENDATIONS: Recommendation[] = [
  { title: "No immediate risk detected", description: "The content does not match any known scam patterns.", urgency: "info" },
  { title: "Continue exercising caution", description: "Still verify the sender directly if the message asks for money, credentials or personal details.", urgency: "info" },
  { title: "When in doubt, ask again", description: "You can always run another investigation on any suspicious follow-up.", urgency: "info" },
];

const SAFE_FOLLOW_UPS = [
  "Would you like me to check a different message from the same sender?",
  "Do you have any other suspicious content you'd like me to review?",
  "Would you like tips for spotting scams in the future?",
];

/* ---------- Deterministic scoring ---------- */

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

interface CategoryMatch {
  rule: CategoryRule;
  hits: KeywordRule[];
}

function matchCategories(text: string): CategoryMatch[] {
  const haystack = text.toLowerCase();
  const matches: CategoryMatch[] = [];
  for (const rule of CATEGORIES) {
    const hits: KeywordRule[] = [];
    for (const kw of rule.keywords) {
      if (haystack.includes(kw.phrase.toLowerCase())) {
        hits.push(kw);
      }
    }
    if (hits.length > 0) matches.push({ rule, hits });
  }
  return matches;
}

function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 85) return "critical";
  if (score >= 65) return "high";
  if (score >= 40) return "medium";
  if (score >= 20) return "low";
  return "safe";
}

function pickWinner(matches: CategoryMatch[]): CategoryMatch {
  // Prefer the match with the highest (hitCount * weight); tie-break by weight.
  return [...matches].sort((a, b) => {
    const sa = a.hits.length * a.rule.weight;
    const sb = b.hits.length * b.rule.weight;
    if (sb !== sa) return sb - sa;
    return b.rule.weight - a.rule.weight;
  })[0];
}

function computeScore(rule: CategoryRule, hits: number, text: string): number {
  const range = rule.maxScore - rule.minScore;
  // Deterministic saturation curve: 1 hit ~ 45% of range, 5+ hits saturates.
  const saturation = Math.min(1, hits / 5);
  const base = rule.minScore + Math.round(range * (0.45 + 0.55 * saturation));
  // Tiny deterministic jitter (±2) tied to text — same input → same score.
  const jitter = (hashString(text) % 5) - 2;
  return Math.max(rule.minScore, Math.min(rule.maxScore, base + jitter));
}

function buildReport(text: string): InvestigationReport {
  const matches = matchCategories(text);

  if (matches.length === 0 || text.trim().length === 0) {
    const score = text.trim().length === 0 ? 5 : 10 + (hashString(text) % 10);
    return {
      riskScore: score,
      riskLevel: riskLevelFromScore(score),
      scamCategory: "Safe / Legitimate",
      categoryId: "safe",
      summary:
        "No known scam patterns were detected in this content. Language, tone and structure appear consistent with legitimate communication. Still, treat any message asking for money, credentials or personal details with caution and verify the sender through an independent channel.",
      evidence: [],
      scamDNA: SAFE_DNA,
      recommendations: SAFE_RECOMMENDATIONS,
    };
  }

  const winner = pickWinner(matches);
  const score = computeScore(winner.rule, winner.hits.length, text);

  const evidence: EvidenceItem[] = winner.hits.map((h) => ({
    phrase: h.phrase,
    reason: h.reason,
    severity: h.severity,
  }));

  return {
    riskScore: score,
    riskLevel: riskLevelFromScore(score),
    scamCategory: winner.rule.label,
    categoryId: winner.rule.id,
    summary: winner.rule.summary,
    evidence,
    scamDNA: winner.rule.dna,
    recommendations: winner.rule.recommendations,
  };
}

/* ---------- Public analyzers (swap points for a future real model) ---------- */

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function analyzeText(input: string, _type: InvestigationType = "sms") {
  await delay(900);
  return buildReport(input);
}

export async function analyzeImage(file: File | string) {
  await delay(1100);
  // Without OCR, we can only surface a Safe/unknown verdict for pure images.
  const name = typeof file === "string" ? file : file.name;
  return buildReport(name);
}

export async function analyzeWebsite(url: string) {
  await delay(900);
  return buildReport(url);
}

export async function analyzeTranscript(text: string) {
  await delay(900);
  return buildReport(text);
}

/* ---------- Chat follow-ups ---------- */

export function getFollowUpQuestions(categoryId: ScamCategoryId): string[] {
  const rule = CATEGORIES.find((c) => c.id === categoryId);
  return rule ? rule.followUps : SAFE_FOLLOW_UPS;
}

export function getIntroMessage(categoryId: ScamCategoryId, category: string): string {
  if (categoryId === "safe") {
    return "I've completed your investigation. No scam patterns matched, but I'm here if you want a second opinion on anything else.";
  }
  return `I've completed your investigation — this content matches the ${category} pattern. Ask me anything about it, or share related suspicious activity you've seen.`;
}
