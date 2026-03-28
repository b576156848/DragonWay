import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import mascotImg from '@/assets/mascot.png';

interface HeroSectionProps {
  onDemoMode: () => void;
}

const HeroSection = ({ onDemoMode }: HeroSectionProps) => {
  return (
    <div className="mb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col md:flex-row items-center gap-8 md:gap-12 max-w-2xl mx-auto"
      >
        {/* Mascot */}
        <motion.div
          animate={{ y: [-8, 8, -8] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="shrink-0"
        >
          <img
            src={mascotImg}
            alt="DragonWay mascot"
            className="w-48 md:w-[280px] drop-shadow-lg"
          />
        </motion.div>

        {/* Text */}
        <div className="text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-4">
            <div className="w-2 h-2 rounded-full bg-primary agent-pulse" />
            <span className="text-sm text-primary font-semibold">AI-Powered KOL Matching</span>
          </div>

          <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-2">
            帮你的宠物品牌敲开中国大门
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            AI-Powered China Market Entry for Pet Brands
          </p>

          <button
            onClick={onDemoMode}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:scale-[1.03] transition-transform shadow-md"
          >
            Try Demo Mode
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default HeroSection;
