import { motion } from 'framer-motion';
import { CampaignResult } from '@/data/types';

const ExecutionPlanSection = ({ campaign }: { campaign: CampaignResult }) => {
  const plan = campaign.execution_plan;

  return (
    <section className="mb-12">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground mb-1">Section 4 · Execution Plan</h2>
        <p className="text-sm text-muted-foreground">Budgeting, publishing order, and the first operational checklist.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid md:grid-cols-[1fr,0.95fr] gap-4">
        <div className="glass-card-elevated p-6">
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-1">Budget Allocation</p>
              <h3 className="text-lg font-semibold text-foreground">{plan.total_budget}</h3>
            </div>
            <p className="text-sm text-primary">{plan.expected_total_reach}</p>
          </div>

          <div className="space-y-3">
            {plan.budget_allocation.map((item) => (
              <div key={item.kol_name} className="rounded-xl border border-border bg-secondary/30 p-4">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <p className="text-sm font-semibold text-foreground">{item.kol_name}</p>
                  <p className="text-sm text-primary">{item.amount}</p>
                </div>
                <div className="mb-2 h-2 rounded-full bg-background/60 overflow-hidden">
                  <div className="h-full rounded-full bg-primary/70" style={{ width: `${item.percentage}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{item.purpose}</span>
                  <span>{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-card-elevated p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3">Content Calendar</p>
            <div className="space-y-3">
              {plan.content_calendar.map((item) => (
                <div key={`${item.week}-${item.kol_name}`} className="rounded-xl border border-border bg-secondary/30 p-4">
                  <p className="text-xs text-primary mb-1">Week {item.week}</p>
                  <p className="text-sm font-semibold text-foreground">{item.kol_name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.action}</p>
                  <p className="text-xs text-muted-foreground mt-1">Platform: {item.platform}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card-elevated p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3">Next Steps</p>
            <div className="space-y-2">
              {plan.next_steps.map((item, index) => (
                <div key={`${item}-${index}`} className="flex items-start gap-3 text-sm text-foreground">
                  <span className="mt-1 inline-block h-2 w-2 rounded-full bg-primary/80" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default ExecutionPlanSection;
