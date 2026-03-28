import { motion } from 'framer-motion';
import { TrendingUp, Zap, Target, Shield } from 'lucide-react';
import { OpportunityCard as OpportunityCardType } from '@/data/types';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  TrendingUp, Zap, Target, Shield,
};

const OpportunityCards = ({ opportunities }: { opportunities: OpportunityCardType[] }) => {
  return (
    <section className="mb-12">
      <h2 className="text-xl font-bold text-foreground mb-1">Product Opportunity Analysis</h2>
      <p className="text-sm text-muted-foreground mb-6">Why this product has strong potential in China's pet food market</p>
      <div className="grid md:grid-cols-2 gap-4">
        {opportunities.map((opp, i) => {
          const Icon = iconMap[opp.icon] || TrendingUp;
          return (
            <motion.div
              key={opp.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-5 hover:glow-border transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                  <Icon className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{opp.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{opp.description}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default OpportunityCards;
