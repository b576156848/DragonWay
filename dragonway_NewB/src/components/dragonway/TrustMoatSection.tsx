import { motion } from 'framer-motion';
import { Filter, Globe, ArrowRightLeft, Rocket } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const cardConfigs = [
  { icon: Filter, titleKey: 'trustCard1Title', descKey: 'trustCard1Desc', span: 'sm:col-span-2', gradient: true, tagline: false },
  { icon: Globe, titleKey: 'trustCard2Title', descKey: 'trustCard2Desc', span: 'sm:col-span-1', gradient: false, tagline: false },
  { icon: ArrowRightLeft, titleKey: 'trustCard3Title', descKey: 'trustCard3Desc', span: 'sm:col-span-1', gradient: false, tagline: false },
  { icon: Rocket, titleKey: 'trustCard4Title', descKey: 'trustCard4Desc', span: 'sm:col-span-2', gradient: false, tagline: true },
] as const;

const TrustMoatSection = () => {
  const { t } = useI18n();

  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-muted-foreground text-sm mb-16 max-w-lg mx-auto whitespace-pre-line"
        >
          {t('trustFounder')}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-2xl md:text-3xl font-semibold text-foreground text-center mb-10"
        >
          {t('trustTitle')}
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cardConfigs.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.titleKey}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className={`glass-card p-6 hover:scale-[1.01] transition-transform duration-200 ${card.span} ${card.gradient ? 'gradient-bg' : ''}`}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display text-base font-semibold text-foreground mb-1">{t(card.titleKey)}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{t(card.descKey)}</p>
                {card.tagline && (
                  <p className="mt-3 font-display text-sm font-semibold gradient-text">
                    {t('trustTagline')}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TrustMoatSection;
