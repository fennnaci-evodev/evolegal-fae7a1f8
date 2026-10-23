import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ShieldCheck, ShieldAlert, ExternalLink } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { extractCitations, matchSource, type VerifiedSource } from "@/lib/citations";

export function useVerifiedSources() {
  return useQuery({
    queryKey: ["verified-hugo-citations"],
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("list_verified_hugo_citations");
      if (error) return [] as VerifiedSource[];
      return (data ?? []) as VerifiedSource[];
    },
  });
}

export function HugoCitationChips({ content }: { content: string }) {
  const citations = useMemo(() => extractCitations(content), [content]);
  const { data: sources = [] } = useVerifiedSources();
  if (!citations.length) return null;

  return (
    <div className="mt-2.5 flex flex-wrap gap-1.5" aria-label="Statutory references">
      {citations.map(c => {
        const src = matchSource(c, sources);
        return (
          <Popover key={c.label}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                  src ? "border-primary/40 bg-primary/10 text-primary" : "border-border/50 bg-muted/30 text-muted-foreground"
                }`}
              >
                <BookOpen className="h-3 w-3" aria-hidden="true" />
                {c.label}
                {src ? <ShieldCheck className="h-3 w-3" aria-label="Verified" /> : <ShieldAlert className="h-3 w-3" aria-label="Not verified" />}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 text-xs space-y-2">
              {src ? (
                <>
                  <p className="font-semibold text-foreground">{src.title}</p>
                  <p className="text-muted-foreground">
                    {src.jurisdiction} · Reviewed {src.reviewed_at ? new Date(src.reviewed_at).toLocaleDateString() : "—"}
                  </p>
                  <blockquote className="border-l-2 border-primary/40 pl-2 text-muted-foreground line-clamp-6">{src.excerpt}</blockquote>
                  <a href={src.source_url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-primary underline underline-offset-2">
                    Official text <ExternalLink className="h-3 w-3" />
                  </a>
                </>
              ) : (
                <>
                  <p className="font-semibold text-foreground">Not yet verified</p>
                  <p className="text-muted-foreground">
                    This reference is not in EvoLegal's reviewed source library. Confirm it against the official text before relying on it.
                  </p>
                </>
              )}
            </PopoverContent>
          </Popover>
        );
      })}
    </div>
  );
}
