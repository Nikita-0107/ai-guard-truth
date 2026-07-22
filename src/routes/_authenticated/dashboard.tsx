import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BadgeIndianRupee,
  History,
  Info,
  Map,
  Minus,
  Network,
  PlusCircle,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: ThreatIntelligenceCenter,
});

type MetricTone = "brand" | "danger" | "warning" | "success";

const METRIC_ICONS: Record<string, { icon: React.ComponentType<{ className?: string }>; tone: MetricTone }> = {
  "Investigations Today": { icon: Activity, tone: "brand" },
  "High Risk Alerts": { icon: ShieldAlert, tone: "danger" },
  "Digital Arrest Scams": { icon: TrendingUp, tone: "warning" },
  "Estimated Money Saved": { icon: BadgeIndianRupee, tone: "success" },
};

const TONE_STYLES: Record<MetricTone, { icon: string; ring: string }> = {
  brand: { icon: "bg-gradient-brand", ring: "ring-brand/30" },
  danger: { icon: "bg-gradient-danger", ring: "ring-destructive/30" },
  warning: { icon: "bg-gradient-warning", ring: "ring-amber-400/30" },
  success: { icon: "bg-gradient-success", ring: "ring-emerald-400/30" },
};

const SEVERITY_STYLES: Record<string, { dot: string; badge: string; label: string }> = {
  critical: { dot: "bg-destructive shadow-[0_0_12px] shadow-destructive/70", badge: "bg-destructive/15 text-destructive border-destructive/30", label: "Critical" },
  high: { dot: "bg-orange-400 shadow-[0_0_12px] shadow-orange-400/60", badge: "bg-orange-500/15 text-orange-300 border-orange-500/30", label: "High" },
  medium: { dot: "bg-amber-300 shadow-[0_0_12px] shadow-amber-300/50", badge: "bg-amber-400/15 text-amber-200 border-amber-400/30", label: "Medium" },
};

const RISK_BADGE: Record<string, string> = {
  Critical: "bg-destructive/15 text-destructive border-destructive/30",
  High: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  Medium: "bg-amber-400/15 text-amber-200 border-amber-400/30",
  Low: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Safe: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};

const STATUS_BADGE: Record<string, string> = {
  Reported: "bg-destructive/10 text-destructive",
  "Under Review": "bg-brand/15 text-brand",
  Resolved: "bg-emerald-500/10 text-emerald-300",
  Archived: "bg-muted text-muted-foreground",
};

function riskFromScore(score: number): keyof typeof RISK_BADGE {
  if (score >= 90) return "Critical";
  if (score >= 70) return "High";
  if (score >= 40) return "Medium";
  if (score >= 20) return "Low";
  return "Safe";
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const d = Math.round(hr / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

// Deterministic pseudo-random from string
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 0xffffffff;
}

// Intelligence source pool
const SOURCES = ["Cyber Crime Cell", "Partner Bank", "Citizen Reports", "CERT-In", "Telecom Partner"];

// Realistic recent offsets in minutes for the alert feed
const RECENT_OFFSETS_MIN = [4, 18, 47, 92, 165, 320, 540, 780];

function recentLabel(mins: number): string {
  if (mins < 60) return `${mins} min ago`;
  if (mins < 24 * 60) {
    const h = Math.round(mins / 60);
    return `${h} hr ago`;
  }
  const d = new Date(Date.now() - mins * 60_000);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `Today ${hh}:${mm}`;
}

// Intelligence-style descriptions per scam type
const INTEL_DESCRIPTIONS: Record<string, (city: string) => string> = {
  "Digital Arrest": (c) => `Coordinated impersonation cluster active in ${c}: suspects posing as CBI/Customs officers using spoofed video calls to coerce victims into "verification" transfers.`,
  "UPI Fraud": (c) => `Spike in UPI collect-request fraud detected across ${c} — attackers weaponising QR "refund" flows on OLX/Quikr listings.`,
  "Banking Scam": (c) => `Rising vishing campaign in ${c} impersonating bank fraud teams; targets high-value savings accounts within 2h of OTP capture.`,
  "OTP Scam": (c) => `SIM-swap and OTP relay attempts up sharply in ${c}; correlated to leaked KYC dumps circulating on Telegram.`,
  "Courier Scam": (c) => `FedEx/DHL parcel-hold pretext calls surging in ${c}, funnelling victims to fake "narcotics case" digital arrest chains.`,
  "Investment Scam": (c) => `Fraudulent trading groups on WhatsApp/Telegram recruiting ${c} residents; front-end mimics Zerodha/Groww with fake P&L dashboards.`,
  "Job Scam": (c) => `Fake work-from-home task scams active in ${c} — small initial payouts followed by ₹50k+ "unlock fee" demands.`,
  "Lottery Scam": (c) => `KBC/Kaun Banega Crorepati lottery pretext resurfacing in ${c} via WhatsApp voice notes.`,
};

const RECOMMENDED_ACTIONS: Record<string, string> = {
  critical: "Escalate to Cyber Crime Cell within 1 hour. Freeze linked mule accounts, issue regional advisory, and push alert to partner bank fraud desks.",
  high: "Circulate advisory to field officers and partner banks. Monitor associated numbers and UPI handles for 24h.",
  medium: "Log for trend analysis. Add indicators to watch-list and review in next daily briefing.",
};

function alertSource(id: string): string {
  return SOURCES[Math.floor(hashSeed(id + "src") * SOURCES.length)];
}
function alertConfidence(id: string, severity: string): number {
  const base = severity === "critical" ? 88 : severity === "high" ? 78 : 68;
  return Math.min(99, base + Math.floor(hashSeed(id + "conf") * 11));
}
function alertOffset(id: string, idx: number): number {
  const base = RECENT_OFFSETS_MIN[idx % RECENT_OFFSETS_MIN.length];
  const jitter = Math.floor(hashSeed(id + "off") * 6) - 3;
  return Math.max(2, base + jitter);
}

// Trending scam types augmentation
function trendCases(id: string, pct: number): number {
  // Total daily investigations across trends anchored around ~6.2k, distribute by %
  const total = 6240;
  const base = Math.round((pct / 100) * total);
  const jitter = Math.floor(hashSeed(id + "cases") * 80) - 40;
  return Math.max(50, base + jitter);
}
function trendDelta(id: string): { dir: "up" | "down" | "flat"; pct: number } {
  const r = hashSeed(id + "delta");
  if (r < 0.15) return { dir: "flat", pct: 0 };
  if (r < 0.65) return { dir: "up", pct: Math.round(4 + r * 30) };
  return { dir: "down", pct: Math.round(3 + (r - 0.65) * 22) };
}



function useMetrics() {
  return useQuery({
    queryKey: ["threat_metrics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("threat_metrics")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useTrends() {
  return useQuery({
    queryKey: ["scam_trends"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scam_trends")
        .select("*")
        .order("priority", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useAlerts() {
  return useQuery({
    queryKey: ["threat_alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("threat_alerts")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useRecent() {
  return useQuery({
    queryKey: ["demo_investigations", "recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("demo_investigations")
        .select("*")
        .order("date", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });
}

function ThreatIntelligenceCenter() {
  const navigate = useNavigate();
  const metrics = useMetrics();
  const trends = useTrends();
  const alerts = useAlerts();
  const recent = useRecent();
  const [activeAlert, setActiveAlert] = useState<any | null>(null);


  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background bg-gradient-hero">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center gap-3 border-b border-border/40 px-4 backdrop-blur">
            <SidebarTrigger />
            <div className="text-sm text-muted-foreground">Threat Intelligence Center</div>
            <div className="ml-auto flex items-center gap-2">
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex cursor-help items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[11px] font-medium text-amber-200">
                      <Info className="h-3 w-3" />
                      Demo Intelligence Feed
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    Displaying synthetic cybercrime intelligence data for demonstration purposes.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Live · Synthetic demo feed
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-8 sm:px-8">
            <div className="mx-auto max-w-7xl space-y-10">
              {/* Title */}
              <section className="animate-fade-up">
                <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-muted-foreground">
                  <Sparkles className="h-3 w-3 text-brand" />
                  Sentinel Intelligence · v2.4
                </div>
                <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                  Threat <span className="gradient-text">Intelligence Center</span>
                </h1>
                <p className="mt-3 max-w-2xl text-muted-foreground">
                  Real-time overview of digital fraud trends across India.
                </p>
              </section>

              {/* Metric Cards */}
              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {metrics.isLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="glass h-32 animate-pulse rounded-2xl" />
                    ))
                  : (metrics.data ?? []).map((m: any, i: number) => {
                      const meta = METRIC_ICONS[m.metric_name] ?? { icon: Activity, tone: "brand" as MetricTone };
                      const styles = TONE_STYLES[meta.tone];
                      const Icon = meta.icon;
                      const isUp = m.metric_status === "up";
                      return (
                        <div
                          key={m.id}
                          style={{ animationDelay: `${i * 60}ms` }}
                          className="glass relative overflow-hidden rounded-2xl p-5 shadow-card animate-fade-up"
                        >
                          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-brand opacity-10 blur-2xl" />
                          <div className="relative flex items-start justify-between">
                            <div>
                              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                                {m.metric_name}
                              </p>
                              <p className="mt-2 text-3xl font-semibold tracking-tight">{m.metric_value}</p>
                            </div>
                            <div className={cn("grid h-10 w-10 place-items-center rounded-xl ring-1", styles.icon, styles.ring)}>
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div className="relative mt-4 inline-flex items-center gap-1 text-xs">
                            {isUp ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-emerald-300">
                                <ArrowUpRight className="h-3 w-3" />
                                {m.metric_change}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
                                {m.metric_change}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
              </section>

              {/* Trending + Alerts */}
              <section className="grid gap-6 lg:grid-cols-5">
                <div className="glass rounded-2xl p-6 shadow-card lg:col-span-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold tracking-tight">Trending Scam Types</h2>
                      <p className="text-xs text-muted-foreground">Investigations volume &amp; 24h change</p>
                    </div>
                    <TrendingUp className="h-4 w-4 text-brand" />
                  </div>
                  <div className="mt-6 space-y-5">
                    {trends.isLoading
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="h-6 animate-pulse rounded bg-muted/40" />
                        ))
                      : (trends.data ?? []).map((t: any) => {
                          const pct = Number(t.percentage);
                          const cases = trendCases(t.id, pct);
                          const delta = trendDelta(t.id);
                          const TrendIcon = delta.dir === "up" ? TrendingUp : delta.dir === "down" ? TrendingDown : Minus;
                          const trendCls =
                            delta.dir === "up"
                              ? "bg-destructive/10 text-destructive"
                              : delta.dir === "down"
                                ? "bg-emerald-500/10 text-emerald-300"
                                : "bg-muted text-muted-foreground";
                          return (
                            <div key={t.id}>
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{t.scam_type}</span>
                                  <span className="tabular-nums text-muted-foreground">
                                    {cases.toLocaleString("en-IN")} cases
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium tabular-nums", trendCls)}>
                                    <TrendIcon className="h-3 w-3" />
                                    {delta.dir === "flat" ? "0%" : `${delta.pct}%`}
                                  </span>
                                  <span className="tabular-nums text-xs text-muted-foreground">{pct}%</span>
                                </div>
                              </div>
                              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                  className={cn("h-full rounded-full bg-gradient-to-r", t.color ?? "from-brand to-brand")}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                  </div>
                </div>

                <div className="glass rounded-2xl p-6 shadow-card lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold tracking-tight">Recent Threat Alerts</h2>
                      <p className="text-xs text-muted-foreground">Live signals from partner networks</p>
                    </div>
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  </div>
                  <div className="mt-5 space-y-3">
                    {alerts.isLoading
                      ? Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="h-20 animate-pulse rounded-xl bg-muted/30" />
                        ))
                      : (alerts.data ?? []).slice(0, 4).map((a: any, idx: number) => {
                          const sev = SEVERITY_STYLES[a.severity] ?? SEVERITY_STYLES.medium;
                          const source = alertSource(a.id);
                          const confidence = alertConfidence(a.id, a.severity);
                          const offset = alertOffset(a.id, idx);
                          const intel =
                            (INTEL_DESCRIPTIONS[a.scam_type]?.(a.city)) ??
                            a.description ??
                            `Elevated ${a.scam_type} activity reported in ${a.city}. Analyst review in progress.`;
                          return (
                            <button
                              key={a.id}
                              onClick={() => setActiveAlert({ ...a, source, confidence, offset, intel })}
                              className="group w-full rounded-xl border border-border/40 bg-card/40 p-4 text-left transition hover:border-brand/40 hover:bg-card/60"
                            >
                              <div className="flex items-center gap-2">
                                <span className={cn("h-2 w-2 rounded-full", sev.dot)} />
                                <span className="text-sm font-semibold">{a.city}</span>
                                <span className={cn("ml-auto rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider", sev.badge)}>
                                  {sev.label}
                                </span>
                              </div>
                              <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{intel}</p>
                              <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground/80">
                                <span className="inline-flex items-center gap-1">
                                  <span className="rounded bg-muted/60 px-1.5 py-0.5 font-medium text-foreground/80">{source}</span>
                                  <span className="tabular-nums">· {confidence}% conf.</span>
                                </span>
                                <span className="tabular-nums">{recentLabel(offset)}</span>
                              </div>
                            </button>
                          );
                        })}
                  </div>
                </div>
              </section>


              {/* Quick Actions */}
              <section>
                <h2 className="text-lg font-semibold tracking-tight">Quick Actions</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <QuickAction icon={PlusCircle} title="Start Investigation" subtitle="Paste a message, URL or screenshot" primary onClick={() => navigate({ to: "/investigate" })} />
                  <QuickAction icon={Map} title="Scam Intelligence Map" subtitle="Regional heatmap of active threats" onClick={() => {}} />
                  <QuickAction icon={Network} title="Fraud Network Analysis" subtitle="Trace linked accounts & campaigns" onClick={() => {}} />
                  <QuickAction icon={History} title="Investigation History" subtitle="Review your past reports" onClick={() => {}} />
                </div>
              </section>

              {/* Recent Investigations */}
              <section className="glass rounded-2xl p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">Recent Investigations</h2>
                    <p className="text-xs text-muted-foreground">Last five cases from your workspace</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    View all
                    <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="mt-5 overflow-hidden rounded-xl border border-border/40">
                  <table className="w-full text-sm">
                    <thead className="bg-card/60 text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Date</th>
                        <th className="px-4 py-3 text-left font-medium">Category</th>
                        <th className="px-4 py-3 text-left font-medium">Risk</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.isLoading
                        ? Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i} className="border-t border-border/40">
                              <td colSpan={4} className="px-4 py-3">
                                <div className="h-5 animate-pulse rounded bg-muted/40" />
                              </td>
                            </tr>
                          ))
                        : (recent.data ?? []).map((r: any) => {
                            const risk = riskFromScore(r.risk_score);
                            return (
                              <tr key={r.id} className="border-t border-border/40 transition hover:bg-card/40">
                                <td className="px-4 py-3 text-muted-foreground">{formatDate(r.date)}</td>
                                <td className="px-4 py-3 font-medium">{r.scam_type}</td>
                                <td className="px-4 py-3">
                                  <span className={cn("inline-flex rounded-md border px-2 py-0.5 text-xs font-medium", RISK_BADGE[risk])}>
                                    {risk}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-medium", STATUS_BADGE[r.status] ?? "bg-muted text-muted-foreground")}>
                                    {r.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                    </tbody>
                  </table>
                </div>
              </section>

              <p className="pb-4 text-center text-[11px] text-muted-foreground/70">
                All figures shown are synthetic demo data for prototype demonstration.
              </p>
            </div>
          </main>
        </div>
      </div>

      <Dialog open={!!activeAlert} onOpenChange={(o) => !o && setActiveAlert(null)}>
        <DialogContent className="glass max-w-lg border-border/60">
          {activeAlert && (() => {
            const sev = SEVERITY_STYLES[activeAlert.severity] ?? SEVERITY_STYLES.medium;
            const action = RECOMMENDED_ACTIONS[activeAlert.severity] ?? RECOMMENDED_ACTIONS.medium;
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", sev.dot)} />
                    <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider", sev.badge)}>
                      {sev.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground">Alert ID · {String(activeAlert.id).slice(0, 8).toUpperCase()}</span>
                  </div>
                  <DialogTitle className="mt-2 text-xl">{activeAlert.title}</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    {recentLabel(activeAlert.offset)} · Reported by {activeAlert.source}
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                  <DetailField label="Region" value={`${activeAlert.city}${activeAlert.state ? `, ${activeAlert.state}` : ""}`} />
                  <DetailField label="Scam Type" value={activeAlert.scam_type} />
                  <DetailField label="Severity" value={sev.label} />
                  <DetailField label="Source" value={activeAlert.source} />
                  <DetailField label="Confidence" value={`${activeAlert.confidence}%`} />
                  <DetailField label="First Seen" value={recentLabel(activeAlert.offset)} />
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Summary</p>
                    <p className="mt-1 text-sm leading-relaxed">{activeAlert.intel}</p>
                  </div>
                  <div className="rounded-lg border border-brand/25 bg-brand/5 p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-brand">Recommended Action</p>
                    <p className="mt-1 text-sm leading-relaxed text-foreground/90">{action}</p>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-card/40 p-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  title,
  subtitle,
  primary,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  primary?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl p-5 text-left shadow-card transition-all hover:-translate-y-0.5",
        primary ? "bg-gradient-brand text-primary-foreground shadow-glow" : "glass hover:border-brand/30",
      )}
    >
      <div className="flex items-start justify-between">
        <div className={cn("grid h-10 w-10 place-items-center rounded-xl", primary ? "bg-white/15" : "bg-gradient-brand-soft border border-border/60")}>
          <Icon className={cn("h-5 w-5", primary ? "text-primary-foreground" : "text-brand")} />
        </div>
        <ArrowUpRight className={cn("h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5", primary ? "text-primary-foreground/80" : "text-muted-foreground")} />
      </div>
      <p className="mt-4 text-base font-semibold tracking-tight">{title}</p>
      <p className={cn("mt-1 text-xs", primary ? "text-primary-foreground/80" : "text-muted-foreground")}>
        {subtitle}
      </p>
    </button>
  );
}
