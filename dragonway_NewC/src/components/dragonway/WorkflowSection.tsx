import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Search, Users, FileText, Send } from 'lucide-react';
import { AnimatedBeam } from '@/components/ui/animated-beam';
import { useI18n } from '@/lib/i18n';
import { useIsMobile } from '@/hooks/use-mobile';

const stepKeys = ['stepPasteLink', 'stepAnalyze', 'stepMatchKols', 'stepGenContent', 'stepSubmit'] as const;
const stepDescKeys = ['stepPasteLinkDesc', 'stepAnalyzeDesc', 'stepMatchKolsDesc', 'stepGenContentDesc', 'stepSubmitDesc'] as const;
const stepIcons = [Link2, Search, Users, FileText, Send];

const WorkflowSection = () => {
  const { t } = useI18n();
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const step1Ref = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);
  const step4Ref = useRef<HTMLDivElement>(null);
  const step5Ref = useRef<HTMLDivElement>(null);
  const stepRefs = [step1Ref, step2Ref, step3Ref, step4Ref, step5Ref];

  const [selectedStep, setSelectedStep] = useState(0);

  // Auto-cycle on mobile
  useEffect(() => {
    if (!isMobile) return;
    const interval = setInterval(() => {
      setSelectedStep(prev => (prev + 1) % 5);
    }, 3000);
    return () => clearInterval(interval);
  }, [isMobile]);

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

        {/* Step icons row */}
        <div
          ref={containerRef}
          className="relative flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12"
        >
          {/* Animated beams - desktop only */}
          <div className="hidden md:block pointer-events-none">
            <AnimatedBeam containerRef={containerRef} fromRef={step1Ref} toRef={step2Ref} gradientStartColor="#E67E3D" gradientStopColor="#86C5C5" pathColor="transparent" pathWidth={2} duration={4} delay={0} />
            <AnimatedBeam containerRef={containerRef} fromRef={step2Ref} toRef={step3Ref} gradientStartColor="#E67E3D" gradientStopColor="#86C5C5" pathColor="transparent" pathWidth={2} duration={4} delay={1} />
            <AnimatedBeam containerRef={containerRef} fromRef={step3Ref} toRef={step4Ref} gradientStartColor="#E67E3D" gradientStopColor="#86C5C5" pathColor="transparent" pathWidth={2} duration={4} delay={2} />
            <AnimatedBeam containerRef={containerRef} fromRef={step4Ref} toRef={step5Ref} gradientStartColor="#E67E3D" gradientStopColor="#86C5C5" pathColor="transparent" pathWidth={2} duration={4} delay={3} />
          </div>

          {stepKeys.map((key, i) => {
            const Icon = stepIcons[i];
            const isSelected = selectedStep === i;
            return (
              <motion.div
                key={key}
                ref={stepRefs[i]}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex flex-col items-center gap-2 z-10 cursor-pointer w-20 md:w-24"
                onClick={() => setSelectedStep(i)}
              >
                <motion.div
                  whileHover={{ scale: 1.15, y: -4 }}
                  animate={isSelected ? { scale: 1.1 } : { scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                    isSelected
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-lg'
                      : 'bg-primary/10 border border-primary/20'
                  }`}
                >
                  <Icon className={`w-6 h-6 ${isSelected ? 'text-primary-foreground' : 'text-primary'}`} />
                </motion.div>
                <span className={`text-xs font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                  {t(key)}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {stepKeys.map((_, i) => (
            <button
              key={i}
              onClick={() => setSelectedStep(i)}
              className="p-0.5"
              aria-label={`Step ${i + 1}`}
            >
              <motion.div
                animate={{
                  width: selectedStep === i ? 20 : 6,
                  backgroundColor: selectedStep === i ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.3)',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="h-1.5 rounded-full"
              />
            </button>
          ))}
        </div>

        {/* Detail panel with content-aware height */}
        <div className="max-w-2xl mx-auto mt-8">
          <motion.div
            animate={{ height: 'auto' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="glass-card overflow-hidden"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedStep}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="p-6 text-left"
              >
                <div className="flex items-start gap-4">
                  <span className="text-2xl font-display font-bold text-primary/30 leading-none mt-0.5">
                    {String(selectedStep + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="font-display text-base font-semibold text-foreground mb-1.5">
                      {t(stepKeys[selectedStep])}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t(stepDescKeys[selectedStep])}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Founder insight */}
        <p className="text-muted-foreground text-xs mt-10 max-w-lg mx-auto whitespace-pre-line">
          {t('trustFounder')}
        </p>
      </div>
    </section>
  );
};

export default WorkflowSection;
