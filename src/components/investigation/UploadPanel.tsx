import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { analyzeText, type InvestigationType } from "@/lib/investigation-service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TYPES: { id: InvestigationType; label: string; icon: React.ComponentType<{ className?: string }>; placeholder: string }[] = [
  { id: "sms", label: "SMS", icon: MessageSquare, placeholder: "Paste the suspicious SMS here…" },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, placeholder: "Paste the WhatsApp message…" },
  { id: "email", label: "Email", icon: Mail, placeholder: "Paste email subject and body…" },
  { id: "url", label: "Website URL", icon: Link2, placeholder: "https://suspicious-site.com" },
  { id: "transcript", label: "Call Transcript", icon: PhoneCall, placeholder: "Paste or type the call transcript…" },
  { id: "image", label: "Screenshot", icon: ImageIcon, placeholder: "" },
];

export function UploadPanel() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<InvestigationType>("sms");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const current = TYPES.find((t) => t.id === selected)!;

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

      navigate({ to: "/investigation/$id", params: { id: investigation.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Investigation failed");
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-strong rounded-3xl p-6 shadow-elegant animate-fade-up">
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

      <div className="mt-6">
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
  );
}
