import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BadgeIndianRupee,
  History,
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
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: ThreatIntelligenceCenter,
});

type MetricTone = "brand" | "danger" | "warning" | "success";

const METRICS: {
  label: string;
  value: string;
  delta: string;
  deltaTone: "up" | "flat" | "info";
  icon: React.ComponentType<{ className?: string }>;
  tone: MetricTone;
}[] = [
  { label: "Investigations Today", value: "2,847", delta: "+18%", deltaTone: "up", icon: Activity, tone: "brand" },
  { label: "High Risk Alerts", value: "326", delta: "+12%", deltaTone: "up", icon: ShieldAlert, tone: "danger" },
  { label: "Digital Arrest Scams", value: "142", delta: "Trending Up", deltaTone: "up", icon: TrendingUp, tone: "warning" },
  { label: "Estimated Money Saved", value: "₹18.4 Lakh", delta: "Demo Data", deltaTone: "info", icon: BadgeIndianRupee, tone: "success" },
];

const TRENDING = [
  { name: "Digital Arrest", value: 42, tone: "from-rose-500 to-orange-500" },
  { name: "Investment Fraud", value: 24, tone: "from-fuchsia-500 to-violet-500" },
  { name: "UPI Scam", value: 16, tone: "from-cyan-400 to-blue-500" },
  { name: "Courier Scam", value: 11, tone: "from-amber-400 to-orange-500" },
  { name: "Job Scam", value: 7, tone: "from-emerald-400 to-teal-500" },
];

const ALERTS: {
  city: string;
  headline: string;
  severity: "critical" | "high" | "medium";
  time: string;
}[] = [
  { city: "Delhi", headline: "Digital Arrest campaign targeting senior citizens.", severity: "critical", time: "12 min ago" },
  { city: "Mumbai", headline: "Investment scam using fake trading groups.", severity: "high", time: "38 min ago" },
  { city: "Bengaluru", headline: "Courier scam impersonating customs officials.", severity: "high", time: "1 hr ago" },
  { city: "Hyderabad", headline: "Fake KYC update links detected.", severity: "medium", time: "2 hr ago" },
];

const RECENT: {
  date: string;
  category: string;
  risk: "Critical" | "High" | "Medium" | "Low" | "Safe";
  status: "Reported" | "Under Review" | "Resolved" | "Archived";
}[] = [
  { date: "Nov 14, 2026", category: "Digital Arrest", risk: "Critical", status: "Reported" },
  { date: "Nov 14, 2026", category: "Investment Fraud", risk: "High", status: "Under Review" },
  { date: "Nov 13, 2026", category: "UPI Scam", risk: "High", status: "Resolved" },
  { date: "Nov 13, 2026", category: "Courier Scam", risk: "Medium", status: "Resolved" },
  { date: "Nov 12, 2026", category: "Job Scam", risk: "Low", status: "Archived" },
];

const TONE_STYLES: Record<MetricTone, { icon: string; ring: string }> = {
  brand: { icon: "bg-gradient-brand", ring: "ring-brand/30" },
  danger: { icon: "bg-gradient-danger", ring: "ring-destructive/30" },
  warning: { icon: "bg-gradient-warning", ring: "ring-amber-400/30" },
  success: { icon: "bg-gradient-success", ring: "ring-emerald-400/30" },
};

const SEVERITY_STYLES: Record<"critical" | "high" | "medium", { dot: string; badge: string; label: string }> = {
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

function ThreatIntelligenceCenter() {
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background bg-gradient-hero">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center gap-3 border-b border-border/40 px-4 backdrop-blur">
            <SidebarTrigger />
            <div className="text-sm text-muted-foreground">Threat Intelligence Center</div>
            <div className="ml-auto flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Live · Synthetic demo feed
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
                {METRICS.map((m, i) => {
                  const styles = TONE_STYLES[m.tone];
                  return (
                    <div
                      key={m.label}
                      style={{ animationDelay: `${i * 60}ms` }}
                      className="glass relative overflow-hidden rounded-2xl p-5 shadow-card animate-fade-up"
                    >
                      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-brand opacity-10 blur-2xl" />
                      <div className="relative flex items-start justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">
                            {m.label}
                          </p>
                          <p className="mt-2 text-3xl font-semibold tracking-tight">{m.value}</p>
                        </div>
                        <div
                          className={cn(
                            "grid h-10 w-10 place-items-center rounded-xl ring-1",
                            styles.icon,
                            styles.ring,
                          )}
                        >
                          <m.icon className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="relative mt-4 inline-flex items-center gap-1 text-xs">
                        {m.deltaTone === "up" ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-emerald-300">
                            <ArrowUpRight className="h-3 w-3" />
                            {m.delta}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
                            {m.delta}
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
                    {TRENDING.map((t) => (
                      <div key={t.name}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{t.name}</span>
                          <span className="tabular-nums text-muted-foreground">{t.value}%</span>
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn("h-full rounded-full bg-gradient-to-r", t.tone)}
                            style={{ width: `${t.value}%` }}
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
                    {ALERTS.map((a) => {
                      const sev = SEVERITY_STYLES[a.severity];
                      return (
                        <div
                          key={a.city + a.headline}
                          className="group rounded-xl border border-border/40 bg-card/40 p-4 transition hover:border-brand/30"
                        >
                          <div className="flex items-center gap-2">
                            <span className={cn("h-2 w-2 rounded-full", sev.dot)} />
                            <span className="text-sm font-semibold">{a.city}</span>
                            <span className={cn("ml-auto rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider", sev.badge)}>
                              {sev.label}
                            </span>
                          </div>
                          <p className="mt-1.5 text-sm text-muted-foreground">{a.headline}</p>
                          <p className="mt-2 text-[11px] text-muted-foreground/70">{a.time}</p>
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
                  <QuickAction
                    icon={PlusCircle}
                    title="Start Investigation"
                    subtitle="Paste a message, URL or screenshot"
                    primary
                    onClick={() => navigate({ to: "/investigate" })}
                  />
                  <QuickAction
                    icon={Map}
                    title="Scam Intelligence Map"
                    subtitle="Regional heatmap of active threats"
                    onClick={() => {}}
                  />
                  <QuickAction
                    icon={Network}
                    title="Fraud Network Analysis"
                    subtitle="Trace linked accounts & campaigns"
                    onClick={() => {}}
                  />
                  <QuickAction
                    icon={History}
                    title="Investigation History"
                    subtitle="Review your past reports"
                    onClick={() => {}}
                  />
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
                      {RECENT.map((r, i) => (
                        <tr
                          key={i}
                          className="border-t border-border/40 transition hover:bg-card/40"
                        >
                          <td className="px-4 py-3 text-muted-foreground">{r.date}</td>
                          <td className="px-4 py-3 font-medium">{r.category}</td>
                          <td className="px-4 py-3">
                            <span className={cn("inline-flex rounded-md border px-2 py-0.5 text-xs font-medium", RISK_BADGE[r.risk])}>
                              {r.risk}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn("inline-flex rounded-md px-2 py-0.5 text-xs font-medium", STATUS_BADGE[r.status])}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
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
        primary
          ? "bg-gradient-brand text-primary-foreground shadow-glow"
          : "glass hover:border-brand/30",
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "grid h-10 w-10 place-items-center rounded-xl",
            primary ? "bg-white/15" : "bg-gradient-brand-soft border border-border/60",
          )}
        >
          <Icon className={cn("h-5 w-5", primary ? "text-primary-foreground" : "text-brand")} />
        </div>
        <ArrowUpRight
          className={cn(
            "h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
            primary ? "text-primary-foreground/80" : "text-muted-foreground",
          )}
        />
      </div>
      <p className="mt-4 text-base font-semibold tracking-tight">{title}</p>
      <p className={cn("mt-1 text-xs", primary ? "text-primary-foreground/80" : "text-muted-foreground")}>
        {subtitle}
      </p>
    </button>
  );
}
