import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Shield,
  Search,
  Image as ImageIcon,
  AlertTriangle,
  Sparkles,
  BookOpen,
  ArrowRight,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Nav */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand shadow-glow">
            <Shield className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-semibold tracking-tight">Sentinel AI</span>
        </Link>
        <nav className="hidden gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/auth"
            className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline-flex px-3 py-2"
          >
            Sign in
          </Link>
          <Link to="/auth">
            <Button className="bg-gradient-brand hover:opacity-90 text-primary-foreground shadow-glow">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs text-muted-foreground animate-fade-up">
          <Sparkles className="h-3.5 w-3.5 text-brand" />
          <span>Powered by advanced fraud-detection AI</span>
        </div>
        <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl animate-fade-up">
          Detect Scams Before
          <br />
          They <span className="gradient-text">Steal Your Money</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed animate-fade-up">
          Sentinel AI investigates suspicious messages, emails, websites, screenshots, and call
          transcripts using AI — helping people understand scams before they become victims.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 animate-fade-up">
          <Link to="/auth">
            <Button
              size="lg"
              className="bg-gradient-brand hover:opacity-90 text-primary-foreground shadow-glow px-7 h-12 text-base"
            >
              Start Investigation
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <a href="#features">
            <Button
              size="lg"
              variant="outline"
              className="glass border-border/60 hover:bg-accent h-12 px-7 text-base"
            >
              Learn More
            </Button>
          </a>
        </div>

        {/* Preview card */}
        <div className="relative mx-auto mt-20 max-w-4xl animate-fade-up">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-brand opacity-30 blur-3xl" />
          <div className="glass-strong relative rounded-3xl border border-border/60 p-2 shadow-elegant">
            <div className="rounded-2xl bg-card/80 p-8 text-left">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-danger">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Risk Score</p>
                  <p className="text-2xl font-bold">96% — Critical</p>
                </div>
                <div className="ml-auto rounded-full bg-destructive/15 px-3 py-1 text-xs font-medium text-destructive">
                  Digital Arrest Scam
                </div>
              </div>
              <p className="mt-6 text-sm text-muted-foreground leading-relaxed">
                "Your Aadhaar has been used in illegal activities. Immediate payment required to
                avoid legal action. Do not disconnect this call…"
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["Aadhaar", "Immediate Payment", "Legal Action", "OTP"].map((t) => (
                  <span
                    key={t}
                    className="rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive border border-destructive/20"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            An investigator that <span className="gradient-text">never sleeps</span>
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Every scam has a signature. Sentinel AI reads it, explains it, and tells you exactly
            what to do next.
          </p>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              style={{ animationDelay: `${i * 80}ms` }}
              className="group relative overflow-hidden rounded-2xl glass p-7 shadow-card transition-all hover:border-brand/30 hover:-translate-y-1 animate-fade-up"
            >
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-brand opacity-0 blur-3xl transition-opacity group-hover:opacity-30" />
              <div className="relative">
                <div className="mb-5 inline-grid h-11 w-11 place-items-center rounded-xl bg-gradient-brand-soft border border-border/60">
                  <f.icon className="h-5 w-5 text-brand" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How */}
      <section id="how" className="mx-auto max-w-7xl px-6 py-20">
        <div className="glass-strong rounded-3xl p-12 text-center shadow-elegant">
          <h2 className="text-4xl font-bold tracking-tight">Ready to investigate?</h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Paste a suspicious message, drop a screenshot, or share a URL. Get a full report in
            seconds.
          </p>
          <Link to="/auth" className="mt-8 inline-block">
            <Button
              size="lg"
              className="bg-gradient-brand hover:opacity-90 text-primary-foreground shadow-glow px-8 h-12 text-base"
            >
              Start Free Investigation
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="mx-auto max-w-7xl px-6 py-10 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Sentinel AI · Built to protect
      </footer>
    </div>
  );
}

const FEATURES = [
  {
    icon: Search,
    title: "AI Investigation",
    description:
      "Deep analysis of texts, emails and calls to uncover scam patterns invisible to the eye.",
  },
  {
    icon: ImageIcon,
    title: "Screenshot Analysis",
    description:
      "Upload a screenshot of a suspicious chat — we read, extract and evaluate the risk.",
  },
  {
    icon: AlertTriangle,
    title: "Scam Detection",
    description:
      "Instantly categorize threats: phishing, digital arrest, investment fraud and more.",
  },
  {
    icon: BookOpen,
    title: "Explainable AI",
    description:
      "Every verdict comes with evidence — the exact phrases and tactics that raised the alarm.",
  },
  {
    icon: Zap,
    title: "AI Safety Recommendations",
    description:
      "Actionable next steps: what to do, what to avoid, and how to recover if you're hit.",
  },
  {
    icon: Shield,
    title: "Private by Design",
    description:
      "Your investigations are yours alone. Encrypted storage, private-first architecture.",
  },
];
