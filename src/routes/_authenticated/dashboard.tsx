import { createFileRoute } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { UploadPanel } from "@/components/investigation/UploadPanel";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  const name = (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? "there";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background bg-gradient-hero">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="flex h-14 items-center gap-3 border-b border-border/40 px-4 backdrop-blur">
            <SidebarTrigger />
            <div className="text-sm text-muted-foreground">Dashboard</div>
          </header>

          <main className="flex-1 px-4 py-10 sm:px-8">
            <div className="mx-auto max-w-3xl">
              <div className="mb-8 animate-fade-up">
                <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-muted-foreground">
                  <Sparkles className="h-3 w-3 text-brand" />
                  Sentinel is ready
                </div>
                <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                  Hi {name}, what would you like{" "}
                  <span className="gradient-text">Sentinel AI</span> to investigate today?
                </h1>
                <p className="mt-3 text-muted-foreground">
                  Paste a message, drop a screenshot, or share a link. You'll get a full risk
                  report in seconds.
                </p>
              </div>

              <UploadPanel />

              <div className="mt-10 grid gap-3 sm:grid-cols-3 text-xs text-muted-foreground">
                {[
                  { k: "Investigations run", v: "0" },
                  { k: "Threats detected", v: "0" },
                  { k: "Money potentially saved", v: "—" },
                ].map((s) => (
                  <div key={s.k} className="glass rounded-xl p-4">
                    <p className="text-muted-foreground/80">{s.k}</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">{s.v}</p>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
