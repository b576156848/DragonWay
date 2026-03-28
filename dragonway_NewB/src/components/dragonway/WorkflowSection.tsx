import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Link2, Search, Users, FileText, Send } from 'lucide-react';
import { AnimatedBeam } from '@/components/ui/animated-beam';
import { useI18n } from '@/lib/i18n';

const stepKeys = ['stepPasteLink', 'stepAnalyze', 'stepMatchKols', 'stepGenContent', 'stepSubmit'] as const;
const stepIcons = [Link2, Search, Users, FileText, Send];

const WorkflowSection = () => {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const step1Ref = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);
  const step4Ref = useRef<HTMLDivElement>(null);
  const step5Ref = useRef<HTMLDivElement>(null);

  const stepRefs = [step1Ref, step2Ref, step3Ref, step4Ref, step5Ref];

  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-foreground mb-3">
            {t('workflowTitle')}
          </h2>
          <p className="text-muted-foreground text-sm mb-12 max-w-lg mx-auto">
            {t('workflowSubtitle')}
          </p>
        </motion.div>

        <div
          ref={containerRef}
          className="relative flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12"
        >
          {/* Animated beams - desktop only */}
          <div className="hidden md:block">
            <AnimatedBeam containerRef={containerRef} fromRef={step1Ref} toRef={step2Ref} gradientStartColor="#E67E3D" gradientStopColor="#86C5C5" pathColor="#f5d5c3" pathWidth={2} duration={4} delay={0} />
            <AnimatedBeam containerRef={containerRef} fromRef={step2Ref} toRef={step3Ref} gradientStartColor="#E67E3D" gradientStopColor="#86C5C5" pathColor="#f5d5c3" pathWidth={2} duration={4} delay={1} />
            <AnimatedBeam containerRef={containerRef} fromRef={step3Ref} toRef={step4Ref} gradientStartColor="#E67E3D" gradientStopColor="#86C5C5" pathColor="#f5d5c3" pathWidth={2} duration={4} delay={2} />
            <AnimatedBeam containerRef={containerRef} fromRef={step4Ref} toRef={step5Ref} gradientStartColor="#E67E3D" gradientStopColor="#86C5C5" pathColor="#f5d5c3" pathWidth={2} duration={4} delay={3} />
          </div>

          {stepKeys.map((key, i) => {
            const Icon = stepIcons[i];
            return (
              <motion.div
                key={key}
                ref={stepRefs[i]}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex flex-col items-center gap-2 z-10"
              >
                <motion.div
                  whileHover={{ scale: 1.15, y: -4 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center cursor-pointer"
                >
                  <Icon className="w-6 h-6 text-primary" />
                </motion.div>
                <span className="text-xs font-semibold text-foreground">{t(key)}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WorkflowSection;
