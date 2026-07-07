/**
 * Sentinel AI — Investigation Service
 *
 * These are placeholder functions returning realistic mock data.
 * Wire real AI providers (Lovable AI Gateway, OpenAI, etc.) inside each fn later
 * without changing call sites.
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

export interface InvestigationReport {
  riskScore: number;
  riskLevel: RiskLevel;
  scamCategory: string;
  summary: string;
  evidence: EvidenceItem[];
  scamDNA: ScamDNATrait[];
  recommendations: Recommendation[];
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 85) return "critical";
  if (score >= 65) return "high";
  if (score >= 40) return "medium";
  if (score >= 20) return "low";
  return "safe";
}

function mockReport(_input: string, type: InvestigationType): InvestigationReport {
  const categoryByType: Record<InvestigationType, string> = {
    sms: "Digital Arrest Scam",
    whatsapp: "Investment Fraud",
    email: "Phishing / Impersonation",
    url: "Fake E-commerce Site",
    transcript: "Vishing (Voice Phishing)",
    image: "KYC Screenshot Scam",
  };

  return {
    riskScore: 96,
    riskLevel: "critical",
    scamCategory: categoryByType[type],
    summary:
      "The content displays multiple hallmarks of a coordinated impersonation scam. It references government authority, injects extreme urgency, and pushes the target toward immediate financial action while discouraging outside verification. This pattern is consistent with organized 'Digital Arrest' operations targeting citizens through unverifiable channels.",
    evidence: [
      {
        phrase: "Aadhaar",
        reason: "Government identity referenced to establish false authority.",
        severity: "high",
      },
      {
        phrase: "Immediate Payment",
        reason: "Creates urgency to bypass rational decision-making.",
        severity: "high",
      },
      {
        phrase: "Legal Action",
        reason: "Fear-based manipulation to force compliance.",
        severity: "high",
      },
      {
        phrase: "Do not disconnect",
        reason: "Isolation tactic to prevent the target from consulting family or authorities.",
        severity: "medium",
      },
      {
        phrase: "OTP verification",
        reason: "Attempts to harvest authentication codes for account takeover.",
        severity: "high",
      },
    ],
    scamDNA: [
      {
        trait: "Authority Impersonation",
        score: 95,
        description: "Impersonates law enforcement or government agencies.",
      },
      {
        trait: "Fear Tactics",
        score: 92,
        description: "Threats of arrest, penalties, or reputational damage.",
      },
      {
        trait: "Urgency",
        score: 90,
        description: "Demands action within minutes to prevent reflection.",
      },
      {
        trait: "Financial Demand",
        score: 88,
        description: "Requests transfers, OTPs, or account credentials.",
      },
      {
        trait: "Isolation",
        score: 84,
        description: "Instructs the target to stay on the call and not consult anyone.",
      },
      {
        trait: "Psychological Manipulation",
        score: 91,
        description: "Combines shame, fear and authority to override caution.",
      },
    ],
    recommendations: [
      {
        title: "Do NOT send money",
        description:
          "Legitimate agencies never demand instant payment over messages or calls.",
        urgency: "critical",
      },
      {
        title: "Never share OTPs",
        description: "One-time passwords give complete access to your accounts.",
        urgency: "critical",
      },
      {
        title: "Block the sender",
        description: "Cut off contact immediately. Do not reply, even to warn them.",
        urgency: "warn",
      },
      {
        title: "Report the incident",
        description:
          "File a complaint at cybercrime.gov.in or call your local cybercrime helpline.",
        urgency: "warn",
      },
      {
        title: "Contact your bank",
        description: "If money was transferred, request a fraud freeze within 24 hours.",
        urgency: "info",
      },
    ],
  };
}

/* ---------- Placeholder analyzers ---------- */

export async function analyzeText(input: string, type: InvestigationType = "sms") {
  await delay(1200);
  return mockReport(input, type);
}

export async function analyzeImage(_file: File | string) {
  await delay(1400);
  return mockReport("", "image");
}

export async function analyzeWebsite(url: string) {
  await delay(1200);
  return mockReport(url, "url");
}

export async function analyzeTranscript(text: string) {
  await delay(1200);
  return mockReport(text, "transcript");
}

export function generateRiskScore(): { score: number; level: RiskLevel } {
  const score = 96;
  return { score, level: riskLevelFromScore(score) };
}

export function generateRecommendations(): Recommendation[] {
  return mockReport("", "sms").recommendations;
}

export function generateSummary(): string {
  return mockReport("", "sms").summary;
}
