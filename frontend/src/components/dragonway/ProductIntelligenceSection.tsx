import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Link2, Radar, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProductIntakeAnalysis } from '@/data/types';

interface ProductIntelligenceSectionProps {
  url: string;
  onUrlChange: (value: string) => void;
  onAnalyze: () => void;
  onUseSample: () => void;
  isAnalyzing: boolean;
  analysis: ProductIntakeAnalysis | null;
  error: string | null;
}

const ProductIntelligenceSection = ({
  url,
  onUrlChange,
  onAnalyze,
  onUseSample,
  isAnalyzing,
  analysis,
  error,
}: ProductIntelligenceSectionProps) => {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    setVisibleCount(analysis ? 1 : 0);
    if (!analysis) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setVisibleCount((current) => {
        if (current >= analysis.signals.length) {
          window.clearInterval(timer);
          return current;
        }
        return current + 1;
      });
    }, 220);

    return () => window.clearInterval(timer);
  }, [analysis]);

  return (
    <div className="glass-card-elevated max-w-4xl mx-auto mb-8 overflow-hidden">
      <div className="border-b border-border/60 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-primary/80">
              <Radar className="h-4 w-4" />
              <span>Phase 1 · Product Intelligence Scan</span>
            </div>
            <h2 className="text-2xl font-semibold text-foreground">Analyze a Shopify product before asking anything else.</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              We extract the product&apos;s strongest signals first, then hand those signals into the existing questionnaire as defaults.
            </p>
          </div>
          <Button variant="ghost" onClick={onUseSample} className="self-start text-primary hover:text-primary/80">
            Load sample product
          </Button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="relative">
            <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={url}
              onChange={(event) => onUrlChange(event.target.value)}
              placeholder="https://shopify.com/products/your-product"
              className="h-12 border-border bg-secondary/40 pl-10 font-mono text-sm"
            />
          </div>
          <Button onClick={onAnalyze} disabled={isAnalyzing || !url.trim()} className="h-12 px-6">
            {isAnalyzing ? 'Scanning...' : 'Run Scan'}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {analysis && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-border/70 bg-black/30 p-4">
              <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-primary/75">
                <Sparkles className="h-4 w-4" />
                <span>Signal Stream</span>
              </div>
              <div className="space-y-2 font-mono text-sm">
                {analysis.signals.slice(0, visibleCount).map((signal) => (
                  <motion.div
                    key={signal.key}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="grid gap-2 rounded-xl border border-border/60 bg-card/70 px-3 py-3 md:grid-cols-[148px_1fr_72px]"
                  >
                    <span className="text-xs uppercase tracking-[0.18em] text-primary/70">{signal.key}</span>
                    <span className="text-foreground">{signal.value}</span>
                    <span className="text-right text-xs text-muted-foreground">{Math.round(signal.confidence * 100)}%</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-primary/75">Detected Product</p>
                <div className="mt-3 flex items-start gap-4">
                  {analysis.product_data.images[0] ? (
                    <img
                      src={analysis.product_data.images[0]}
                      alt={analysis.product_data.product_name}
                      className="h-24 w-24 rounded-xl border border-border/60 object-cover"
                    />
                  ) : null}
                  <div className="min-w-0">
                    <p className="text-lg font-semibold text-foreground">{analysis.product_data.product_name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{analysis.product_data.brand_name}</p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {analysis.product_data.provider} · {analysis.product_data.scrape_status}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-primary/80">Why this product is promising</p>
                <p className="mt-3 leading-7 text-foreground/90">{analysis.praise}</p>
              </div>

              {analysis.product_data.warnings.length > 0 && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                  {analysis.product_data.warnings.join(' ')}
                </div>
              )}

              <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-primary/75">Next</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Phase 2 reuses the current questionnaire, but starts from these extracted defaults instead of an empty form.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductIntelligenceSection;
