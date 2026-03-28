import { motion } from 'framer-motion';
import { CampaignResult } from '@/data/types';

const relevanceStyles = {
  high: 'text-emerald-300 border-emerald-500/20 bg-emerald-500/10',
  medium: 'text-amber-300 border-amber-500/20 bg-amber-500/10',
  low: 'text-zinc-300 border-zinc-500/20 bg-zinc-500/10',
} as const;

const ProductAnalysisSection = ({ campaign }: { campaign: CampaignResult }) => {
  const product = campaign.product_data;
  const analysis = campaign.agent_a_output;

  return (
    <section className="mb-12">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground mb-1">Section 1 · Product Analysis</h2>
        <p className="text-sm text-muted-foreground">How the system understands the product before matching China-side KOLs.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card-elevated p-6">
        <div className="grid md:grid-cols-[1.4fr,0.9fr] gap-6">
          <div>
            <div className="mb-5">
              <p className="text-xs uppercase tracking-[0.18em] text-primary/80 mb-2">Product Summary</p>
              <h3 className="text-2xl font-semibold text-foreground mb-2">{analysis.product_name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{analysis.product_summary}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              {analysis.core_selling_points.map((item, index) => (
                <div key={`${item.point}-${index}`} className="rounded-xl border border-border bg-secondary/30 p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h4 className="text-sm font-semibold text-foreground">{item.point}</h4>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${relevanceStyles[item.china_relevance]}`}>
                      {item.china_relevance}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.evidence}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-secondary/30 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">Market Position</p>
              <p className="text-sm text-foreground leading-relaxed">{analysis.us_market_position}</p>
            </div>

            <div className="rounded-xl border border-border bg-secondary/30 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">US Buyer Profile</p>
              <p className="text-sm text-foreground leading-relaxed mb-2">{analysis.target_demographic_us.description}</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>Age: {analysis.target_demographic_us.age_range}</div>
                <div>Income: {analysis.target_demographic_us.income_level}</div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-secondary/30 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">Competitive Context</p>
              <p className="text-sm text-foreground leading-relaxed">{analysis.competitive_landscape}</p>
            </div>

            <div className="rounded-xl border border-border bg-secondary/30 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">Scrape Status</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>Provider: <span className="text-foreground">{product.provider}</span></div>
                <div>Status: <span className="text-foreground">{product.scrape_status}</span></div>
                {product.price && <div>Price: <span className="text-foreground">{product.currency ?? ''} {product.price}</span></div>}
                {product.warnings.length > 0 && <div>Warnings: <span className="text-foreground">{product.warnings.join(' ')}</span></div>}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default ProductAnalysisSection;
