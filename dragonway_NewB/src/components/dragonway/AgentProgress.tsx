import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { AGENT_STEPS } from '@/data/types';

interface AgentProgressProps {
  onComplete: () => void;
}

const AgentProgress = ({ onComplete }: AgentProgressProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);

  useEffect(() => {
    if (currentStep >= AGENT_STEPS.length) {
      setTimeout(onComplete, 600);
      return;
    }

    const timer = setTimeout(() => {
      setCompleted(prev => [...prev, currentStep]);
      setCurrentStep(prev => prev + 1);
    }, AGENT_STEPS[currentStep].duration);

    return () => clearTimeout(timer);
  }, [currentStep, onComplete]);

  return (
    <div className="max-w-xl mx-auto py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        {/* Bouncing dog emoji placeholder */}
        <div className="mb-4">
          <span className="text-6xl inline-block animate-bounce-emoji">🐕</span>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-4">
          <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
          <span className="text-sm text-primary font-semibold">Agent Running</span>
        </div>
        <h2 className="text-2xl font-display font-semibold text-foreground mb-2">Analyzing your product</h2>
        <p className="text-muted-foreground">Our AI agent is building your China market plan</p>
      </motion.div>

      <div className="glass-card p-6">
        <div className="space-y-1">
          {AGENT_STEPS.map((step, i) => {
            const isCompleted = completed.includes(i);
            const isActive = currentStep === i;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive ? 'bg-primary/5 border border-primary/20' : ''
                }`}
              >
                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                  <AnimatePresence mode="wait">
                    {isCompleted ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center"
                      >
                        <Check className="w-3 h-3 text-accent" />
                      </motion.div>
                    ) : isActive ? (
                      <motion.div
                        key="spinner"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      </motion.div>
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                    )}
                  </AnimatePresence>
                </div>
                <span className={`text-sm font-semibold ${
                  isCompleted ? 'text-accent' : isActive ? 'text-foreground' : 'text-muted-foreground/50'
                }`}>
                  {step.label}
                </span>
                {isActive && (
                  <motion.div
                    className="ml-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <span className="text-xs text-primary font-semibold">processing...</span>
                  </motion.div>
                )}
                {isCompleted && (
                  <span className="ml-auto text-xs text-muted-foreground">done ✓</span>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-6 h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: '0%' }}
            animate={{ width: `${((completed.length) / AGENT_STEPS.length) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
};

export default AgentProgress;
