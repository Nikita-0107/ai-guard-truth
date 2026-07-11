import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ShieldAlert,
  ArrowLeft,
  AlertTriangle,
  Info,
  CheckCircle2,
  Sparkles,
  Send,
  Bot,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import type {
  EvidenceItem,
  Recommendation,
  RiskLevel,
  ScamDNATrait,
  ScamCategoryId,
} from "@/lib/investigation-service";
import { getFollowUpQuestions, getIntroMessage } from "@/lib/investigation-service";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/investigation/$id")({
  component: ReportPage,
});

interface Report {
  id: string;
  risk_score: number;
  risk_level: RiskLevel;
  scam_category: string | null;
  summary: string | null;
  evidence: EvidenceItem[];
  scam_dna: ScamDNATrait[];
  recommendations: Recommendation[];
  investigation: {
    investigation_type: string;
    content: string | null;
    created_at: string;
  } | null;
}

function ReportPage() {
  const { id } = Route.useParams();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("investigation_results")
        .select("*, investigation:investigations(investigation_type, content, created_at)")
        .eq("investigation_id", id)
        .maybeSingle();
      if (error || !data) {
        setLoading(false);
        throw notFound();
      }
      setReport(data as unknown as Report);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <ReportSkeleton />;
  if (!report) return null;

  const level = report.risk_level;
  const scoreGradient =
    level === "critical" || level === "high"
      ? "bg-gradient-danger"
      : level === "medium"
        ? "bg-gradient-warning"
        : "bg-gradient-success";

  return (
    <div className="min-h-screen bg-background bg-gradient-hero">
      <header className="sticky top-0 z-10 border-b border-border/40 bg-background/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 sm:px-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="ml-auto text-xs text-muted-foreground">
            Investigation ·{" "}
            <span className="text-foreground">{report.investigation?.investigation_type}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 space-y-8">
        {/* Risk Score Card */}
        <section className="animate-fade-up glass-strong rounded-3xl p-8 shadow-elegant">
          <div className="grid gap-8 sm:grid-cols-[auto_1fr] items-center">
            <div
              className={cn(
                "relative grid h-40 w-40 place-items-center rounded-full text-primary-foreground shadow-glow",
                scoreGradient,
              )}
            >
              <div className="absolute inset-1 rounded-full bg-background/85 grid place-items-center">
                <div className="text-center">
                  <p className="text-5xl font-bold gradient-text">{report.risk_score}%</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Risk Score
                  </p>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-destructive" />
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  Risk Level
                </span>
              </div>
              <p className="mt-1 text-3xl font-bold capitalize">{level}</p>
              <div className="mt-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Scam Category
                </p>
                <p className="mt-1 text-xl font-semibold">{report.scam_category}</p>
              </div>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-destructive/10 border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" />
                Immediate action recommended
              </div>
            </div>
          </div>
        </section>

        {/* Summary */}
        <Section title="Investigation Summary" icon={Sparkles}>
          <p className="text-[15px] leading-relaxed text-foreground/90">{report.summary}</p>
        </Section>

        {/* Evidence */}
        <Section title="Evidence Found">
          <div className="grid gap-3 sm:grid-cols-2">
            {report.evidence.map((e) => (
              <div
                key={e.phrase}
                className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">
                    {e.severity}
                  </span>
                  <p className="font-semibold text-destructive">"{e.phrase}"</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{e.reason}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Scam DNA */}
        <Section title="Scam DNA" subtitle="The genetic makeup of this scam attempt">
          <div className="space-y-5">
            {report.scam_dna.map((t) => (
              <div key={t.trait}>
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-sm font-medium">{t.trait}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                  </div>
                  <p className="text-sm font-bold gradient-text">{t.score}%</p>
                </div>
                <Progress value={t.score} className="mt-2 h-1.5" />
              </div>
            ))}
          </div>
        </Section>

        {/* Recommendations */}
        <Section title="AI Recommendations">
          <div className="grid gap-3 sm:grid-cols-2">
            {report.recommendations.map((r) => (
              <div
                key={r.title}
                className={cn(
                  "rounded-2xl border p-5 transition-colors",
                  r.urgency === "critical"
                    ? "border-destructive/30 bg-destructive/5"
                    : r.urgency === "warn"
                      ? "border-warning/30 bg-warning/5"
                      : "border-border/60 bg-muted/20",
                )}
              >
                <div className="flex items-center gap-2">
                  {r.urgency === "critical" ? (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  ) : r.urgency === "warn" ? (
                    <Info className="h-4 w-4 text-warning" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  )}
                  <p className="font-semibold">{r.title}</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{r.description}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Follow-up chat */}
        <FollowUpChat />
      </main>
    </div>
  );
}

function Section({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="animate-fade-up glass rounded-3xl p-6 sm:p-8 shadow-card">
      <div className="mb-5">
        <div className="flex items-center gap-2">
          {Icon ? <Icon className="h-4 w-4 text-brand" /> : null}
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        </div>
        {subtitle ? <p className="text-sm text-muted-foreground mt-1">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

interface ChatMsg {
  role: "user" | "ai";
  text: string;
}

function FollowUpChat() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "ai",
      text: "I've completed your investigation. Ask me anything about this scam, or share related suspicious activity you've seen.",
    },
    { role: "user", text: "FedEx also called me." },
    {
      role: "ai",
      text: "Did they ask you to stay on the call continuously? That's a classic isolation tactic used together with the Digital Arrest pattern. Please block that number too — I can help you understand what they said if you share the details.",
    },
  ]);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    setMessages((m) => [...m, { role: "user", text: input.trim() }]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text: "Thanks for the extra context. I'm not connected to a live AI yet — this is a demo response — but in production I'd correlate this with the current case and flag matching scam patterns.",
        },
      ]);
    }, 800);
  };

  return (
    <section className="animate-fade-up glass-strong rounded-3xl overflow-hidden shadow-elegant">
      <div className="border-b border-border/40 px-6 py-4 flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-brand shadow-glow">
          <Bot className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Ask Sentinel</h3>
          <p className="text-xs text-muted-foreground">Follow-up conversation about this case</p>
        </div>
      </div>
      <div className="max-h-[420px] overflow-y-auto p-6 space-y-5">
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}
          >
            {m.role === "ai" && (
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-brand-soft border border-border/60">
                <Bot className="h-4 w-4 text-brand" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                m.role === "user"
                  ? "bg-gradient-brand text-primary-foreground shadow-glow"
                  : "bg-muted/40 border border-border/40",
              )}
            >
              {m.text}
            </div>
            {m.role === "user" && (
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted border border-border/60">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="border-t border-border/40 p-3 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask a follow-up question…"
          className="bg-muted/40 border-border/60 h-11"
        />
        <Button
          onClick={send}
          className="bg-gradient-brand text-primary-foreground shadow-glow hover:opacity-90 h-11 px-4"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}

function ReportSkeleton() {
  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-56 w-full rounded-3xl" />
        <Skeleton className="h-40 w-full rounded-3xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    </div>
  );
}
