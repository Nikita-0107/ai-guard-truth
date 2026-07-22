import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  MessageSquare,
  MessageCircle,
  Mail,
  Link2,
  PhoneCall,
  ImageIcon,
  Loader2,
  ArrowRight,
  Upload,
  ShieldCheck,
  Sparkles,
  Dna,
  Brain,
  ListChecks,
  Check,
  Landmark,
  Package,
  FileText,
  Dice5,
  Shuffle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { analyzeText, type InvestigationType } from "@/lib/investigation-service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TYPES: { id: InvestigationType; label: string; icon: React.ComponentType<{ className?: string }>; placeholder: string }[] = [
  { id: "sms", label: "SMS", icon: MessageSquare, placeholder: "Paste any suspicious SMS, WhatsApp message, email, or call transcript for AI-powered fraud investigation..." },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, placeholder: "Paste any suspicious SMS, WhatsApp message, email, or call transcript for AI-powered fraud investigation..." },
  { id: "email", label: "Email", icon: Mail, placeholder: "Paste any suspicious SMS, WhatsApp message, email, or call transcript for AI-powered fraud investigation..." },
  { id: "url", label: "Website URL", icon: Link2, placeholder: "https://suspicious-site.com" },
  { id: "transcript", label: "Call Transcript", icon: PhoneCall, placeholder: "Paste any suspicious SMS, WhatsApp message, email, or call transcript for AI-powered fraud investigation..." },
  { id: "image", label: "Screenshot", icon: ImageIcon, placeholder: "" },
];

const FEATURE_BADGES = [
  { icon: ShieldCheck, label: "Detects Multiple Scam Categories" },
  { icon: Sparkles, label: "AI Risk Scoring" },
  { icon: Dna, label: "Scam DNA Analysis" },
  { icon: Brain, label: "Explainable AI Reasoning" },
  { icon: ListChecks, label: "Actionable Recommendations" },
];

type Example = {
  id: string;
  emoji: string;
  label: string;
  tone: string;
  preview: string;
  message: string;
  type: InvestigationType;
};

const EXAMPLES: Example[] = [
  {
    id: "digital-arrest",
    emoji: "🚨",
    label: "Digital Arrest",
    tone: "from-red-500/20 to-orange-500/10 border-red-500/30",
    preview: "CBI officer claims your Aadhaar is linked to a money-laundering case…",
    message:
      "This is Inspector Rakesh Kumar from CBI Mumbai. Your Aadhaar number has been linked to a serious money laundering case worth ₹42 lakhs. An arrest warrant has been issued against you. Stay on this video call — do not disconnect or contact anyone. To avoid immediate arrest you must transfer ₹85,000 to the RBI verification account within the next 2 hours for identity verification.",
    type: "sms",
  },
  {
    id: "otp-scam",
    emoji: "🔐",
    label: "OTP Scam",
    tone: "from-amber-500/20 to-yellow-500/10 border-amber-500/30",
    preview: "Bank agent asking you to share the OTP to 'verify' your account…",
    message:
      "Hello sir, I am calling from SBI Bank head office. Your account will be blocked in 30 minutes due to KYC failure. To keep it active, please share the 6-digit OTP you just received on your registered mobile number. This is only for verification, we will never misuse it.",
    type: "sms",
  },
  {
    id: "upi-fraud",
    emoji: "💳",
    label: "UPI Fraud",
    tone: "from-fuchsia-500/20 to-pink-500/10 border-fuchsia-500/30",
    preview: "Fake buyer sends a UPI 'request money' link disguised as payment…",
    message:
      "Hi, I want to buy your bike listed on OLX. I am transferring ₹45,000 now. Please accept the request on your UPI app and enter your PIN to receive the payment. I am an Army officer posted in Kashmir, cannot call. Approve fast, I have to travel.",
    type: "sms",
  },
  {
    id: "courier-scam",
    emoji: "📦",
    label: "Courier Scam",
    tone: "from-orange-500/20 to-red-500/10 border-orange-500/30",
    preview: "FedEx caller claims illegal contents were found in your parcel…",
    message:
      "This is FedEx Customer Care. A parcel booked in your name from Mumbai to Taiwan has been intercepted by Narcotics Control Bureau. It contains 4 passports, 3 credit cards and 200g of MDMA. Press 1 to connect with the investigating officer or you will be arrested within 2 hours.",
    type: "sms",
  },
  {
    id: "investment-scam",
    emoji: "📈",
    label: "Investment Scam",
    tone: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30",
    preview: "Guaranteed 30% monthly returns from a 'SEBI-registered' expert…",
    message:
      "Congratulations! You have been selected for our VIP stock tips group by Mrs. Anjali Sharma (SEBI Reg: INH000012345). Guaranteed 30% monthly returns. Yesterday's call gave 42% profit. Join our premium Telegram group by paying ₹9,999 membership. First 10 members get free intraday tips worth ₹50,000.",
    type: "sms",
  },
  {
    id: "lottery-scam",
    emoji: "🎁",
    label: "Lottery Scam",
    tone: "from-violet-500/20 to-purple-500/10 border-violet-500/30",
    preview: "You've 'won' a KBC lottery of ₹25 lakhs — pay processing fee…",
    message:
      "Congratulations!!! Your mobile number has won ₹25,00,000 in the KBC Jio Lucky Draw 2026. Lottery Number: KBC8956. To claim your prize, pay a refundable processing fee of ₹8,500 to the account below and send a screenshot to this WhatsApp number. Do not tell anyone or your prize will be cancelled.",
    type: "sms",
  },
  {
    id: "safe-message",
    emoji: "🟢",
    label: "Safe Message",
    tone: "from-emerald-500/20 to-green-500/10 border-emerald-500/30",
    preview: "A genuine OTP notification from your bank — no action required…",
    message:
      "Dear Customer, 4271 is your OTP for logging in to HDFC Bank NetBanking. Valid for 5 minutes. Do NOT share this OTP with anyone, including bank staff. - HDFC Bank",
    type: "sms",
  },
];

const LOADING_STEPS = [
  "Extracting entities...",
  "Identifying scam patterns...",
  "Checking fraud indicators...",
  "Calculating risk score...",
  "Generating investigation report...",
];

export function UploadPanel() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<InvestigationType>("sms");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  const current = TYPES.find((t) => t.id === selected)!;

  useEffect(() => {
    if (!submitting) {
      setLoadingStep(0);
      return;
    }
    const id = setInterval(() => {
      setLoadingStep((s) => (s + 1) % LOADING_STEPS.length);
    }, 550);
    return () => clearInterval(id);
  }, [submitting]);

  const pickExample = (ex: Example) => {
    setSelected(ex.type);
    setContent(ex.message);
    setFile(null);
    if (typeof window !== "undefined") {
      requestAnimationFrame(() => {
        document
          .getElementById("investigation-input")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  };

  const handleSubmit = async () => {
    if (selected === "image" && !file) {
      toast.error("Please upload a screenshot");
      return;
    }
    if (selected !== "image" && content.trim().length < 3) {
      toast.error("Please add content to investigate");
      return;
    }
    setSubmitting(true);
    const started = Date.now();
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Not signed in");

      let attachmentUrl: string | null = null;
      if (file) {
        const path = `${userId}/${Date.now()}-${file.name}`;
        const { error: uploadErr } = await supabase.storage
          .from("investigation-uploads")
          .upload(path, file);
        if (uploadErr) throw uploadErr;
        attachmentUrl = path;
      }

      const { data: investigation, error: invErr } = await supabase
        .from("investigations")
        .insert({
          user_id: userId,
          investigation_type: selected,
          title: content.slice(0, 80) || file?.name || `${current.label} investigation`,
          content: content || null,
          attachment_url: attachmentUrl,
          status: "processing",
        })
        .select()
        .single();
      if (invErr) throw invErr;

      const report = await analyzeText(content, selected);

      const { error: resErr } = await supabase.from("investigation_results").insert({
        investigation_id: investigation.id,
        user_id: userId,
        risk_score: report.riskScore,
        risk_level: report.riskLevel,
        scam_category: report.scamCategory,
        summary: report.summary,
        evidence: report.evidence as unknown as never,
        scam_dna: report.scamDNA as unknown as never,
        recommendations: report.recommendations as unknown as never,
        raw_report: report as unknown as never,
      });
      if (resErr) throw resErr;

      await supabase
        .from("investigations")
        .update({ status: "completed" })
        .eq("id", investigation.id);

      // Ensure the professional loading sequence plays for ~2.5s minimum
      const elapsed = Date.now() - started;
      const min = 2500;
      if (elapsed < min) await new Promise((r) => setTimeout(r, min - elapsed));

      navigate({ to: "/investigation/$id", params: { id: investigation.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Investigation failed");
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="glass-strong rounded-3xl p-6 shadow-elegant animate-fade-up">
        {/* Feature badges */}
        <div className="mb-5 flex flex-wrap gap-2">
          {FEATURE_BADGES.map((b) => (
            <span
              key={b.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-brand/25 bg-brand/10 px-3 py-1 text-[11px] font-medium text-brand"
            >
              <Check className="h-3 w-3" />
              {b.label}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {TYPES.map((t) => {
            const active = selected === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelected(t.id)}
                className={cn(
                  "group flex flex-col items-center gap-2 rounded-xl border p-4 transition-all",
                  active
                    ? "border-brand/50 bg-gradient-brand-soft ring-glow"
                    : "border-border/60 bg-muted/20 hover:bg-muted/40 hover:border-border",
                )}
              >
                <t.icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    active ? "text-brand" : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                <span
                  className={cn(
                    "text-xs font-medium",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>

        <div id="investigation-input" className="mt-6 relative">
          {selected === "image" ? (
            <label className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border/60 bg-muted/10 p-8 text-center transition-colors hover:bg-muted/20">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-brand-soft border border-border/60">
                <Upload className="h-5 w-5 text-brand" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {file ? file.name : "Drop a screenshot here"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, WEBP · up to 5MB</p>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          ) : selected === "url" ? (
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={current.placeholder}
              className="h-14 rounded-xl bg-muted/30 border-border/60 text-base"
            />
          ) : (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={current.placeholder}
              rows={7}
              className="rounded-xl bg-muted/30 border-border/60 text-base resize-none"
            />
          )}

          {submitting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl bg-background/80 backdrop-blur-md animate-fade-in">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-brand/20" />
                <div className="relative grid h-14 w-14 place-items-center rounded-full bg-gradient-brand shadow-glow">
                  <Loader2 className="h-6 w-6 animate-spin text-primary-foreground" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold gradient-text">Sentinel AI is investigating</p>
                <p
                  key={loadingStep}
                  className="mt-1 text-sm text-muted-foreground animate-fade-in"
                >
                  {LOADING_STEPS[loadingStep]}
                </p>
              </div>
              <div className="flex gap-1.5">
                {LOADING_STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1.5 w-6 rounded-full transition-colors",
                      i <= loadingStep ? "bg-brand" : "bg-border/60",
                    )}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Sentinel will scan for threat patterns, generate a risk score, and explain its verdict.
          </p>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-gradient-brand text-primary-foreground shadow-glow hover:opacity-90 h-11 px-6"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Investigating…
              </>
            ) : (
              <>
                Investigate <ArrowRight className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Try an Example */}
      <section className="animate-fade-up">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold">Try an Example</h2>
            <p className="text-sm text-muted-foreground">
              Click any card to auto-fill a realistic sample message.
            </p>
          </div>
          <span className="hidden text-xs text-muted-foreground sm:block">
            Curated from real-world scam patterns
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.id}
              onClick={() => pickExample(ex)}
              className={cn(
                "group text-left rounded-2xl border bg-gradient-to-br p-4 transition-all hover:-translate-y-0.5 hover:shadow-elegant",
                ex.tone,
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl leading-none">{ex.emoji}</span>
                <span className="text-sm font-semibold">{ex.label}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{ex.preview}</p>
              <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-brand opacity-0 transition-opacity group-hover:opacity-100">
                Use this example <ArrowRight className="h-3 w-3" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Recent Example Investigations (compact list) */}
      <section className="animate-fade-up">
        <div className="mb-3">
          <h2 className="text-lg font-semibold">Recent Example Investigations</h2>
          <p className="text-sm text-muted-foreground">
            Quick-load any of these into the investigator.
          </p>
        </div>

        <div className="glass rounded-2xl divide-y divide-border/40 overflow-hidden">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.id}
              onClick={() => pickExample(ex)}
              className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
            >
              <span className="text-base leading-none">{ex.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{ex.label}</span>
                  <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    Sample
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground">{ex.preview}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
