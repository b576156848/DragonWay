import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Heart, DollarSign, ExternalLink, Check, X, Sparkles, ShieldCheck } from 'lucide-react';
import { AudienceData, FormData, KolProfile } from '@/data/types';
import { normalizeFormDataForApi, quickRefineMatches } from '@/lib/api';

const platformColors: Record<string, string> = {
  Xiaohongshu: 'bg-red-500/10 text-red-500 border-red-500/20',
  Douyin: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
};

const Avatar = ({ kol }: { kol: KolProfile }) => {
  if (kol.avatar) {
    return (
      <img
        src={kol.avatar}
        alt={kol.name}
        className="w-11 h-11 rounded-full object-cover border border-primary/15 bg-accent/10"
      />
    );
  }
  return (
    <div className="w-11 h-11 rounded-full bg-accent/20 flex items-center justify-center text-lg font-bold text-accent">
      {kol.name.charAt(0)}
    </div>
  );
};

interface RefinementAnswers {
  priority: 'viral' | 'conversion' | 'endorsement';
  budget: 'keep' | 'increase';
  style: 'educational' | 'lifestyle' | 'comedy';
}

interface KolCardsProps {
  kols: KolProfile[];
  formData: FormData;
  sessionId?: string | null;
  onRefined?: (payload: { kols: KolProfile[]; audience: AudienceData }) => void;
}

const KolCard = ({
  kol,
  showActions,
  status,
  onKeep,
  onDrop,
}: {
  kol: KolProfile;
  showActions: boolean;
  status?: 'kept' | 'dropped' | 'new';
  onKeep?: () => void;
  onDrop?: () => void;
}) => {
  const [action, setAction] = useState<'keep' | 'drop' | null>(null);

  const handleKeep = () => {
    const next = action === 'keep' ? null : 'keep';
    setAction(next);
    if (next === 'keep') onKeep?.();
    else onDrop?.();
  };

  const handleDrop = () => {
    const next = action === 'drop' ? null : 'drop';
    setAction(next);
    if (next === 'drop') onDrop?.();
    else onKeep?.();
  };

  return (
    <div className="glass-card-elevated p-5 flex flex-col relative transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      {status === 'kept' && (
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-accent/15 text-accent border border-accent/25">
            <ShieldCheck className="w-3 h-3" /> Confirmed
          </span>
        </div>
      )}
      {status === 'new' && (
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary/15 text-primary border border-primary/25">
            <Sparkles className="w-3 h-3" /> New Pick
          </span>
        </div>
      )}

      {showActions && !status && (
        <div className="absolute top-3 right-3 flex gap-1.5">
          <button
            onClick={handleKeep}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all ${
              action === 'keep'
                ? 'bg-accent/20 text-accent border-accent/30'
                : 'bg-secondary/50 text-muted-foreground border-border/50 hover:border-accent/30 hover:text-accent'
            }`}
          >
            <Check className="w-3 h-3" /> Keep
          </button>
          <button
            onClick={handleDrop}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all ${
              action === 'drop'
                ? 'bg-destructive/20 text-destructive border-destructive/30'
                : 'bg-secondary/50 text-muted-foreground border-border/50 hover:border-destructive/30 hover:text-destructive'
            }`}
          >
            <X className="w-3 h-3" /> Replace
          </button>
        </div>
      )}

      <div className="mb-4 pr-20">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-accent/15 text-accent border border-accent/20">
          {kol.badge}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Avatar kol={kol} />
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-foreground text-sm">{kol.name}</h3>
            {kol.profileUrl && (
              <a href={kol.profileUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${platformColors[kol.platform]}`}>
            {kol.platform}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 rounded-xl bg-secondary/50">
          <Users className="w-3.5 h-3.5 mx-auto mb-1 text-muted-foreground" />
          <div className="text-sm font-semibold text-foreground">{kol.followers}</div>
          <div className="text-[10px] text-muted-foreground">Followers</div>
        </div>
        <div className="text-center p-2 rounded-xl bg-secondary/50">
          <Heart className="w-3.5 h-3.5 mx-auto mb-1 text-muted-foreground" />
          <div className="text-sm font-semibold text-foreground">{kol.engagement}</div>
          <div className="text-[10px] text-muted-foreground">Engagement</div>
        </div>
        <div className="text-center p-2 rounded-xl bg-secondary/50">
          <DollarSign className="w-3.5 h-3.5 mx-auto mb-1 text-muted-foreground" />
          <div className="text-xs font-semibold text-foreground">{kol.priceRange.split('–')[0]}</div>
          <div className="text-[10px] text-muted-foreground">From</div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed mb-4 flex-1">{kol.matchReason}</p>

      <div className="flex flex-wrap gap-1.5">
        {kol.contentTags.map(tag => (
          <span key={tag} className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-secondary-foreground">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};

const RefinementBlock = ({ onRefine }: { onRefine: (answers: RefinementAnswers) => void }) => {
  const [priority, setPriority] = useState<RefinementAnswers['priority'] | ''>('');
  const [budget, setBudget] = useState<RefinementAnswers['budget'] | ''>('');
  const [style, setStyle] = useState<RefinementAnswers['style'] | ''>('');

  const RadioGroup = ({ label, value, onChange, options }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
  }) => (
    <div>
      <p className="text-sm font-semibold text-foreground mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              value === opt.value
                ? 'bg-primary/15 text-primary border-primary/30'
                : 'bg-secondary/50 text-muted-foreground border-border/50 hover:border-primary/20'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );

  const canSubmit = priority && budget && style;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card glow-border p-6 mt-6"
    >
      <h3 className="text-base font-display font-semibold text-foreground mb-1">Optimize Recommendations</h3>
      <p className="text-xs text-muted-foreground mb-5">Answer these questions and we will rebalance the KOL mix.</p>

      <div className="space-y-5">
        <RadioGroup
          label="What matters most?"
          value={priority}
          onChange={value => setPriority(value as RefinementAnswers['priority'])}
          options={[
            { value: 'viral', label: 'Broader reach' },
            { value: 'conversion', label: 'Stronger conversion' },
            { value: 'endorsement', label: 'Expert endorsement' },
          ]}
        />
        <RadioGroup
          label="Can budget flex?"
          value={budget}
          onChange={value => setBudget(value as RefinementAnswers['budget'])}
          options={[
            { value: 'keep', label: 'Keep it flat' },
            { value: 'increase', label: 'Can increase' },
          ]}
        />
        <RadioGroup
          label="Preferred content style?"
          value={style}
          onChange={value => setStyle(value as RefinementAnswers['style'])}
          options={[
            { value: 'educational', label: 'Educational' },
            { value: 'lifestyle', label: 'Lifestyle' },
            { value: 'comedy', label: 'Comedy / Creative' },
          ]}
        />
      </div>

      <motion.button
        onClick={() => {
          if (!canSubmit) return;
          onRefine({
            priority: priority as RefinementAnswers['priority'],
            budget: budget as RefinementAnswers['budget'],
            style: style as RefinementAnswers['style'],
          });
        }}
        disabled={!canSubmit}
        whileHover={canSubmit ? { scale: 1.03 } : {}}
        className={`mt-6 w-full py-2.5 rounded-full text-sm font-semibold transition-all ${
          canSubmit
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'bg-secondary text-muted-foreground cursor-not-allowed'
        }`}
      >
        🐾 Optimize My KOL Mix
      </motion.button>
    </motion.div>
  );
};

const KolCards = ({ kols, formData, sessionId, onRefined }: KolCardsProps) => {
  const [round, setRound] = useState<1 | 2>(kols.length >= 4 ? 2 : 1);
  const [keptIds, setKeptIds] = useState<Set<string>>(new Set());
  const [droppedId, setDroppedId] = useState<string | null>(null);
  const [refinedKols, setRefinedKols] = useState<KolProfile[]>(kols.length >= 4 ? kols : []);
  const [isRefining, setIsRefining] = useState(false);

  useEffect(() => {
    if (kols.length >= 4) {
      setRound(2);
      setRefinedKols(kols);
      setKeptIds(new Set());
      setDroppedId(null);
      return;
    }

    setRound(1);
    setRefinedKols([]);
    setKeptIds(new Set());
    setDroppedId(null);
  }, [kols]);

  const handleKolAction = (kolId: string, action: 'keep' | 'drop') => {
    if (action === 'keep') {
      setKeptIds(prev => {
        const next = new Set(prev);
        next.add(kolId);
        return next;
      });
      if (droppedId === kolId) setDroppedId(null);
      return;
    }

    setDroppedId(kolId);
    setKeptIds(prev => {
      const next = new Set(prev);
      next.delete(kolId);
      return next;
    });
  };

  const handleRefine = async (answers: RefinementAnswers) => {
    setIsRefining(true);
    try {
      const response = await quickRefineMatches({
        session_id: sessionId ?? undefined,
        form_data: normalizeFormDataForApi(formData),
        initial_kols: kols,
        kept_kol_ids: Array.from(keptIds),
        dropped_kol_id: droppedId ?? undefined,
        answers,
      });
      setRefinedKols(response.refined_kols);
      setRound(2);
      onRefined?.({
        kols: response.refined_kols,
        audience: response.refined_audience,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to refine KOLs.';
      window.alert(message);
    } finally {
      setIsRefining(false);
    }
  };

  if (isRefining) {
    return (
      <section className="mb-12">
        <h2 className="text-xl font-display font-semibold text-foreground mb-1">Optimizing KOL Combination...</h2>
        <p className="text-sm text-muted-foreground mb-6">Re-ranking creators based on your new preferences.</p>
        <div className="glass-card p-10 flex flex-col items-center justify-center gap-4">
          <span className="text-4xl animate-bounce-emoji">🐕</span>
          <p className="text-sm text-muted-foreground">AI is optimizing your KOL mix...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-1">
        <h2 className="text-xl font-display font-semibold text-foreground">
          {round === 1 ? 'Top 3 KOL Recommendations' : 'Optimized KOL Combination'}
        </h2>
        {round === 2 && (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary/15 text-primary border border-primary/20">
            Round 2
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        {round === 1
          ? 'AI-matched creators for your product and audience — select which to keep'
          : `${refinedKols.length} creators optimized based on your preferences`}
      </p>

      <div className={`grid gap-4 ${round === 2 ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'}`}>
        <AnimatePresence mode="popLayout">
          {round === 1 &&
            kols.map((kol, index) => (
              <motion.div
                key={kol.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.12 }}
                layout
              >
                <KolCard
                  kol={kol}
                  showActions={true}
                  onKeep={() => handleKolAction(kol.id, 'keep')}
                  onDrop={() => handleKolAction(kol.id, 'drop')}
                />
              </motion.div>
            ))}
          {round === 2 &&
            refinedKols.map((kol, index) => {
              const isKept = keptIds.has(kol.id);
              const isNew = !kols.find(item => item.id === kol.id);
              return (
                <motion.div
                  key={kol.id}
                  initial={isNew ? { opacity: 0, y: 40 } : { opacity: 1, y: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: isNew ? 0.3 + index * 0.15 : 0 }}
                  layout
                >
                  <KolCard
                    kol={kol}
                    showActions={false}
                    status={isKept ? 'kept' : isNew ? 'new' : undefined}
                  />
                </motion.div>
              );
            })}
        </AnimatePresence>
      </div>

      {round === 1 && <RefinementBlock onRefine={handleRefine} />}
    </section>
  );
};

export default KolCards;
