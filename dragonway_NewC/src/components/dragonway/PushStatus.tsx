import { motion } from 'framer-motion';
import { CheckCircle2, Package, Send, FileText, Users } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const stepIcons = [FileText, Users, Package, Send];
const stepKeys = [
  { labelKey: 'pushAnalysis', descKey: 'pushAnalysisDesc' },
  { labelKey: 'pushKolsMatched', descKey: 'pushKolsMatchedDesc' },
  { labelKey: 'pushContentGen', descKey: 'pushContentGenDesc' },
  { labelKey: 'pushForwarded', descKey: 'pushForwardedDesc' },
] as const;

const PushStatus = () => {
  const { t } = useI18n();

  return (
    <section className="mb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card glow-border p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">{t('pushTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('pushSubtitle')}</p>
          </div>
        </div>

        <div className="space-y-3">
          {stepKeys.map((step, i) => {
            const Icon = stepIcons[i];
            return (
              <motion.div
                key={step.labelKey}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 pl-2"
              >
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="w-3 h-3 text-primary" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground">{t(step.labelKey)}</span>
                  <span className="text-xs text-muted-foreground ml-2">{t(step.descKey)}</span>
                </div>
                <CheckCircle2 className="w-4 h-4 text-primary/60" />
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
};

export default PushStatus;
