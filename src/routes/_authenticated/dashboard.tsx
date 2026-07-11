import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BadgeIndianRupee,
  History,
  Info,
  Map,
  Network,
  PlusCircle,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
                      <p className="text-xs text-muted-foreground">Share of investigations (last 24h)</p>
                    </div>
                    <TrendingUp className="h-4 w-4 text-brand" />
                  </div>
                  <div className="mt-6 space-y-5">
                    {trends.isLoading
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="h-6 animate-pulse rounded bg-muted/40" />
                        ))
                      : (trends.data ?? []).map((t: any) => (
                          <div key={t.id}>
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{t.scam_type}</span>
                              <span className="tabular-nums text-muted-foreground">{Number(t.percentage)}%</span>
                            </div>
                            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                className={cn("h-full rounded-full bg-gradient-to-r", t.color ?? "from-brand to-brand")}
                                style={{ width: `${Number(t.percentage)}%` }}
                              />
                            </div>
                          </div>
                        ))}
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
                      : (alerts.data ?? []).slice(0, 4).map((a: any) => {
                          const sev = SEVERITY_STYLES[a.severity] ?? SEVERITY_STYLES.medium;
                          return (
                            <div
                              key={a.id}
                              className="group rounded-xl border border-border/40 bg-card/40 p-4 transition hover:border-brand/30"
                            >
                              <div className="flex items-center gap-2">
                                <span className={cn("h-2 w-2 rounded-full", sev.dot)} />
                                <span className="text-sm font-semibold">{a.city}</span>
                                <span className={cn("ml-auto rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider", sev.badge)}>
                                  {sev.label}
                                </span>
                              </div>
                              <p className="mt-1.5 text-sm text-muted-foreground">{a.title}</p>
                              <p className="mt-2 text-[11px] text-muted-foreground/70">{relativeTime(a.timestamp)}</p>
                            </div>
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
    </SidebarProvider>
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
