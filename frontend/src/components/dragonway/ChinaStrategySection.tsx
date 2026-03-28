import { motion } from 'framer-motion';
import { CampaignResult } from '@/data/types';

const ChinaStrategySection = ({ campaign }: { campaign: CampaignResult }) => {
  const strategy = campaign.agent_b_output;

  return (
    <section className="mb-12">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground mb-1">Section 2 · China Market Strategy</h2>
        <p className="text-sm text-muted-foreground">Localized positioning, platform split, and market-specific risk framing.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card-elevated p-6">
        <div className="grid md:grid-cols-[1.2fr,0.8fr] gap-6">
          <div>
            <div className="mb-5">
              <p className="text-sm text-foreground/90 leading-relaxed">{strategy.china_market_summary}</p>
            </div>

            <div className="space-y-3">
              {strategy.localized_selling_points.map((item, index) => (
                <div key={`${item.original}-${index}`} className="rounded-xl border border-border bg-secondary/30 p-4">
                  <div className="grid md:grid-cols-[0.9fr,1.1fr] gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-1">Original</p>
                      <p className="text-sm text-foreground">{item.original}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-1">Localized</p>
                      <p className="text-sm text-foreground leading-relaxed">{item.localized}</p>
                      <p className="text-xs text-primary/90 mt-2">{item.platform_angle}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-secondary/30 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">Primary Audience</p>
              <p className="text-sm text-foreground leading-relaxed">{strategy.target_audience_cn.primary}</p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/30 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">Secondary Audience</p>
              <p className="text-sm text-foreground leading-relaxed">{strategy.target_audience_cn.secondary}</p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/30 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">Recommended Strategy</p>
              <div className="space-y-2 text-sm text-foreground">
                <p><span className="text-muted-foreground">Platform split:</span> {strategy.recommended_strategy.platform_split}</p>
                <p><span className="text-muted-foreground">Content direction:</span> {strategy.recommended_strategy.content_direction}</p>
                <p><span className="text-muted-foreground">Differentiation:</span> {strategy.recommended_strategy.differentiation}</p>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-secondary/30 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">Risk Factors</p>
              <div className="space-y-3">
                {strategy.risk_factors.map((item, index) => (
                  <div key={`${item.risk}-${index}`}>
                    <p className="text-sm text-foreground">{item.risk}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.mitigation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default ChinaStrategySection;
