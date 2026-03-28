import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, ArrowRight, ExternalLink, Users, Heart, DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FormData, KolProfile } from '@/data/types';
import { quickChatStart, quickChatTurn, QuickChatStep } from '@/lib/api';

interface ChatMessage {
  id: string;
  role: 'agent' | 'user';
  content: string;
}

const platformColors: Record<string, string> = {
  Xiaohongshu: 'bg-red-500/10 text-red-500 border-red-500/20',
  Douyin: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
};

const defaultFormData: FormData = {
  product_url: '',
  food_format: '',
  pet_type: '',
  life_stage: ['all_life'],
  core_claims: [],
  primary_goal: 'find_kol',
  owner_pet: 'dog_owner',
  owner_city: '',
  owner_price: '',
  brand_positioning: 'premium_import',
  preferred_platforms: [],
  content_preference: ['ingredient_review', 'dog_reaction'],
  preferred_kol_type: 'no_preference',
  budget_band: '',
  timeline: '1_month',
  special_constraints: '',
};

const FIXED_WELCOME_MESSAGES = [
  "Hi, I'm your DragonWay AI strategist.",
  "Paste your product URL and I'll build a China-ready KOL shortlist for you.",
];

const INITIAL_STEP: QuickChatStep = {
  step_id: 'welcome',
  input_type: 'url',
  field: 'product_url',
  placeholder: 'Paste your Shopify or brand link...',
};

const Avatar = ({ kol, size = 'w-9 h-9' }: { kol: KolProfile; size?: string }) => {
  if (kol.avatar) {
    return (
      <img
        src={kol.avatar}
        alt={kol.name}
        className={`${size} rounded-full object-cover shrink-0 border border-primary/15 bg-accent/10`}
      />
    );
  }
  return (
    <div className={`${size} rounded-full bg-accent/20 flex items-center justify-center text-sm font-bold text-accent shrink-0`}>
      {kol.name.charAt(0)}
    </div>
  );
};

const MiniKolCard = ({ kol, selectable, selected, onSelect }: {
  kol: KolProfile;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}) => (
  <div
    className={`glass-card-elevated p-4 cursor-pointer transition-all duration-200 hover:-translate-y-1 ${
      selectable ? 'hover:border-primary/40' : ''
    } ${selected ? 'border-primary/50 bg-primary/5' : ''}`}
    onClick={selectable ? onSelect : undefined}
  >
    <div className="flex items-center gap-2.5 mb-2">
      <Avatar kol={kol} />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <h4 className="font-semibold text-foreground text-sm truncate">{kol.name}</h4>
          {kol.profileUrl && (
            <a
              href={kol.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors shrink-0"
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border ${platformColors[kol.platform]}`}>
          {kol.platform}
        </span>
      </div>
    </div>
    <div className="grid grid-cols-3 gap-1.5 mb-2">
      <div className="text-center p-1.5 rounded-md bg-secondary/50">
        <Users className="w-3 h-3 mx-auto mb-0.5 text-muted-foreground" />
        <div className="text-xs font-semibold text-foreground">{kol.followers}</div>
      </div>
      <div className="text-center p-1.5 rounded-md bg-secondary/50">
        <Heart className="w-3 h-3 mx-auto mb-0.5 text-muted-foreground" />
        <div className="text-xs font-semibold text-foreground">{kol.engagement}</div>
      </div>
      <div className="text-center p-1.5 rounded-md bg-secondary/50">
        <DollarSign className="w-3 h-3 mx-auto mb-0.5 text-muted-foreground" />
        <div className="text-[10px] font-semibold text-foreground">{kol.priceRange.split('–')[0]}</div>
      </div>
    </div>
    <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2 mb-2">{kol.matchReason}</p>
    <div className="flex flex-wrap gap-1">
      {kol.contentTags.map(tag => (
        <span key={tag} className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-secondary text-secondary-foreground">{tag}</span>
      ))}
    </div>
    {selectable && (
      <div className={`mt-2 text-center text-xs font-medium py-1 rounded-md transition-all ${
        selected ? 'bg-destructive/15 text-destructive' : 'bg-secondary/50 text-muted-foreground'
      }`}>
        {selected ? '↻ Swap this one' : 'Tap to swap'}
      </div>
    )}
  </div>
);

interface ChatAgentProps {
  onComplete: (payload: { formData: FormData; sessionId?: string | null }) => void;
}

const ChatAgent = ({ onComplete }: ChatAgentProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [step, setStep] = useState<QuickChatStep | null>(INITIAL_STEP);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [previewKols, setPreviewKols] = useState<KolProfile[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [multiSelection, setMultiSelection] = useState<string[]>([]);
  const [swapKolId, setSwapKolId] = useState<string | null>(null);
  const [refineAnswer, setRefineAnswer] = useState<'reach' | 'conversion' | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [welcomeReady, setWelcomeReady] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initiated = useRef(false);
  const sessionBootstrapRef = useRef<Promise<{ session_id: string; step: QuickChatStep; form_data: FormData } | null> | null>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  const addAgentMessages = useCallback((contents: string[]) => {
    setMessages(prev => [
      ...prev,
      ...contents.map((content, index) => ({
        id: `agent-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
        role: 'agent' as const,
        content,
      })),
    ]);
  }, []);

  const addUserMessage = useCallback((content: string) => {
    setMessages(prev => [
      ...prev,
      {
        id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        role: 'user',
        content,
      },
    ]);
  }, []);

  const applyResponse = useCallback((response: { session_id: string; agent_messages: string[]; step: QuickChatStep; form_data: FormData }, options?: { appendMessages?: boolean }) => {
    const appendMessages = options?.appendMessages ?? true;
    setSessionId(response.session_id);
    setFormData(response.form_data);
    setStep(response.step);
    if (response.step.step_id === 'kol_results') {
      setPreviewKols(response.step.kols || []);
    }
    if (appendMessages) {
      addAgentMessages(response.agent_messages);
    }
    setLoadingMessage('');
    setMultiSelection([]);
    setRefineAnswer(null);
  }, [addAgentMessages]);

  useEffect(() => {
    if (initiated.current) return;
    initiated.current = true;
    const firstTimer = window.setTimeout(() => {
      setMessages([
        {
          id: 'welcome-0',
          role: 'agent',
          content: FIXED_WELCOME_MESSAGES[0],
        },
      ]);
    }, 120);
    const secondTimer = window.setTimeout(() => {
      setMessages([
        {
          id: 'welcome-0',
          role: 'agent',
          content: FIXED_WELCOME_MESSAGES[0],
        },
        {
          id: 'welcome-1',
          role: 'agent',
          content: FIXED_WELCOME_MESSAGES[1],
        },
      ]);
      setWelcomeReady(true);
    }, 720);
    sessionBootstrapRef.current = quickChatStart()
      .then(response => {
        applyResponse(response, { appendMessages: false });
        return response;
      })
      .catch(() => {
        addAgentMessages(['I could not connect to the live quick match session. Please refresh and try again.']);
        return null;
      })
      .finally(() => {
        sessionBootstrapRef.current = null;
      });
    return () => {
      window.clearTimeout(firstTimer);
      window.clearTimeout(secondTimer);
    };
  }, [addAgentMessages, applyResponse]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, step, loadingMessage, scrollToBottom]);

  const ensureSessionId = useCallback(async () => {
    if (sessionId) return sessionId;
    if (sessionBootstrapRef.current) {
      const response = await sessionBootstrapRef.current;
      return response?.session_id ?? null;
    }
    const response = await quickChatStart();
    applyResponse(response, { appendMessages: false });
    return response.session_id;
  }, [applyResponse, sessionId]);

  const submitTurn = useCallback(async (
    payload: { step_id: string; value?: string; values?: string[]; selected_kol_id?: string; preference?: 'reach' | 'conversion' },
    pendingMessage?: string,
  ) => {
    if (!step) return;
    setIsRequesting(true);
    setLoadingMessage(pendingMessage || '');
    try {
      const ensuredSessionId = await ensureSessionId();
      if (!ensuredSessionId) {
        throw new Error('The live quick match session is not ready yet. Please try again.');
      }
      const response = await quickChatTurn({
        session_id: ensuredSessionId,
        ...payload,
      });
      applyResponse(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The agent could not continue the conversation.';
      addAgentMessages([message]);
      setLoadingMessage('');
    } finally {
      setIsRequesting(false);
    }
  }, [addAgentMessages, applyResponse, ensureSessionId, step]);

  const handleUrlSubmit = () => {
    if (!step || !urlInput.trim() || isRequesting) return;
    addUserMessage(urlInput.trim());
    void submitTurn(
      { step_id: step.step_id, value: urlInput.trim() },
      'Analyzing your product page...'
    );
    setUrlInput('');
  };

  const handleSelect = (value: string, label: string) => {
    if (!step || isRequesting) return;
    addUserMessage(label);
    void submitTurn({ step_id: step.step_id, value });
  };

  const handleMultiSubmit = () => {
    if (!step || multiSelection.length === 0 || isRequesting) return;
    const labels = multiSelection.map(value => step.options?.find(option => option.value === value)?.label || value);
    addUserMessage(labels.join(', '));
    void submitTurn(
      { step_id: step.step_id, values: multiSelection },
      step.step_id === 'preferred_platforms' ? 'Matching your product with the China creator pool...' : undefined
    );
  };

  const handleSwapSubmit = () => {
    if (!step || !swapKolId || isRequesting) return;
    const kol = step.kols?.find(item => item.id === swapKolId);
    addUserMessage(`Swap out: ${kol?.name || swapKolId}`);
    void submitTurn({ step_id: step.step_id, selected_kol_id: swapKolId });
  };

  const handleRefineSubmit = () => {
    if (!step || !refineAnswer || !swapKolId || isRequesting) return;
    addUserMessage(refineAnswer === 'reach' ? 'Reach — I want maximum exposure' : 'Conversion — I want targeted results');
    void submitTurn(
      { step_id: step.step_id, preference: refineAnswer, selected_kol_id: swapKolId },
      'Optimizing your KOL mix...'
    );
  };

  const handleViewReport = () => {
    onComplete({ formData, sessionId });
  };

  const showInput = !!step && !isRequesting && (step.step_id !== 'welcome' || welcomeReady);
  const finalKols = step?.step_id === 'final' ? (step.kols || []) : [];

  return (
    <div className="flex flex-col h-full max-h-[70vh]">
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto space-y-4">
          <AnimatePresence initial={false}>
            {messages.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'agent' && (
                  <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center mr-2 mt-1 shrink-0">
                    <span className="text-sm">🐕</span>
                  </div>
                )}
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-secondary text-foreground rounded-bl-md'
                }`}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isRequesting && loadingMessage && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center mr-2 mt-1 shrink-0">
                <span className="text-sm">🐕</span>
              </div>
              <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <span className="text-sm text-muted-foreground">{loadingMessage}</span>
              </div>
            </motion.div>
          )}

          {showInput && step?.input_type === 'kol-cards' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-3"
            >
              <div className="grid gap-3 sm:grid-cols-3">
                {previewKols.map(kol => (
                  <MiniKolCard
                    key={kol.id}
                    kol={kol}
                    selectable
                    selected={swapKolId === kol.id}
                    onSelect={() => setSwapKolId(kol.id === swapKolId ? null : kol.id)}
                  />
                ))}
              </div>
              {swapKolId && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center">
                  <button
                    onClick={handleSwapSubmit}
                    className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all inline-flex items-center gap-2"
                  >
                    Confirm swap <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {showInput && step?.input_type === 'refine' && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-[640px] mx-auto">
              <div className="flex gap-2 justify-center mb-3">
                {[
                  { value: 'reach' as const, label: '📡 Reach — maximum exposure' },
                  { value: 'conversion' as const, label: '🎯 Conversion — targeted results' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setRefineAnswer(opt.value)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      refineAnswer === opt.value
                        ? 'bg-primary/15 text-primary border-primary/40'
                        : 'bg-secondary/60 text-secondary-foreground border-border/60 hover:border-primary/30'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {refineAnswer && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center">
                  <button
                    onClick={handleRefineSubmit}
                    className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all inline-flex items-center gap-2"
                  >
                    Optimize my KOL mix <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {showInput && step?.input_type === 'final' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {finalKols.map((kol, i) => {
                  const isNew = !previewKols.find(item => item.id === kol.id);
                  return (
                    <motion.div
                      key={kol.id}
                      initial={isNew ? { opacity: 0, y: 30 } : { opacity: 1 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: isNew ? 0.2 + i * 0.1 : 0 }}
                    >
                      <div className="relative">
                        {isNew && (
                          <span className="absolute -top-2 -right-2 z-10 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-glow-secondary/15 text-glow-secondary border border-glow-secondary/25">
                            New
                          </span>
                        )}
                        <MiniKolCard kol={kol} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <div className="flex justify-center pt-2">
                <button
                  onClick={handleViewReport}
                  className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all inline-flex items-center gap-2 text-sm"
                >
                  View Full Report <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {showInput && step && !['kol-cards', 'refine', 'final'].includes(step.input_type) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-border/50 bg-background/90 px-4 py-4"
        >
          <div className="mx-auto">
            {step.input_type === 'url' && (
              <div className="flex gap-2">
                <Input
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleUrlSubmit()}
                  placeholder={step.placeholder}
                  className="bg-secondary/50 border-border flex-1"
                  autoFocus
                />
                <button
                  onClick={handleUrlSubmit}
                  disabled={!urlInput.trim()}
                  className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}

            {step.input_type === 'select' && step.options && (
              <div className="flex flex-wrap gap-2 justify-center">
                {step.options.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleSelect(opt.value, opt.label)}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-secondary/60 text-secondary-foreground border border-border/60 hover:border-primary/40 hover:bg-primary/10 hover:text-primary transition-all"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {step.input_type === 'multi-select' && step.options && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 justify-center">
                  {step.options.map(opt => {
                    const sel = multiSelection.includes(opt.value);
                    const atMax = step.maxSelections && multiSelection.length >= step.maxSelections && !sel;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => {
                          if (sel) setMultiSelection(prev => prev.filter(v => v !== opt.value));
                          else if (!atMax) setMultiSelection(prev => [...prev, opt.value]);
                        }}
                        disabled={!!atMax}
                        className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                          sel
                            ? 'bg-primary/15 text-primary border-primary/40'
                            : atMax
                            ? 'bg-secondary/30 text-muted-foreground border-border/30 opacity-40 cursor-not-allowed'
                            : 'bg-secondary/60 text-secondary-foreground border-border/60 hover:border-primary/30'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                {multiSelection.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center">
                    <button
                      onClick={handleMultiSubmit}
                      className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all inline-flex items-center gap-2"
                    >
                      Confirm ({multiSelection.length}) <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ChatAgent;
