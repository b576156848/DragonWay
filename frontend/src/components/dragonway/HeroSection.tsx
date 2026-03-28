import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface HeroSectionProps {
  onDemoMode: () => void;
}

const HeroSection = ({ onDemoMode }: HeroSectionProps) => {
  return (
    <div className="text-center mb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-6">
          <div className="w-2 h-2 rounded-full bg-primary agent-pulse" />
          <span className="text-sm text-primary font-medium">AI-Powered KOL Matching</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
          <span className="gradient-text">DragonWay Lab</span>
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground font-light mb-2">
          入华引擎
        </p>
        <p className="text-lg text-secondary-foreground/80 max-w-2xl mx-auto mb-8">
          Paste your product URL, answer a few questions, and get an AI-generated
          China KOL marketing plan in under 5 minutes.
        </p>

        <button
          onClick={onDemoMode}
          className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5"
        >
          Try Demo Mode with sample data
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </div>
  );
};

export default HeroSection;
