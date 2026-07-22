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


type Sample = {
  name: string;
  message: string;
  type: InvestigationType;
  legit: boolean;
};

type SampleCategory = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  samples: Sample[];
};

const SAMPLE_CATEGORIES: SampleCategory[] = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: MessageCircle,
    description: "Chats forwarded from contacts and unknown numbers",
    samples: [
      {
        name: "Family Emergency",
        type: "whatsapp",
        legit: false,
        message:
          "Hi beta, this is uncle. I lost my phone and I'm using a friend's number. I'm stuck at the airport and need ₹35,000 urgently for a medical emergency. Please transfer to this UPI: help@paytm. I'll return it tomorrow morning. Don't call, phone is off.",
      },
      {
        name: "Investment Opportunity",
        type: "whatsapp",
        legit: false,
        message:
          "Namaste! I'm Anjali from Motilal Premium Advisory (SEBI Reg: INH000012345). Our VIP group gave 42% profit yesterday. Guaranteed 30% monthly returns. Join our Telegram by paying ₹9,999 lifetime membership. First 10 members get free intraday tips worth ₹50,000.",
      },
      {
        name: "Job Offer",
        type: "whatsapp",
        legit: false,
        message:
          "Congratulations! You have been shortlisted for a Work From Home data entry role at Amazon India. Salary ₹45,000/month. Pay ₹2,500 refundable registration fee to activate your login credentials. Send screenshot after payment to receive offer letter.",
      },
      {
        name: "Prize Notification",
        type: "whatsapp",
        legit: false,
        message:
          "Congratulations!!! Your WhatsApp number has won ₹25,00,000 in the KBC Jio Lucky Draw 2026. Lottery No: KBC8956. Pay a refundable processing fee of ₹8,500 to claim. Do not tell anyone or prize will be cancelled.",
      },
      {
        name: "Group Invite",
        type: "whatsapp",
        legit: true,
        message:
          "Hey! Adding you to our society Diwali planning group. We're collecting ₹500 per flat for decorations — please pay to the treasurer directly whenever convenient. No rush.",
      },
      {
        name: "Meeting Reminder",
        type: "whatsapp",
        legit: true,
        message:
          "Reminder: our book club meets this Saturday at 6pm at Priya's place. Bringing snacks would be lovely but not required. See you all there!",
      },
    ],
  },
  {
    id: "sms",
    label: "SMS",
    icon: MessageSquare,
    description: "Short text messages from shortcodes and unknown senders",
    samples: [
      {
        name: "Account Notice",
        type: "sms",
        legit: false,
        message:
          "Dear Customer, your SBI account will be blocked in 30 minutes due to KYC failure. To keep it active, share the 6-digit OTP just sent to your mobile. This is only for verification.",
      },
      {
        name: "Payment Request",
        type: "sms",
        legit: false,
        message:
          "Hi, I want to buy your bike listed on OLX. I am transferring ₹45,000 now. Please accept the request on your UPI app and enter your PIN to receive the payment. I'm an Army officer posted in Kashmir, cannot call.",
      },
      {
        name: "Parcel Update",
        type: "sms",
        legit: false,
        message:
          "This is FedEx Customer Care. A parcel booked in your name from Mumbai to Taiwan has been intercepted by NCB. It contains 4 passports and 200g MDMA. Press 1 to connect with the investigating officer or you will be arrested within 2 hours.",
      },
      {
        name: "OTP Message",
        type: "sms",
        legit: true,
        message:
          "Dear Customer, 4271 is your OTP for logging in to HDFC Bank NetBanking. Valid for 5 minutes. Do NOT share this OTP with anyone, including bank staff. - HDFC Bank",
      },
      {
        name: "Appointment Reminder",
        type: "sms",
        legit: true,
        message:
          "Reminder: your appointment with Dr. Mehta at Apollo Clinic is confirmed for tomorrow 11:00 AM. Please arrive 10 minutes early. Reply CANCEL to reschedule.",
      },
      {
        name: "Delivery Confirmation",
        type: "sms",
        legit: true,
        message:
          "Your Amazon package will arrive tomorrow between 10 AM and 2 PM. Track your order in the Amazon app. No action required.",
      },
    ],
  },
  {
    id: "email",
    label: "Email",
    icon: Mail,
    description: "Emails from businesses, HR teams and unknown senders",
    samples: [
      {
        name: "Password Reset",
        type: "email",
        legit: false,
        message:
          "Dear user, unusual activity was detected on your Microsoft 365 account. Your access will be suspended within 24 hours. Click here to verify your identity and reset your password immediately: http://ms-verify-account.top/login",
      },
      {
        name: "Invoice",
        type: "email",
        legit: false,
        message:
          "Attached is your invoice INV-88213 for ₹78,540. Payment is overdue. Kindly transfer to the updated bank account below to avoid legal action. Do not use the previously shared account — it has been closed.",
      },
      {
        name: "HR Recruitment",
        type: "email",
        legit: false,
        message:
          "Congratulations! You have been selected for a Senior Analyst role at TCS with CTC of ₹18 LPA. To confirm your seat, pay a refundable ₹4,999 background verification fee to the HR account below within 24 hours. Offer letter will follow.",
      },
      {
        name: "Tax Refund",
        type: "email",
        legit: false,
        message:
          "Income Tax Department: You are eligible for a refund of ₹28,450. To receive the amount, verify your bank details and PAN by clicking the secure link below. Failure to respond will result in cancellation of refund.",
      },
      {
        name: "Newsletter",
        type: "email",
        legit: true,
        message:
          "Hi there, here's our weekly product digest — a summary of new releases, engineering deep-dives and upcoming webinars. Unsubscribe anytime using the link at the bottom.",
      },
      {
        name: "Order Receipt",
        type: "email",
        legit: true,
        message:
          "Thanks for your order! Your Zomato order #A9821 has been placed successfully. Estimated delivery: 32 minutes. You can track it live in the app.",
      },
    ],
  },
  {
    id: "transcript",
    label: "Phone Call Transcript",
    icon: PhoneCall,
    description: "Transcribed voice calls from unknown callers",
    samples: [
      {
        name: "Customer Support",
        type: "transcript",
        legit: false,
        message:
          "Hello sir, I am calling from Amazon customer support. A suspicious order worth ₹58,000 was placed from your account. To cancel it, please install AnyDesk on your phone and share the 9-digit code with me so we can verify from our side.",
      },
      {
        name: "Bank Executive",
        type: "transcript",
        legit: false,
        message:
          "Sir, main HDFC head office se bol raha hoon. Aapka credit card block hone wala hai kyunki KYC pending hai. Reactivate karne ke liye card number, CVV aur OTP batayein — call disconnect mat karna.",
      },
      {
        name: "Government Officer",
        type: "transcript",
        legit: false,
        message:
          "This is Inspector Rakesh Kumar from CBI Mumbai. Your Aadhaar has been linked to a money laundering case worth ₹42 lakhs. An arrest warrant is issued. Stay on this video call and transfer ₹85,000 to the RBI verification account within 2 hours.",
      },
      {
        name: "Insurance Agent",
        type: "transcript",
        legit: false,
        message:
          "Sir, your LIC policy has lapsed and ₹6,80,000 bonus is stuck. Pay a ₹12,000 processing charge to the account I share, and we will release the entire amount within 48 hours to your registered bank.",
      },
      {
        name: "Salon Booking",
        type: "transcript",
        legit: true,
        message:
          "Hi, this is Lakme Salon Bandra confirming your haircut appointment for Saturday at 4 PM with stylist Neha. Please reach 10 minutes early. Reply or call back if you need to reschedule.",
      },
    ],
  },
  {
    id: "banking",
    label: "Banking",
    icon: Landmark,
    description: "Alerts and requests that appear to come from your bank",
    samples: [
      {
        name: "OTP Verification",
        type: "sms",
        legit: false,
        message:
          "SBI Alert: Your net banking will be deactivated in 15 minutes. To keep it active, share the OTP just sent to your registered mobile with our executive. This is a one-time verification.",
      },
      {
        name: "Transaction Alert",
        type: "sms",
        legit: false,
        message:
          "Dear Customer, a debit of ₹49,999 was attempted on your ICICI account. If not done by you, call 8845-XXX-221 immediately and confirm your card details to reverse the transaction.",
      },
      {
        name: "Account Update",
        type: "email",
        legit: false,
        message:
          "Your Axis Bank account has been temporarily restricted due to incomplete profile. Update your details within 24 hours using the secure portal below to restore full access: http://axis-verify-profile.xyz",
      },
      {
        name: "KYC Reminder",
        type: "sms",
        legit: false,
        message:
          "Dear Customer, your KYC is pending. Your Kotak account will be suspended today. Complete KYC by clicking the link: http://kyc-update-kotak.top and enter your Debit Card and OTP to verify.",
      },
      {
        name: "Statement Ready",
        type: "email",
        legit: true,
        message:
          "Your monthly account statement for October is now available in the HDFC Bank app. No action is required. Log in through the app or website to view or download the statement.",
      },
    ],
  },
  {
    id: "delivery",
    label: "Delivery",
    icon: Package,
    description: "Notifications about parcels, shipments and couriers",
    samples: [
      {
        name: "Package Update",
        type: "sms",
        legit: false,
        message:
          "India Post: Your parcel could not be delivered due to incomplete address. Update your address and pay a ₹25 redelivery fee within 12 hours here: http://indiapost-redeliver.xyz",
      },
      {
        name: "Customs Notification",
        type: "email",
        legit: false,
        message:
          "DHL Customs: A parcel addressed to you is held at Mumbai customs. Illegal contents were suspected. Contact our officer immediately at +91-9812XXXXXX and pay a ₹15,000 clearance fee to release it.",
      },
      {
        name: "Tracking Status",
        type: "sms",
        legit: true,
        message:
          "Your Flipkart order OD1234567 has been shipped via Ekart and will arrive by Thursday. Track live in the Flipkart app. No action required.",
      },
      {
        name: "Delivery Rescheduled",
        type: "sms",
        legit: true,
        message:
          "Hi, your Blue Dart shipment has been rescheduled to tomorrow between 11 AM and 3 PM as no one was available at the address. No fee is required.",
      },
    ],
  },
  {
    id: "government",
    label: "Government Notice",
    icon: FileText,
    description: "Messages that look like they come from a government body",
    samples: [
      {
        name: "Aadhaar Update",
        type: "sms",
        legit: false,
        message:
          "UIDAI Notice: Your Aadhaar will be suspended in 6 hours as biometric update is pending. Update immediately: http://uidai-verify.top and share the OTP with the officer to complete verification.",
      },
      {
        name: "Traffic Challan",
        type: "sms",
        legit: false,
        message:
          "Traffic Police: An e-challan of ₹5,000 is pending against your vehicle MH01XX1234. To avoid court summons, pay within 3 hours via this secure link: http://echallan-mha.xyz",
      },
      {
        name: "Electricity Disconnection",
        type: "sms",
        legit: false,
        message:
          "Dear Consumer, your electricity connection will be disconnected tonight at 9:30 PM as your previous bill was not updated. Contact our officer at 7042-XXX-118 immediately to avoid disconnection.",
      },
      {
        name: "Court Summons",
        type: "email",
        legit: false,
        message:
          "This is an official notice from the Cyber Crime Cell. A case has been registered against your PAN for illegal transactions. Attend the video hearing on Skype today at 3 PM or an arrest warrant will be issued.",
      },
      {
        name: "Passport Appointment",
        type: "email",
        legit: true,
        message:
          "Your Passport Seva appointment at PSK Lower Parel is confirmed for 12 November, 10:30 AM. Carry the original documents listed in your application checklist.",
      },
    ],
  },
];

const ALL_SAMPLES: Sample[] = SAMPLE_CATEGORIES.flatMap((c) => c.samples);

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
  const [openCategory, setOpenCategory] = useState<SampleCategory | null>(null);

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

  const pickSample = (sample: Sample) => {
    setSelected(sample.type);
    setContent(sample.message);
    setFile(null);
    setOpenCategory(null);
    if (typeof window !== "undefined") {
      requestAnimationFrame(() => {
        document
          .getElementById("investigation-input")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  };

  const pickRandom = (pool: Sample[]) => {
    if (pool.length === 0) return;
    const s = pool[Math.floor(Math.random() * pool.length)];
    pickSample(s);
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
