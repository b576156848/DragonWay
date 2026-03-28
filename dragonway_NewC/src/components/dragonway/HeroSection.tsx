import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import mascotImg from '@/assets/mascot.png';
import { DotPattern } from '@/components/ui/dot-pattern';
import { useI18n } from '@/lib/i18n';

interface HeroSectionProps {
  onDemoMode: () => void;
  onSeeHow?: () => void;
  onScrollToCta?: () => void;
}

const HeroSection = ({ onDemoMode, onSeeHow, onScrollToCta }: HeroSectionProps) => {
  const { t } = useI18n();
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const mascotY = useTransform(scrollYProgress, [0, 1], [0, 60]);

  const titleWords = t('heroTitle').split(' ');
  const subtitleWords = t('heroSubtitle').split(' ');

  return (
    <div ref={sectionRef} className="relative min-h-[85vh] flex items-center justify-center mb-12 overflow-hidden">
      <DotPattern className="text-primary/20" cr={1.2} width={20} height={20} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex flex-col md:flex-row items-center gap-10 md:gap-16 max-w-4xl mx-auto px-4"
      >
        {/* Mascot with radial glow */}
        <motion.div
          animate={{ y: [-8, 8, -8] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ y: mascotY }}
          className="relative shrink-0 md:w-[35%] flex items-center justify-center"
        >
          <div className="absolute inset-0 scale-150 rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.08)_0%,transparent_70%)]" />
          <img
            src={mascotImg}
            alt="DragonWay mascot"
            className="relative w-36 md:w-full drop-shadow-xl"
          />
        </motion.div>

        {/* Text */}
        <div className="text-center md:text-left md:w-[55%]">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-4">
            <div className="w-2 h-2 rounded-full bg-primary agent-pulse" />
            <span className="text-sm text-primary font-semibold">{t('heroBadge')}</span>
          </div>

          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground mb-4 leading-[1.1]">
            {titleWords.map((word, i) => (
              <motion.span
                key={`${word}-${i}`}
                initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.35, delay: 0.6 + i * 0.06, ease: 'easeOut' }}
                className="inline-block mr-[0.28em]"
              >
                {word}
              </motion.span>
            ))}
          </h1>
          <p className="text-base text-muted-foreground mb-8">
            {subtitleWords.map((word, i) => (
              <motion.span
                key={`${word}-${i}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 1.4 + i * 0.04, ease: 'easeOut' }}
                className="inline-block mr-[0.25em]"
              >
                {word}
              </motion.span>
            ))}
          </p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 2.2, ease: 'easeOut' }}
            className="flex flex-wrap items-center gap-4 justify-center md:justify-start"
          >
            <button
              onClick={onScrollToCta}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-base hover:scale-[1.03] transition-transform shadow-[0_4px_24px_rgba(230,126,61,0.3)]"
            >
              {t('tryDemo')}
              <ArrowRight className="w-5 h-5" />
            </button>
            {onSeeHow && (
              <button
                onClick={onSeeHow}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-border text-foreground font-semibold text-base hover:border-primary/40 transition-colors"
              >
                {t('seeHow')}
              </button>
            )}
            <button
              onClick={onDemoMode}
              className="w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors mt-2"
            >
              {t('trySample')}
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default HeroSection;
