/**
 * Sentinel AI — Context-Aware Rule-Based Investigation Engine
 *
 * Fully offline. No external AI API. Deterministic: identical input always
 * produces an identical report.
 *
 * Pipeline:
 *   extractEntities → detectIntent → calculateRisk → classifyScam →
 *   generateEvidence / generateSummary / generateRecommendations / generateScamDNA
 *
 * The exported analyze* functions are the swap points for a future real AI
 * model — the UI never changes.
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
  /** e.g. "Authority Impersonation" — the indicator class */
  indicator?: string;
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
  | "family_emergency"
  | "suspicious"
  | "possible_scam"
  | "safe";

export type ActionBadgeTone = "safe" | "caution" | "verify" | "warn" | "critical";

export interface ActionBadge {
  label: string;
  tone: ActionBadgeTone;
}

/**
 * The single unified decision object every UI component derives from.
 * `InvestigationReport` is kept as an alias for backwards compatibility.
 */
export interface InvestigationResult {
  riskScore: number;
  riskLevel: RiskLevel;
  scamCategory: string;
  /** Banded id — matches the display label. */
  categoryId: ScamCategoryId;
  /** Underlying detected pattern — used for DNA and follow-up questions. */
  detectedTypeId: ScamCategoryId;
  summary: string;
  evidence: EvidenceItem[];
  scamDNA: ScamDNATrait[];
  recommendations: Recommendation[];
  actionBadge: ActionBadge;
  /** 0-100: how confident the engine is in its verdict */
  confidence: number;
  confidenceReason: string;
}

export type InvestigationReport = InvestigationResult;

/* =========================================================================
 * 1. Entity extraction
 * ========================================================================= */

type EntityType =
  | "authority"
  | "identity_doc"
  | "financial_credential"
  | "courier"
  | "investment"
  | "lottery"
  | "urgency"
  | "threat"
  | "isolation"
  | "money_action"
  | "reward"
  | "job"
  | "kyc"
  | "upi"
  | "url";

interface EntityDef {
  type: EntityType;
  phrase: string;
  /** optional regex overrides simple substring matching */
  pattern?: RegExp;
}

const ENTITY_DEFS: EntityDef[] = [
  // Government / authority
  { type: "authority", phrase: "CBI" },
  { type: "authority", phrase: "ED" }, // handled carefully via pattern below
  { type: "authority", phrase: "Enforcement Directorate" },
  { type: "authority", phrase: "Police" },
  { type: "authority", phrase: "Crime Branch" },
  { type: "authority", phrase: "Cyber Cell" },
  { type: "authority", phrase: "Cyber Crime" },
  { type: "authority", phrase: "Income Tax" },
  { type: "authority", phrase: "Customs" },
  { type: "authority", phrase: "RBI" },
  { type: "authority", phrase: "Reserve Bank" },
  { type: "authority", phrase: "SEBI" },
  { type: "authority", phrase: "Supreme Court" },
  { type: "authority", phrase: "High Court" },
  { type: "authority", phrase: "TRAI" },

  // Identity documents
  { type: "identity_doc", phrase: "Aadhaar" },
  { type: "identity_doc", phrase: "Aadhar" },
  { type: "identity_doc", phrase: "PAN card" },
  { type: "identity_doc", phrase: "PAN" },
  { type: "identity_doc", phrase: "Passport" },
  { type: "identity_doc", phrase: "Driving Licence" },
  { type: "identity_doc", phrase: "Driving License" },
  { type: "identity_doc", phrase: "Voter ID" },

  // Financial credentials
  { type: "financial_credential", phrase: "OTP" },
  { type: "financial_credential", phrase: "One Time Password" },
  { type: "financial_credential", phrase: "Verification Code" },
  { type: "financial_credential", phrase: "Password" },
  { type: "financial_credential", phrase: "PIN" },
  { type: "financial_credential", phrase: "CVV" },
  { type: "financial_credential", phrase: "Card Number" },
  { type: "financial_credential", phrase: "Debit Card" },
  { type: "financial_credential", phrase: "Credit Card" },
  { type: "financial_credential", phrase: "Net Banking" },
  { type: "financial_credential", phrase: "Bank Account" },

  // UPI
  { type: "upi", phrase: "UPI" },
  { type: "upi", phrase: "Google Pay" },
  { type: "upi", phrase: "GPay" },
  { type: "upi", phrase: "PhonePe" },
  { type: "upi", phrase: "Paytm" },
  { type: "upi", phrase: "Collect Request" },
  { type: "upi", phrase: "Payment Link" },

  // Courier
  { type: "courier", phrase: "FedEx" },
  { type: "courier", phrase: "DHL" },
  { type: "courier", phrase: "Blue Dart" },
  { type: "courier", phrase: "BlueDart" },
  { type: "courier", phrase: "Parcel" },
  { type: "courier", phrase: "Package" },
  { type: "courier", phrase: "Courier" },
  { type: "courier", phrase: "Shipment" },

  // Investment
  { type: "investment", phrase: "Crypto" },
  { type: "investment", phrase: "Bitcoin" },
  { type: "investment", phrase: "Trading Tips" },
  { type: "investment", phrase: "Stock Tips" },
  { type: "investment", phrase: "Guaranteed Returns" },
  { type: "investment", phrase: "Double Money" },
  { type: "investment", phrase: "Investment Group" },
  { type: "investment", phrase: "Trading Group" },
  { type: "investment", phrase: "IPO Allotment" },

  // Lottery / reward
  { type: "lottery", phrase: "Lottery" },
  { type: "lottery", phrase: "Lucky Draw" },
  { type: "lottery", phrase: "Winner" },
  { type: "reward", phrase: "Congratulations" },
  { type: "reward", phrase: "Prize" },
  { type: "reward", phrase: "Gift" },
  { type: "reward", phrase: "Bonus" },
  { type: "reward", phrase: "Cashback" },
  { type: "reward", phrase: "Reward" },

  // Urgency
  { type: "urgency", phrase: "Immediately" },
  { type: "urgency", phrase: "Right now" },
  { type: "urgency", phrase: "Within 30 minutes" },
  { type: "urgency", phrase: "Within 24 hours" },
  { type: "urgency", phrase: "Final Warning" },
  { type: "urgency", phrase: "Last Warning" },
  { type: "urgency", phrase: "Expires" },
  { type: "urgency", phrase: "Expire" },
  { type: "urgency", phrase: "Urgent" },
  { type: "urgency", phrase: "Hurry" },

  // Threats
  { type: "threat", phrase: "Arrest" },
  { type: "threat", phrase: "Account Blocked" },
  { type: "threat", phrase: "Account Frozen" },
  { type: "threat", phrase: "Money Laundering" },
  { type: "threat", phrase: "Legal Action" },
  { type: "threat", phrase: "Case Registered" },
  { type: "threat", phrase: "FIR" },
  { type: "threat", phrase: "Non-bailable" },
  { type: "threat", phrase: "Warrant" },
  { type: "threat", phrase: "Seized" },

  // Isolation
  { type: "isolation", phrase: "Stay on the call" },
  { type: "isolation", phrase: "Do not tell anyone" },
  { type: "isolation", phrase: "Don't tell anyone" },
  { type: "isolation", phrase: "Keep this confidential" },
  { type: "isolation", phrase: "Do not disconnect" },
  { type: "isolation", phrase: "Do not hang up" },

  // Money action (the actual ask)
  { type: "money_action", phrase: "Transfer Money" },
  { type: "money_action", phrase: "Send Money" },
  { type: "money_action", phrase: "Wire Transfer" },
  { type: "money_action", phrase: "Security Deposit" },
  { type: "money_action", phrase: "Processing Fee" },
  { type: "money_action", phrase: "Clearance Fee" },
  { type: "money_action", phrase: "Customs Fee" },
  { type: "money_action", phrase: "Registration Fee" },
  { type: "money_action", phrase: "Refundable Fee" },

  // KYC
  { type: "kyc", phrase: "KYC" },
  { type: "kyc", phrase: "Update KYC" },
  { type: "kyc", phrase: "Re-KYC" },
  { type: "kyc", phrase: "Verify Account" },
  { type: "kyc", phrase: "Reactivate Account" },

  // Job
  { type: "job", phrase: "Work From Home" },
  { type: "job", phrase: "Part Time Job" },
  { type: "job", phrase: "Easy Income" },
  { type: "job", phrase: "Earn Daily" },
  { type: "job", phrase: "Telegram Job" },
];

interface Entity {
  type: EntityType;
  phrase: string; // canonical phrase
  matched: string; // exact substring from text
  index: number;
}

function findAll(text: string, def: EntityDef): { matched: string; index: number }[] {
  const lower = text.toLowerCase();
  const target = def.phrase.toLowerCase();
  const hits: { matched: string; index: number }[] = [];
  let from = 0;
  while (from < lower.length) {
    const at = lower.indexOf(target, from);
    if (at === -1) break;
    // word-boundary check for short tokens to avoid false positives (e.g. "ED" in "shared")
    const before = at === 0 ? " " : lower[at - 1];
    const after = at + target.length >= lower.length ? " " : lower[at + target.length];
    const wordChar = /[a-z0-9]/;
    // Word-boundary check for all alphanumeric tokens — prevents entities like
    // "TRAI" from matching inside "train" or "ED" inside "shared". A genuine
    // mention will always sit at a word boundary, so this doesn't drop any
    // legitimate hits.
    if (wordChar.test(before) || wordChar.test(after)) {
      from = at + target.length;
      continue;
    }
    hits.push({ matched: text.slice(at, at + target.length), index: at });
    from = at + target.length;
  }
  return hits;
}

export function extractEntities(text: string): Entity[] {
  const entities: Entity[] = [];
  for (const def of ENTITY_DEFS) {
    for (const hit of findAll(text, def)) {
      entities.push({
        type: def.type,
        phrase: def.phrase,
        matched: hit.matched,
        index: hit.index,
      });
    }
  }
  return entities;
}

/* =========================================================================
 * 2. Intent detection — is the entity being WEAPONISED or WARNED against?
 * ========================================================================= */

export type Intent = "malicious" | "warning" | "neutral";

const WARNING_CUES = [
  "never share",
  "never give",
  "never tell",
  "never disclose",
  "never reveal",
  "do not share",
  "don't share",
  "do not give",
  "don't give",
  "do not disclose",
  "will never ask",
  "won't ask",
  "will not ask",
  "beware",
  "warning:",
  "警告",
  "avoid sharing",
  "protect your",
  "keep your otp",
  "keep your pin",
  "keep your password",
  "if someone asks",
  "if anyone asks",
  "warns citizens",
  "awareness",
  "government warns",
  "public awareness",
];

const REQUEST_CUES = [
  "share your",
  "send your",
  "tell us your",
  "tell me your",
  "give us your",
  "provide your",
  "enter your",
  "confirm your",
  "verify your",
  "type your",
  "read out",
  "read the",
  "share the otp",
  "share the code",
  "send the otp",
  "send the code",
  "click here",
  "click the link",
  "click below",
  "click to",
  "update your kyc",
  "complete kyc",
];

function contextWindow(text: string, index: number, radius = 60): string {
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + radius);
  return text.slice(start, end).toLowerCase();
}

export function detectIntent(text: string, entity: Entity): Intent {
  const window = contextWindow(text, entity.index);
  if (WARNING_CUES.some((c) => window.includes(c))) return "warning";
  if (REQUEST_CUES.some((c) => window.includes(c))) return "malicious";
  return "neutral";
}

/* =========================================================================
 * 3. Website / URL analysis
 * ========================================================================= */

const SAFE_DOMAINS = [
  "amazon.in",
  "amazon.com",
  "google.com",
  "google.co.in",
  "sbi.co.in",
  "onlinesbi.sbi",
  "onlinesbi.com",
  "icicibank.com",
  "hdfcbank.com",
  "axisbank.com",
  "kotak.com",
  "irctc.co.in",
  "uidai.gov.in",
  "incometax.gov.in",
  "cybercrime.gov.in",
  "rbi.org.in",
  "npci.org.in",
];

const SAFE_TLDS = [".gov.in", ".nic.in", ".gov", ".edu"];
const SUSPICIOUS_TLDS = [".xyz", ".top", ".click", ".live", ".info", ".gq", ".tk", ".cf", ".ml"];
const SUSPICIOUS_URL_KEYWORDS = [
  "login",
  "signin",
  "verify",
  "secure",
  "claim",
  "reward",
  "gift",
  "bonus",
  "kyc",
  "update",
  "unblock",
  "wallet",
];
const SHORTENERS = ["bit.ly", "tinyurl.com", "t.co", "rebrand.ly", "cutt.ly", "shorturl.at"];

interface UrlAnalysis {
  hasUrl: boolean;
  isKnownSafe: boolean;
  isShortener: boolean;
  suspiciousTld: string | null;
  suspiciousKeywords: string[];
  rawUrl: string | null;
}

function analyzeUrl(text: string): UrlAnalysis {
  const urlRegex = /\b((?:https?:\/\/)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?)/i;
  const match = text.match(urlRegex);
  if (!match) {
    return {
      hasUrl: false,
      isKnownSafe: false,
      isShortener: false,
      suspiciousTld: null,
      suspiciousKeywords: [],
      rawUrl: null,
    };
  }
  const raw = match[1];
  const lower = raw.toLowerCase();
  const host = lower.replace(/^https?:\/\//, "").split("/")[0];

  const isKnownSafe = SAFE_DOMAINS.some((d) => host === d || host.endsWith("." + d));
  const isSafeTld = SAFE_TLDS.some((t) => host.endsWith(t));
  const isShortener = SHORTENERS.some((s) => host === s || host.endsWith("." + s));
  const suspiciousTld = isSafeTld
    ? null
    : (SUSPICIOUS_TLDS.find((t) => host.endsWith(t)) ?? null);
  const suspiciousKeywords = isKnownSafe
    ? []
    : SUSPICIOUS_URL_KEYWORDS.filter((k) => lower.includes(k));

  return {
    hasUrl: true,
    isKnownSafe,
    isShortener,
    suspiciousTld,
    suspiciousKeywords,
    rawUrl: raw,
  };
}

/* =========================================================================
 * 4. Indicator scoring
 * ========================================================================= */

type IndicatorId =
  | "authority_impersonation"
  | "financial_demand"
  | "urgency"
  | "threat"
  | "credential_request"
  | "unknown_website"
  | "fake_domain"
  | "isolation"
  | "reward_promise"
  | "grammar_errors"
  | "kyc_hook"
  | "courier_pretext"
  | "investment_pitch"
  | "job_pitch"
  | "upi_trap"
  | "family_impersonation"
  | "emergency_pretext";

const INDICATOR_WEIGHT: Record<IndicatorId, number> = {
  authority_impersonation: 20,
  financial_demand: 25,
  urgency: 15,
  threat: 20,
  credential_request: 25,
  unknown_website: 15,
  fake_domain: 25,
  isolation: 20,
  reward_promise: 20,
  grammar_errors: 5,
  kyc_hook: 20,
  courier_pretext: 18,
  investment_pitch: 22,
  job_pitch: 15,
  upi_trap: 22,
  family_impersonation: 30,
  emergency_pretext: 20,
};

const INDICATOR_LABEL: Record<IndicatorId, string> = {
  authority_impersonation: "Authority Impersonation",
  financial_demand: "Financial Demand",
  urgency: "Urgency Pressure",
  threat: "Threat Language",
  credential_request: "Credential Request",
  unknown_website: "Unknown Website",
  fake_domain: "Fake Domain",
  isolation: "Isolation Tactic",
  reward_promise: "Reward Promise",
  grammar_errors: "Grammar Errors",
  kyc_hook: "Fake KYC Hook",
  courier_pretext: "Courier Pretext",
  investment_pitch: "Investment Pitch",
  job_pitch: "Fake Job Offer",
  upi_trap: "UPI Trap",
  family_impersonation: "Family/Friend Impersonation",
  emergency_pretext: "Emergency Pretext",
};

interface IndicatorHit {
  id: IndicatorId;
  label: string;
  matchedPhrase: string;
  reason: string;
  severity: EvidenceItem["severity"];
}

function severityFromWeight(weight: number): EvidenceItem["severity"] {
  if (weight >= 22) return "high";
  if (weight >= 15) return "medium";
  return "low";
}

function detectGrammarIssues(text: string): boolean {
  if (text.trim().length < 20) return false;
  const issues = [
    /\b(kindly do the needful)\b/i,
    /!{2,}/,
    /\bur\b/i,
    /\bplz\b/i,
    /\bdear (customer|sir|madam)\b/i,
    /\baccnt\b/i,
    /\bverfy\b/i,
    /[A-Z]{6,}/, // shouting
  ];
  return issues.filter((r) => r.test(text)).length >= 2;
}

interface AnalysisContext {
  text: string;
  entities: Entity[];
  intents: Map<Entity, Intent>;
  url: UrlAnalysis;
  indicators: IndicatorHit[];
}

function addIndicator(
  ctx: AnalysisContext,
  id: IndicatorId,
  matched: string,
  reason: string,
) {
  // Dedup by (id, matched)
  if (ctx.indicators.some((h) => h.id === id && h.matchedPhrase === matched)) return;
  ctx.indicators.push({
    id,
    label: INDICATOR_LABEL[id],
    matchedPhrase: matched,
    reason,
    severity: severityFromWeight(INDICATOR_WEIGHT[id]),
  });
}

/* Regex-based pattern indicators — catches phrases that filler words defeat
   ("account will be blocked", "arrest warrant", "reply with the OTP", …). */
interface PatternRule {
  id: IndicatorId;
  regex: RegExp;
  reason: (m: string) => string;
  /** If a WARNING_CUE appears anywhere in text, skip this pattern. */
  suppressOnWarning?: boolean;
}

const PATTERN_RULES: PatternRule[] = [
  // Authority impersonation with role/action
  { id: "authority_impersonation", regex: /\b(cbi|ed|enforcement directorate|mumbai police|delhi police|cyber cell|cyber crime|crime branch|income tax dept|customs department|rbi officer)\b/i, reason: (m) => `"${m}" is presented as the sender — real agencies never contact citizens over SMS/WhatsApp.`, suppressOnWarning: true },

  // Threats — with filler words
  { id: "threat", regex: /\barrest\s+warrant\b/i, reason: () => `"arrest warrant" — impersonators use fabricated warrants to force payment.`, suppressOnWarning: true },
  { id: "threat", regex: /\bnon[- ]?bailable\b/i, reason: () => `"non-bailable" language is a coercion tactic.`, suppressOnWarning: true },
  { id: "threat", regex: /\baccount\s+(?:will\s+be|has\s+been|is\s+being)?\s*(?:blocked|frozen|suspended|deactivated|closed)\b/i, reason: (m) => `Threat "${m}" — a fake account-block warning is a standard scam hook.`, suppressOnWarning: true },
  { id: "threat", regex: /\b(?:frozen|blocked|suspended|seized|held)\s+your\s+account\b/i, reason: (m) => `Threat "${m}" — impersonated account-freeze is a Digital Arrest / KYC hook.`, suppressOnWarning: true },
  { id: "threat", regex: /\b(?:parcel|package|shipment)\s+(?:has\s+been\s+)?(?:seized|held|detained)\b/i, reason: (m) => `Threat "${m}" — invented seizure to justify a fee.`, suppressOnWarning: true },
  { id: "threat", regex: /\bmoney\s+laundering\b/i, reason: () => `"money laundering" accusation is a Digital Arrest signature.`, suppressOnWarning: true },
  { id: "threat", regex: /\billegal\s+(?:goods|items|substances|drugs)\b/i, reason: (m) => `"${m}" — courier-scam framing that pivots to a fake authority.`, suppressOnWarning: true },
  { id: "threat", regex: /\bavoid\s+arrest\b/i, reason: () => `"avoid arrest" — direct coercion language.`, suppressOnWarning: true },
  { id: "threat", regex: /\blegal\s+action\b/i, reason: () => `"legal action" threat.`, suppressOnWarning: true },

  // Financial demand — filler words
  { id: "financial_demand", regex: /\b(?:transfer|send|pay|wire|deposit)\s+(?:₹|rs\.?\s*|inr\s*)\s*\d[\d,]*/i, reason: (m) => `Direct money demand "${m}" — the ultimate goal of the scam.`, suppressOnWarning: true },
  { id: "financial_demand", regex: /\bpay\s+(?:to|now|immediately|handling|clearance|customs|processing|security)\b/i, reason: (m) => `"${m}" — direct payment demand.`, suppressOnWarning: true },
  { id: "financial_demand", regex: /\b(?:send|transfer)\s+money\b/i, reason: (m) => `"${m}" — direct financial demand.`, suppressOnWarning: true },
  { id: "financial_demand", regex: /\b(?:processing|registration|security|handling|clearance|customs|refundable|advance)\s+(?:fee|deposit|charge|charges)\b/i, reason: (m) => `Fake up-front fee "${m}".`, suppressOnWarning: true },
  { id: "financial_demand", regex: /\bpay\s+₹\s*\d/i, reason: (m) => `"${m}" — explicit payment demand.`, suppressOnWarning: true },

  // Credential requests — filler words allowed
  { id: "credential_request", regex: /\b(?:share|send|reply\s+with|tell\s+(?:me|us)|give\s+(?:me|us)|provide|confirm|type|enter)\s+(?:the\s+|your\s+|me\s+)?(?:otp|one[- ]time\s+password|verification\s+code|pin|cvv|password|passcode)\b/i, reason: (m) => `Explicit credential request: "${m}" — no legitimate business ever asks for these.`, suppressOnWarning: true },
  { id: "credential_request", regex: /\botp\s+(?:to|for|now)\b/i, reason: (m) => `"${m}" — the message routes an OTP into the scammer's hands.`, suppressOnWarning: true },

  // KYC hooks
  { id: "kyc_hook", regex: /\bupdate\s+(?:your\s+)?(?:kyc|pan|aadhaar|account\s+details)\b/i, reason: (m) => `Fake KYC prompt "${m}" — banks handle this only inside their own app.`, suppressOnWarning: true },
  { id: "kyc_hook", regex: /\b(?:re[- ]?activate|reactivate|verify)\s+(?:your\s+|the\s+)?account\b/i, reason: (m) => `"${m}" is a classic banking-scam hook.`, suppressOnWarning: true },
  { id: "kyc_hook", regex: /\bkyc\s+(?:has\s+)?(?:expired|pending|update|update\s+required)\b/i, reason: (m) => `"${m}" — fake KYC expiry pressure.`, suppressOnWarning: true },

  // Reward promises
  { id: "reward_promise", regex: /\bwon\s+(?:₹|rs\.?|inr)?\s*\d[\d,]*\s*(?:lakh|crore|thousand)?/i, reason: (m) => `Unexpected prize claim "${m}" — you cannot win a draw you never entered.` },
  { id: "reward_promise", regex: /\bcongratulations\b.*(?:won|winner|selected|prize)/i, reason: () => `"Congratulations… you won/selected" — classic lottery-scam opener.` },
  { id: "reward_promise", regex: /\b(?:claim\s+your\s+)?(?:lottery|lucky\s+draw|cash\s+prize|international\s+prize)\b/i, reason: (m) => `Lottery lure "${m}".` },

  // Investment
  { id: "investment_pitch", regex: /\b(?:guaranteed|assured|fixed)\s+(?:returns?|profits?|income)\b/i, reason: (m) => `"${m}" — no real market offers guaranteed returns.` },
  { id: "investment_pitch", regex: /\bdouble\s+your\s+money\b/i, reason: () => `"double your money" — signature investment-fraud promise.` },
  { id: "investment_pitch", regex: /\b\d{2,}%\s*(?:weekly|daily|monthly|guaranteed)\s*returns?/i, reason: (m) => `Implausible returns "${m}".` },
  { id: "investment_pitch", regex: /\b(?:whatsapp|telegram)\s+(?:investment|trading|stock)\s+group\b/i, reason: (m) => `"${m}" — SEBI advisors don't recruit via WhatsApp/Telegram.` },
  { id: "investment_pitch", regex: /\bzero\s+risk\b/i, reason: () => `"zero risk" — no legitimate investment carries zero risk.` },

  // Job scams
  { id: "job_pitch", regex: /\bearn\s+(?:₹|rs\.?)?\s*\d[\d,]*\s*(?:daily|per\s+day|weekly|from\s+home)?/i, reason: (m) => `Unrealistic income promise "${m}".` },
  { id: "job_pitch", regex: /\b(?:immediate|instant)\s+hiring\b/i, reason: (m) => `"${m}" with an up-front fee is a task-fraud pattern.` },
  { id: "job_pitch", regex: /\bpart[- ]time\s+job\b.*(?:fee|deposit|registration)/i, reason: () => `Part-time job requiring a fee — task-fraud signature.` },
  { id: "job_pitch", regex: /\bappointment\s+letter\b/i, reason: () => `"appointment letter" tied to a deposit is a job-scam signature.` },

  // UPI traps
  { id: "upi_trap", regex: /\b(?:approve|accept)\s+(?:this|the)\s+(?:upi\s+)?collect\s+request\b/i, reason: (m) => `"${m}" — approving debits your account, it never credits.` },
  { id: "upi_trap", regex: /\bcollect\s+request\b/i, reason: () => `A UPI "collect request" from a stranger only debits you.` },
  { id: "upi_trap", regex: /\bscan\s+(?:this|the)\s+qr\s+code\b/i, reason: (m) => `"${m}" — scanning to *receive* money is impossible on UPI; it only sends.` },
  { id: "upi_trap", regex: /\baccept\s+the\s+collect\s+request\s+to\s+claim/i, reason: () => `"accept collect request to claim…" — the request debits you, never credits.` },

  // Phishing / unknown links
  { id: "unknown_website", regex: /\bclick\s+(?:here|the\s+link|below|on\s+the\s+link)\b/i, reason: (m) => `"${m}" — vague link directives are classic phishing bait.`, suppressOnWarning: true },
  { id: "unknown_website", regex: /\bverify\s+(?:now|today)?\s+using\s+this\s+link\b/i, reason: (m) => `"${m}" — an unverified link is a phishing red flag.`, suppressOnWarning: true },
  { id: "unknown_website", regex: /\bsecure\s+(?:banking|login)\s+link\b/i, reason: (m) => `"${m}" — fake secure-banking wording.`, suppressOnWarning: true },

  // Urgency filler
  { id: "urgency", regex: /\btoday\b.*(?:unless|otherwise|or\s+else)/i, reason: () => `"today unless…" — deadline coercion.` },
  { id: "urgency", regex: /\bbefore\s+midnight\b/i, reason: () => `"before midnight" — artificial deadline.` },
  { id: "urgency", regex: /\bwithin\s+\d+\s+(?:minutes|hours)\b/i, reason: (m) => `"${m}" — artificial deadline pressure.` },

  // Isolation
  { id: "isolation", regex: /\bdo\s+not\s+(?:tell|inform|disclose\s+to)\s+anyone\b/i, reason: (m) => `"${m}" — isolates the target from help.` },
  { id: "isolation", regex: /\bstay\s+on\s+(?:this|the)\s+call\b/i, reason: (m) => `"${m}" — prevents the target from hanging up to verify.` },


  // Family / friend impersonation (scammer poses as a relative or close contact)
  { id: "family_impersonation", regex: /\b(?:hi|hello|hey)\s+(?:beta|beti|bhai|bhaiya|didi|dear|son|daughter|dad|mom|mummy|papa)\b/i, reason: (m) => `"${m}" — impersonators open with a familiar family address to bypass suspicion.` },
  { id: "family_impersonation", regex: /\bthis\s+is\s+(?:your\s+)?(?:uncle|aunt(?:y|ie)?|cousin|nephew|niece|brother|sister|dad|mom|mummy|papa|grand(?:pa|ma|father|mother))\b/i, reason: (m) => `"${m}" — claims to be a specific relative without proof of identity.` },
  { id: "family_impersonation", regex: /\b(?:lost\s+my\s+phone|(?:using|from)\s+(?:a\s+)?(?:friend'?s|new)\s+(?:phone|number)|this\s+is\s+my\s+new\s+number|old\s+number\s+(?:is\s+)?(?:not\s+working|dead|off))\b/i, reason: (m) => `"${m}" — a "new number" pretext is how impersonators explain why the contact looks unfamiliar.` },
  { id: "family_impersonation", regex: /\b(?:don'?t|do\s+not)\s+call\b/i, reason: (m) => `"${m}" — telling the target not to call back blocks voice verification.` },
  { id: "family_impersonation", regex: /\bphone\s+(?:is\s+)?(?:off|dead|switched\s+off|not\s+working|broken)\b/i, reason: (m) => `"${m}" — a "phone is off" excuse prevents the target from confirming the sender's real voice.` },

  // Emergency pretext (medical/travel/accident) — pairs with family impersonation
  { id: "emergency_pretext", regex: /\bmedical\s+emergency\b/i, reason: () => `"medical emergency" — the go-to hook that pressures instant transfers.` },
  { id: "emergency_pretext", regex: /\b(?:stuck|stranded)\s+(?:at|in)\s+(?:the\s+)?(?:airport|hospital|station|border|police\s+station)\b/i, reason: (m) => `"${m}" — invented stranding is a scripted emergency-scam beat.` },
  { id: "emergency_pretext", regex: /\burgently\s+need\b/i, reason: () => `"urgently need" — manufactured urgency to skip verification.` },
  { id: "emergency_pretext", regex: /\bneed\s+(?:₹|rs\.?|inr)?\s*\d[\d,]*\s+(?:urgently|immediately|right\s+now|asap)\b/i, reason: (m) => `"${m}" — urgent money ask without prior context.` },

  // Family-emergency money asks (informal transfer phrasing the standard financial_demand regex misses)
  { id: "financial_demand", regex: /\b(?:please\s+)?(?:transfer|send)\s+(?:it\s+)?(?:to\s+)?(?:this\s+)?(?:upi|account|number|a\/c)\b/i, reason: (m) => `"${m}" — routes money to an account the target can't verify.`, suppressOnWarning: true },
  { id: "financial_demand", regex: /\bi'?ll\s+return\s+it\s+tomorrow\b/i, reason: () => `"I'll return it tomorrow" — the classic false promise used in emergency-impersonation scams.`, suppressOnWarning: true },
];

function anyWarning(text: string): boolean {
  const lower = text.toLowerCase();
  return WARNING_CUES.some((c) => lower.includes(c));
}

function buildIndicators(text: string): AnalysisContext {
  const entities = extractEntities(text);
  const intents = new Map<Entity, Intent>();
  const url = analyzeUrl(text);
  const ctx: AnalysisContext = { text, entities, intents, url, indicators: [] };
  const warningPresent = anyWarning(text);

  for (const e of entities) {
    const intent = detectIntent(text, e);
    intents.set(e, intent);

    switch (e.type) {
      case "authority":
        if (intent !== "warning") {
          addIndicator(
            ctx,
            "authority_impersonation",
            e.matched,
            `"${e.matched}" is used to establish false authority — real ${e.matched} officers do not contact people over WhatsApp or SMS.`,
          );
        }
        break;
      case "threat":
        if (intent !== "warning") {
          addIndicator(
            ctx,
            "threat",
            e.matched,
            `Threat language ("${e.matched}") is used to short-circuit the target's judgement.`,
          );
        }
        break;
      case "urgency":
        addIndicator(
          ctx,
          "urgency",
          e.matched,
          `Time pressure ("${e.matched}") prevents the target from pausing to verify.`,
        );
        break;
      case "isolation":
        addIndicator(
          ctx,
          "isolation",
          e.matched,
          `Isolation tactic ("${e.matched}") stops the target from consulting family, bank or police.`,
        );
        break;
      case "money_action":
        addIndicator(
          ctx,
          "financial_demand",
          e.matched,
          `Direct financial demand ("${e.matched}") is the ultimate goal of the operation.`,
        );
        break;
      case "financial_credential":
        if (intent === "malicious") {
          addIndicator(
            ctx,
            "credential_request",
            e.matched,
            `The message asks the target to share "${e.matched}". No legitimate business ever needs this.`,
          );
        }
        break;
      case "kyc":
        if (intent !== "warning") {
          addIndicator(
            ctx,
            "kyc_hook",
            e.matched,
            `Fake KYC prompt ("${e.matched}") is a classic banking-scam hook. Real banks handle KYC through their own app.`,
          );
        }
        break;
      case "courier":
        addIndicator(
          ctx,
          "courier_pretext",
          e.matched,
          `Courier premise ("${e.matched}") is often paired with a fake customs / arrest scenario.`,
        );
        break;
      case "investment":
        addIndicator(
          ctx,
          "investment_pitch",
          e.matched,
          `Investment lure ("${e.matched}") — SEBI-registered advisors do not cold-DM strangers.`,
        );
        break;
      case "lottery":
      case "reward":
        addIndicator(
          ctx,
          "reward_promise",
          e.matched,
          `Unexpected reward ("${e.matched}") — you cannot win a draw you never entered.`,
        );
        break;
      case "job":
        addIndicator(
          ctx,
          "job_pitch",
          e.matched,
          `Job lure ("${e.matched}") — task-fraud scams start with unrealistic income promises.`,
        );
        break;
      case "upi":
        if (intent === "malicious" || /collect request|payment link/i.test(e.matched)) {
          addIndicator(
            ctx,
            "upi_trap",
            e.matched,
            `UPI action ("${e.matched}") — approving a request debits your account, it never credits.`,
          );
        }
        break;
    }
  }

  // Regex-based pattern layer — the heart of contextual reasoning.
  for (const rule of PATTERN_RULES) {
    if (rule.suppressOnWarning && warningPresent) continue;
    const m = text.match(rule.regex);
    if (m) {
      addIndicator(ctx, rule.id, m[0], rule.reason(m[0]));
    }
  }

  // Website indicators
  if (url.hasUrl && !url.isKnownSafe) {
    if (url.suspiciousTld) {
      addIndicator(
        ctx,
        "fake_domain",
        url.rawUrl ?? url.suspiciousTld,
        `The domain uses "${url.suspiciousTld}", a TLD heavily abused by phishing sites.`,
      );
    }
    if (url.isShortener) {
      addIndicator(
        ctx,
        "unknown_website",
        url.rawUrl ?? "shortener",
        `The link uses a URL shortener that hides the real destination.`,
      );
    }
    if (url.suspiciousKeywords.length > 0) {
      addIndicator(
        ctx,
        "unknown_website",
        url.rawUrl ?? url.suspiciousKeywords.join(", "),
        `The URL contains suspicious keywords (${url.suspiciousKeywords.join(", ")}) typical of credential-harvesting pages.`,
      );
    }
  }

  if (detectGrammarIssues(text)) {
    addIndicator(
      ctx,
      "grammar_errors",
      "message tone",
      "The message contains grammar, spelling or formatting cues (all-caps, 'kindly do the needful', 'plz', misspellings) typical of scam campaigns.",
    );
  }

  return ctx;
}

export function calculateRisk(ctx: AnalysisContext): {
  score: number;
  activeIndicators: IndicatorId[];
} {
  const unique = new Set<IndicatorId>();
  for (const h of ctx.indicators) unique.add(h.id);
  let score = 0;
  for (const id of unique) score += INDICATOR_WEIGHT[id];

  // Softer dampening: a single weak indicator shouldn't scream "critical",
  // but any two independent indicators can push into high/critical bands.
  if (unique.size === 1) {
    const only = [...unique][0]!;
    // Strong solo indicators (a direct credential request, financial demand, or
    // fake domain) legitimately warrant a high band on their own.
    const soloStrong: IndicatorId[] = ["credential_request", "financial_demand", "fake_domain", "upi_trap"];
    if (!soloStrong.includes(only)) score = Math.min(score, 45);
    else score = Math.min(score, 78);
  }

  score = Math.max(0, Math.min(100, score));
  return { score, activeIndicators: [...unique] };
}

/* =========================================================================
 * 5. Classification
 * ========================================================================= */

const CATEGORY_LABEL: Record<ScamCategoryId, string> = {
  digital_arrest: "Digital Arrest Scam",
  banking_kyc: "Banking / KYC Scam",
  otp: "OTP Scam",
  courier: "Courier Scam",
  investment: "Investment Scam",
  lottery: "Lottery Scam",
  upi: "UPI Payment Scam",
  job: "Job Scam",
  phishing: "Phishing Website",
  family_emergency: "Family/Emergency Impersonation Scam",
  suspicious: "Suspicious",
  possible_scam: "Possible Scam",
  safe: "Safe / Legitimate",
};

export function classifyScam(active: Set<IndicatorId>, ctx: AnalysisContext): ScamCategoryId {
  const has = (id: IndicatorId) => active.has(id);

  // Guard: an entity like "package", "ticket", "KYC" or "OTP" appearing on its
  // own — without any true scam signal (authority, threat, financial demand,
  // credential request, KYC hook, reward promise, investment pitch, job pitch,
  // UPI trap, phishing link, isolation, or urgency) — is not a scam. This
  // prevents benign shipping / booking confirmations from being classified as
  // Courier / Banking scams via the entity fallback below.
  const scamSignals: IndicatorId[] = [
    "authority_impersonation",
    "financial_demand",
    "threat",
    "credential_request",
    "kyc_hook",
    "fake_domain",
    "unknown_website",
    "reward_promise",
    "investment_pitch",
    "job_pitch",
    "upi_trap",
    "isolation",
    "urgency",
  ];
  if (!scamSignals.some((id) => active.has(id))) return "safe";


  // Phishing wins when a real URL/domain vector accompanies a KYC hook.
  if ((has("fake_domain") || (has("unknown_website") && ctx.url.hasUrl)) && has("kyc_hook")) {
    return "phishing";
  }

  // Courier pretext (requires a scam signal — bare "package" doesn't count).
  if (has("courier_pretext") && (has("threat") || has("financial_demand") || has("authority_impersonation"))) {
    return "courier";
  }

  // Digital Arrest: authority + (threat | isolation | direct money demand).
  if (has("authority_impersonation") && (has("threat") || has("isolation") || has("financial_demand"))) {
    return "digital_arrest";
  }

  if (has("upi_trap")) return "upi";
  if (has("investment_pitch")) return "investment";
  if (has("reward_promise")) return "lottery";
  if (has("job_pitch")) return "job";
  if (has("kyc_hook") || (has("authority_impersonation") && (has("unknown_website") || has("fake_domain")))) {
    return "banking_kyc";
  }
  if (has("credential_request")) return "otp";
  if (has("fake_domain") || has("unknown_website")) return "phishing";

  // Weak single signals
  if (active.size === 0) return "safe";

  // Fall back to the dominant category the entities suggest
  const entityTypes = new Set(ctx.entities.map((e) => e.type));
  if (entityTypes.has("lottery") || entityTypes.has("reward")) return "lottery";
  if (entityTypes.has("investment")) return "investment";
  if (entityTypes.has("courier")) return "courier";
  if (entityTypes.has("financial_credential")) return "otp";
  if (entityTypes.has("kyc")) return "banking_kyc";
  return "phishing";
}

/* =========================================================================
 * 6. Evidence / Summary / Recommendations / DNA
 * ========================================================================= */

export function generateEvidence(ctx: AnalysisContext): EvidenceItem[] {
  return ctx.indicators.map((h) => ({
    phrase: h.matchedPhrase,
    reason: `${h.label} — ${h.reason}`,
    severity: h.severity,
    indicator: h.label,
  }));
}

const SUMMARY_FRAGMENTS: Partial<Record<IndicatorId, string>> = {
  authority_impersonation: "impersonates a government or law-enforcement authority",
  threat: "uses threatening legal language",
  urgency: "manufactures urgency to prevent the target from pausing",
  financial_demand: "demands an immediate money transfer or fee",
  credential_request: "asks the target to share credentials such as an OTP, PIN or password",
  isolation: "tries to isolate the target from friends, family or their bank",
  reward_promise: "dangles an unexpected reward, lottery win or gift",
  investment_pitch: "pitches unrealistic investment or trading returns",
  job_pitch: "offers unrealistic income for trivial work",
  kyc_hook: "impersonates a bank with a fake KYC / account-verification prompt",
  courier_pretext: "invents a courier or parcel to justify a fee or ID check",
  upi_trap: "weaponises UPI collect requests or payment links",
  fake_domain: "uses a domain built for phishing (suspicious TLD)",
  unknown_website: "links to an untrusted or obfuscated website",
  grammar_errors: "shows tell-tale grammar and formatting mistakes",
};

export function generateSummary(
  category: ScamCategoryId,
  active: IndicatorId[],
  score: number,
): string {
  if (category === "safe") {
    return "No scam indicators were detected. The content's language, tone and structure look consistent with legitimate communication. Continue to treat any unsolicited request for money, credentials or personal details with caution.";
  }
  const parts = active
    .map((id) => SUMMARY_FRAGMENTS[id])
    .filter((s): s is string => Boolean(s));
  const joined =
    parts.length === 0
      ? "combines multiple suspicious signals"
      : parts.length === 1
        ? parts[0]!
        : parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1];

  if (category === "suspicious") {
    return `This message ${joined}. A few signals stand out, but there isn't enough evidence to confirm a specific scam yet — treat it as suspicious and verify before responding.`;
  }
  if (category === "possible_scam") {
    return `This message ${joined}. The combination of signals is consistent with a possible scam. Do not act on it until you have independently verified the sender through a trusted channel.`;
  }

  const verdict =
    score >= 90
      ? "Multiple high-risk indicators strongly suggest"
      : score >= 71
        ? "The combination of indicators is consistent with"
        : "There are early signs consistent with";

  return `This message ${joined}. ${verdict} a ${CATEGORY_LABEL[category]}.`;
}

const RECS_BY_CATEGORY: Record<ScamCategoryId, Recommendation[]> = {
  digital_arrest: [
    { title: "Disconnect immediately", description: "Real agencies never conduct investigations over WhatsApp or continuous calls. Hang up and walk away.", urgency: "critical" },
    { title: "Never transfer money", description: "No legitimate authority demands 'security deposits' or instant transfers to clear your name.", urgency: "critical" },
    { title: "Report to cybercrime.gov.in", description: "File a complaint at cybercrime.gov.in or call 1930 (India cybercrime helpline).", urgency: "warn" },
    { title: "Call your bank", description: "If you already transferred money, request a fraud freeze within 24 hours.", urgency: "warn" },
  ],
  banking_kyc: [
    { title: "Never share card, CVV or PIN", description: "No bank will ever ask for these over a call or message.", urgency: "critical" },
    { title: "Do not click links", description: "Open your bank's official app or website by typing the address yourself.", urgency: "critical" },
    { title: "Call your bank directly", description: "Use the number printed on your debit card, not any number from the message.", urgency: "warn" },
    { title: "Report the message", description: "Forward to your bank's fraud line and report to cybercrime.gov.in.", urgency: "info" },
  ],
  otp: [
    { title: "Never share an OTP", description: "OTPs authorise transactions. Sharing one is the same as sending the money yourself.", urgency: "critical" },
    { title: "Hang up immediately", description: "If someone is on a call asking for an OTP, end the call now.", urgency: "critical" },
    { title: "Change your password", description: "If you already shared any credentials, reset them from a trusted device.", urgency: "warn" },
    { title: "Report to your bank", description: "Alert your bank's fraud line and freeze transactions if needed.", urgency: "warn" },
  ],
  courier: [
    { title: "Ignore the message", description: "You aren't obliged to respond to any courier you didn't book.", urgency: "warn" },
    { title: "Verify on the official app", description: "Track any real parcel only on the courier's official website or app.", urgency: "info" },
    { title: "Never pay 'clearance fees'", description: "Customs charges are collected only at delivery or through official portals.", urgency: "critical" },
    { title: "Block the sender", description: "Block the number and report it to your telecom operator.", urgency: "info" },
  ],
  investment: [
    { title: "Never invest under pressure", description: "Any 'act within 24 hours' pitch is a scam. Real markets don't work that way.", urgency: "critical" },
    { title: "Verify SEBI registration", description: "Search the advisor's name on the SEBI website before sending a rupee.", urgency: "warn" },
    { title: "Block the sender", description: "Leave the group, block the contact and report the number.", urgency: "warn" },
    { title: "Report to cybercrime.gov.in", description: "File a complaint if you already transferred money.", urgency: "info" },
  ],
  lottery: [
    { title: "Ignore the message", description: "There is no lottery. Delete and move on.", urgency: "warn" },
    { title: "Never pay processing fees", description: "No genuine prize requires you to pay to receive it.", urgency: "critical" },
    { title: "Do not share ID or bank details", description: "Your details will be used for further scams.", urgency: "critical" },
    { title: "Block and report", description: "Block the sender and report the number to your telecom operator.", urgency: "info" },
  ],
  upi: [
    { title: "Never approve unknown requests", description: "In UPI, approving a request sends money — it never receives.", urgency: "critical" },
    { title: "Do not open payment links", description: "Open your UPI app yourself and check pending requests there.", urgency: "critical" },
    { title: "Verify via official app", description: "Contact support only through the UPI app's built-in help section.", urgency: "warn" },
    { title: "Report to your UPI app", description: "Report the number inside PhonePe/GPay/Paytm's 'Report fraud' flow.", urgency: "info" },
  ],
  job: [
    { title: "Ignore easy-income offers", description: "No real employer pays ₹5,000/day for liking videos.", urgency: "warn" },
    { title: "Never pay to work", description: "Legitimate employers never charge a registration, training or 'deposit' fee.", urgency: "critical" },
    { title: "Verify the company", description: "Search the company name plus 'scam' before engaging.", urgency: "warn" },
    { title: "Report the sender", description: "Report the number in-app and to cybercrime.gov.in if money was lost.", urgency: "info" },
  ],
  family_emergency: [
    { title: "Do not send any money", description: "The classic beat of this scam is a family member in distress asking for an instant transfer. Stop before you pay.", urgency: "critical" },
    { title: "Verify by calling the person on their known number", description: "Even if the message says 'phone is off' or 'don't call', dial the relative's real number or a shared family member to confirm.", urgency: "critical" },
    { title: "Never trust a new UPI ID or account claimed by a 'relative'", description: "Impersonators route funds to their own UPI/account. Ask a control question only the real person would know.", urgency: "warn" },
    { title: "Report the number", description: "If money was sent, call 1930 within 24 hours and file a complaint at cybercrime.gov.in.", urgency: "warn" },
  ],
    { title: "Do not enter credentials", description: "Close the page immediately. Do not submit anything.", urgency: "critical" },
    { title: "Verify the URL", description: "Compare the domain character-by-character with the real brand's site.", urgency: "warn" },
    { title: "Report the link", description: "Report it to Google Safe Browsing and to the brand being impersonated.", urgency: "info" },
  ],
  safe: [
    { title: "No immediate risk detected", description: "The content does not match any known scam patterns.", urgency: "info" },
    { title: "Continue exercising caution", description: "Still verify the sender directly if the message asks for money, credentials or personal details.", urgency: "info" },
    { title: "When in doubt, ask again", description: "You can always run another investigation on any suspicious follow-up.", urgency: "info" },
  ],
  suspicious: [
    { title: "Exercise caution", description: "A few signals stand out but there isn't enough to confirm a scam. Slow down before responding.", urgency: "warn" },
    { title: "Verify the sender", description: "Contact the person or organisation through an official channel you already trust.", urgency: "warn" },
    { title: "Do not share credentials", description: "Never share OTPs, PINs, passwords or card details based on this message alone.", urgency: "info" },
    { title: "Save the message", description: "Keep the original for reference in case the situation escalates.", urgency: "info" },
  ],
  possible_scam: [
    { title: "Verify before taking action", description: "Multiple scam-like signals are present. Confirm through a trusted, independent channel before doing anything.", urgency: "warn" },
    { title: "Do not send money", description: "Do not transfer funds, pay any 'fee' or click links until you have independently verified the request.", urgency: "critical" },
    { title: "Ask someone you trust", description: "Show the message to a family member, colleague or your bank before responding.", urgency: "warn" },
    { title: "Report if it escalates", description: "If pressure increases or money is requested, report at cybercrime.gov.in or 1930.", urgency: "info" },
  ],
};

export function generateRecommendations(category: ScamCategoryId): Recommendation[] {
  return RECS_BY_CATEGORY[category];
}

/* --- Scam DNA --- */

/** Base DNA profile per category — dynamically scaled by which indicators actually fired. */
const DNA_BASE: Record<ScamCategoryId, Record<string, number>> = {
  digital_arrest: { Authority: 100, Fear: 95, Urgency: 90, Financial: 80, Isolation: 100 },
  banking_kyc:    { Authority: 85,  Fear: 80, Urgency: 85, Financial: 80, Isolation: 40 },
  otp:            { Authority: 60,  Fear: 50, Urgency: 85, Financial: 90, Isolation: 30 },
  courier:        { Authority: 80,  Fear: 80, Urgency: 85, Financial: 80, Isolation: 60 },
  investment:     { Authority: 20,  Fear: 30, Urgency: 60, Financial: 100, Isolation: 10 },
  lottery:        { Authority: 60,  Fear: 30, Urgency: 85, Financial: 95, Isolation: 40 },
  upi:            { Authority: 65,  Fear: 55, Urgency: 80, Financial: 90, Isolation: 40 },
  job:            { Authority: 55,  Fear: 25, Urgency: 70, Financial: 75, Isolation: 60 },
  phishing:       { Authority: 80,  Fear: 60, Urgency: 75, Financial: 65, Isolation: 50 },
  suspicious:     { Authority: 25,  Fear: 20, Urgency: 35, Financial: 25, Isolation: 15 },
  possible_scam:  { Authority: 55,  Fear: 45, Urgency: 60, Financial: 55, Isolation: 35 },
  safe:           { Authority:  5,  Fear:  5, Urgency: 10, Financial:  5, Isolation:  5 },
};

const DNA_DESCRIPTIONS: Record<string, string> = {
  Authority: "Impersonates law enforcement, a bank or a trusted brand.",
  Fear: "Uses threats — arrest, account block, seized parcel — to override caution.",
  Urgency: "Demands action within minutes to prevent verification.",
  Financial: "Aims for a transfer, fee or credential to move money.",
  Isolation: "Instructs the target not to consult family, friends or the bank.",
};

const INDICATOR_TO_TRAITS: Record<IndicatorId, string[]> = {
  authority_impersonation: ["Authority"],
  threat: ["Fear"],
  urgency: ["Urgency"],
  financial_demand: ["Financial"],
  credential_request: ["Financial"],
  isolation: ["Isolation"],
  reward_promise: ["Financial", "Urgency"],
  kyc_hook: ["Authority", "Financial"],
  courier_pretext: ["Authority", "Fear"],
  investment_pitch: ["Financial"],
  job_pitch: ["Financial"],
  upi_trap: ["Financial"],
  fake_domain: ["Authority"],
  unknown_website: ["Authority"],
  grammar_errors: [],
};

export function generateScamDNA(
  category: ScamCategoryId,
  active: IndicatorId[],
): ScamDNATrait[] {
  const base = DNA_BASE[category];
  const boosts: Record<string, number> = { Authority: 0, Fear: 0, Urgency: 0, Financial: 0, Isolation: 0 };
  for (const id of active) {
    for (const trait of INDICATOR_TO_TRAITS[id]) boosts[trait] = (boosts[trait] ?? 0) + 6;
  }
  return Object.entries(base).map(([trait, baseScore]) => {
    const raw = category === "safe" ? baseScore : baseScore + (boosts[trait] ?? 0);
    return {
      trait,
      score: Math.max(0, Math.min(100, Math.round(raw))),
      description: DNA_DESCRIPTIONS[trait] ?? "",
    };
  });
}

/* =========================================================================
 * 7. Unified banding → InvestigationResult
 *
 * The score band is the SINGLE SOURCE OF TRUTH. It decides riskLevel,
 * scamCategory label, actionBadge, and (indirectly) the recommendation set
 * and DNA profile. Every UI component reads from this one object, so the
 * risk-score card, summary, DNA, recommendations and badge can never drift
 * out of sync.
 *
 *   0-20   → Safe        · "Safe / Legitimate"   · No Immediate Action Required
 *   21-40  → Low         · "Suspicious"          · Exercise Caution
 *   41-70  → Medium      · "Possible Scam"       · Verify Before Taking Action
 *   71-89  → High        · <Detected Scam Type>  · Do Not Respond
 *   90-100 → Critical    · <Detected Scam Type>  · Immediate Action Recommended
 * ========================================================================= */

interface BandDecision {
  riskLevel: RiskLevel;
  displayCategoryId: ScamCategoryId;
  displayCategoryLabel: string;
  actionBadge: ActionBadge;
}

function decideBand(score: number, detectedTypeId: ScamCategoryId): BandDecision {
  if (score <= 20) {
    return {
      riskLevel: "safe",
      displayCategoryId: "safe",
      displayCategoryLabel: CATEGORY_LABEL.safe,
      actionBadge: { label: "No Immediate Action Required", tone: "safe" },
    };
  }
  if (score <= 40) {
    return {
      riskLevel: "low",
      displayCategoryId: "suspicious",
      displayCategoryLabel: CATEGORY_LABEL.suspicious,
      actionBadge: { label: "Exercise Caution", tone: "caution" },
    };
  }
  if (score <= 70) {
    return {
      riskLevel: "medium",
      displayCategoryId: "possible_scam",
      displayCategoryLabel: CATEGORY_LABEL.possible_scam,
      actionBadge: { label: "Verify Before Taking Action", tone: "verify" },
    };
  }
  const typeId = detectedTypeId === "safe" ? "phishing" : detectedTypeId;
  if (score <= 89) {
    return {
      riskLevel: "high",
      displayCategoryId: typeId,
      displayCategoryLabel: CATEGORY_LABEL[typeId],
      actionBadge: { label: "Do Not Respond", tone: "warn" },
    };
  }
  return {
    riskLevel: "critical",
    displayCategoryId: typeId,
    displayCategoryLabel: CATEGORY_LABEL[typeId],
    actionBadge: { label: "Immediate Action Recommended", tone: "critical" },
  };
}

function computeConfidence(
  active: IndicatorId[],
  score: number,
  ctx: AnalysisContext,
): { confidence: number; reason: string } {
  if (active.length === 0) {
    return {
      confidence: 70,
      reason:
        "No scam indicators fired. Confidence is moderate because rule-based engines cannot see intent that isn't spelled out.",
    };
  }
  const distinctTypes = new Set(ctx.entities.map((e) => e.type)).size;
  const raw = 55 + active.length * 6 + distinctTypes * 3 + (score >= 80 ? 6 : 0);
  const confidence = Math.max(45, Math.min(99, raw));
  const reason = `${active.length} independent indicator${active.length === 1 ? "" : "s"} fired across ${distinctTypes} entity type${distinctTypes === 1 ? "" : "s"}. Deterministic rule matches leave little ambiguity in the verdict.`;
  return { confidence, reason };
}

function buildResult(text: string): InvestigationResult {
  const trimmed = text.trim();

  if (trimmed.length === 0) {
    const band = decideBand(0, "safe");
    return {
      riskScore: 0,
      riskLevel: band.riskLevel,
      scamCategory: band.displayCategoryLabel,
      categoryId: band.displayCategoryId,
      detectedTypeId: "safe",
      summary: generateSummary("safe", [], 0),
      evidence: [],
      scamDNA: generateScamDNA("safe", []),
      recommendations: generateRecommendations("safe"),
      actionBadge: band.actionBadge,
      confidence: 70,
      confidenceReason: "No content was provided to analyse.",
    };
  }

  const ctx = buildIndicators(text);
  const { score: rawScore, activeIndicators } = calculateRisk(ctx);
  const activeSet = new Set(activeIndicators);
  const detectedTypeId: ScamCategoryId =
    activeIndicators.length === 0 ? "safe" : classifyScam(activeSet, ctx);

  // Category-based score floor: once a specific scam pattern is cleanly
  // identified (its signature indicator combination fires), we're confident
  // enough to place the score in the "High" or "Critical" band rather than
  // leaving it in the mid range where the UI would still call it "Possible".
  const has = (id: IndicatorId) => activeSet.has(id);
  let floor = 0;
  switch (detectedTypeId) {
    case "digital_arrest":
      floor = has("authority_impersonation") && has("threat") ? 92 : 88;
      break;
    case "courier":
      floor = has("financial_demand") || has("threat") ? 90 : 82;
      break;
    case "banking_kyc":
      floor = has("kyc_hook") && (has("urgency") || has("threat") || has("unknown_website")) ? 90 : 82;
      break;
    case "otp":
      floor = has("credential_request") ? 90 : 78;
      break;
    case "investment":
      floor = has("investment_pitch") ? 88 : 78;
      break;
    case "lottery":
      floor = has("reward_promise") ? 88 : 78;
      break;
    case "job":
      floor = has("job_pitch") ? 85 : 76;
      break;
    case "upi":
      floor = has("upi_trap") ? 88 : 78;
      break;
    case "phishing":
      floor = has("fake_domain") ? 92 : has("unknown_website") ? 78 : 65;
      break;
  }

  let score: number;
  if (detectedTypeId === "safe") {
    score = Math.min(rawScore, 15);
  } else {
    score = Math.max(rawScore, floor);
    score = Math.min(100, score);
  }
  const band = decideBand(score, detectedTypeId);


  // Recommendations & DNA come from the banded id so cards stay consistent
  // with the headline verdict (e.g. a medium score shows "Possible Scam"
  // recommendations, never scam-type-specific ones that would contradict it).
  const recommendations = generateRecommendations(band.displayCategoryId);
  const scamDNA = generateScamDNA(band.displayCategoryId, activeIndicators);
  const summary = generateSummary(band.displayCategoryId, activeIndicators, score);
  const evidence = generateEvidence(ctx);
  const { confidence, reason } = computeConfidence(activeIndicators, score, ctx);

  return {
    riskScore: score,
    riskLevel: band.riskLevel,
    scamCategory: band.displayCategoryLabel,
    categoryId: band.displayCategoryId,
    detectedTypeId,
    summary,
    evidence,
    scamDNA,
    recommendations,
    actionBadge: band.actionBadge,
    confidence,
    confidenceReason: reason,
  };
}

// Backwards-compatible alias.
export const buildReport = buildResult;


/* =========================================================================
 * 8. Public analyzers (swap points for a future real model)
 * ========================================================================= */

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function analyzeText(input: string, _type: InvestigationType = "sms") {
  await delay(900);
  return buildReport(input);
}

export async function analyzeImage(file: File | string) {
  await delay(1100);
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

/* =========================================================================
 * 9. Chat follow-ups
 * ========================================================================= */

const FOLLOW_UPS: Record<ScamCategoryId, string[]> = {
  digital_arrest: [
    "Did they ask you to stay on the call and not talk to anyone?",
    "Did they show a fake ID card or arrest warrant on video?",
    "Did they mention a 'security deposit' or 'refundable fee'?",
  ],
  banking_kyc: [
    "Did they ask you to click a link to 'update KYC'?",
    "Did they ask for your debit card number or CVV?",
    "Did they claim your account will be blocked within 24 hours?",
  ],
  otp: [
    "Did they ask you to read out an OTP you received?",
    "Did they claim they'd 'refund' or 'verify' by sending you a code first?",
    "Did they call from a number that looked like your bank?",
  ],
  courier: [
    "Did the caller transfer you to a 'police officer' or 'CBI officer'?",
    "Did they claim your Aadhaar was found on an illegal package?",
    "Did they ask you to pay a customs fee to release the parcel?",
  ],
  investment: [
    "Did they promise guaranteed or fixed returns?",
    "Did they ask you to deposit into a personal account or crypto wallet?",
    "Were you added to a WhatsApp or Telegram group without asking?",
  ],
  lottery: [
    "Did they ask for a 'processing fee' before releasing the prize?",
    "Did they ask you to keep the win confidential?",
    "Did they ask for your Aadhaar or bank details to 'verify identity'?",
  ],
  upi: [
    "Did they send you a 'collect request' asking you to enter your UPI PIN?",
    "Did they claim they'd refund extra money by mistake?",
    "Did they send a payment link outside the UPI app?",
  ],
  job: [
    "Did they ask you to deposit money to 'unlock' higher earnings?",
    "Did they move the conversation to Telegram or WhatsApp?",
    "Did they show fake payment screenshots as proof?",
  ],
  phishing: [
    "Did the link ask you to log in with your bank or email password?",
    "Was the domain slightly different from the real brand (e.g. missing/extra letter)?",
    "Did you already enter any credentials on the page?",
  ],
  suspicious: [
    "What made this message feel off to you?",
    "Have you received similar messages from this sender before?",
    "Would you like me to check a related message or link?",
  ],
  possible_scam: [
    "Did the message ask you to share personal or financial details?",
    "Did they create urgency or pressure you to act quickly?",
    "Have you tried contacting the organisation through its official channel?",
  ],
  safe: [
    "Would you like me to check a different message from the same sender?",
    "Do you have any other suspicious content you'd like me to review?",
    "Would you like tips for spotting scams in the future?",
  ],
};

export function getFollowUpQuestions(categoryId: ScamCategoryId): string[] {
  return FOLLOW_UPS[categoryId] ?? FOLLOW_UPS.safe;
}

export function getIntroMessage(categoryId: ScamCategoryId, category: string): string {
  if (categoryId === "safe") {
    return "I've completed your investigation. No scam patterns matched, but I'm here if you want a second opinion on anything else.";
  }
  if (categoryId === "suspicious") {
    return "I've completed your investigation. A few things look off, but it's not conclusive. Ask me anything and I'll help you decide the next step.";
  }
  if (categoryId === "possible_scam") {
    return "I've completed your investigation. Several scam-like signals are present — verify before you act. Ask me anything about this case.";
  }
  return `I've completed your investigation — this content matches the ${category} pattern. Ask me anything about it, or share related suspicious activity you've seen.`;
}
