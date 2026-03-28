import { motion } from 'framer-motion';
import { MessageCircle, ClipboardList } from 'lucide-react';

export type EntryMode = 'choosing' | 'quick' | 'detailed';

interface ModeSelectorProps {
  mode: EntryMode;
  onSelect: (mode: 'quick' | 'detailed') => void;
}

const ModeSelector = ({ mode, onSelect }: ModeSelectorProps) => {
  const cards = [
    {
      id: 'quick' as const,
      icon: MessageCircle,
      title: 'Quick Match',
      subtitle: 'Chat with our Agent — 2 min, 6 questions',
      description: 'Paste your product link, answer a few quick questions, get KOL recommendations instantly.',
      badge: 'Recommended',
    },
    {
      id: 'detailed' as const,
      icon: ClipboardList,
      title: 'Detailed Brief',
      subtitle: 'Full questionnaire — 3 min, 13 questions',
      description: 'Provide a complete brand brief for more precise matching and strategy.',
      badge: null,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"
    >
      {cards.map((card) => {
        const selected = mode === card.id;
        const Icon = card.icon;

        return (
          <motion.button
            key={card.id}
            onClick={() => onSelect(card.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`relative glass-card p-5 text-left transition-all duration-200 ${
              selected
                ? 'border-primary ring-2 ring-primary/20'
                : 'hover:border-primary/40'
            }`}
          >
            {card.badge && (
              <span className="absolute -top-2.5 right-3 px-3 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary border border-primary/25">
                {card.badge}
              </span>
            )}

            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
              <Icon className="w-5 h-5 text-primary" />
            </div>

            <h3 className="font-display text-base font-semibold text-foreground mb-0.5">{card.title}</h3>
            <p className="text-xs text-primary/80 font-semibold mb-2">{card.subtitle}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{card.description}</p>
          </motion.button>
        );
      })}
    </motion.div>
  );
};

export default ModeSelector;
