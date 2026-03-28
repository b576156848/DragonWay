import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, ArrowRight, ExternalLink, Users, Heart, DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FormData, KolProfile } from '@/data/types';
import {
  isKnownFastUrl,
  normalizeFormDataForApi,
  quickChatStart,
  quickChatTurn,
  quickChatTurnLive,
  quickMatchPreview,
} from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import {
  getFoodFormats,
  getPetTypes,
  getCoreClaims,
  getBudgetBands,
  getPlatforms,
} from '@/data/formOptions';

type LocalStepId =
  | 'welcome'
  | 'analyzing_url'
  | 'food_format'
  | 'pet_type'
  | 'core_claims'
  | 'budget_band'
  | 'preferred_platforms'
  | 'matching'
  | 'kol_results';

type LocalStep = {
  id: LocalStepId;
  inputType: 'url' | 'select' | 'multi-select' | 'loading' | 'kol-cards';
  field?: keyof FormData;
  options?: { value: string; label: string }[];
  maxSelections?: number;
};

interface ChatMessage {
  id: string;
  role: 'agent' | 'user';
  content?: string;
  component?: ReactNode;
}

type ProductPreview = {
  title: string;
  subtitle: string;
  image: string;
  bullets: string[];
};

interface ChatAgentProps {
  onComplete: (payload: { formData: FormData; sessionId?: string | null }) => void;
}

const DEFAULT_FORM_DATA: FormData = {
  product_url: '',
  food_format: '',
  pet_type: '',
  life_stage: ['all_life'],
  core_claims: [],
  primary_goal: 'find_kol',
  owner_pet: 'dog_owner',
  owner_city: 'any',
  owner_price: 'mid_high',
  brand_positioning: 'premium_import',
  preferred_platforms: [],
  content_preference: ['ingredient_review', 'dog_reaction'],
  preferred_kol_type: 'no_preference',
  budget_band: '',
  timeline: '1_month',
  special_constraints: '',
};

const FIXED_WELCOME_MESSAGES = {
  en: [
    "Hi, I'm your DragonWay AI strategist.",
    "Paste your product URL and I'll build a China-ready KOL shortlist for you.",
  ],
  zh: [
    '你好，我是你的 DragonWay AI strategist。',
    '把产品链接贴给我，我会为你生成一份适合中国市场的 KOL shortlist。',
  ],
};

const platformColors: Record<string, string> = {
  Xiaohongshu: 'bg-red-500/10 text-red-500 border-red-500/20',
  Douyin: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
};

const delay = (ms: number) => new Promise(resolve => window.setTimeout(resolve, ms));

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

const MiniKolCard = ({ kol, selectable, selected, onSelect, t }: {
  kol: KolProfile;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  t: (key: string) => string;
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
        {selected ? `↻ ${t('chatSwapThis')}` : t('chatTapToSwap')}
      </div>
    )}
  </div>
);

const ProductPreviewMessage = ({
  preview,
  facts,
}: {
  preview: ProductPreview;
  facts: string[];
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="grid gap-0 md:grid-cols-[200px_1fr]">
          <div className="bg-secondary/40">
            {imageFailed ? (
              <div className="flex h-44 w-full items-center justify-center bg-secondary/60 px-4 text-center text-xs text-muted-foreground md:h-full">
                Product preview image unavailable
              </div>
            ) : (
              <img
                src={preview.image}
                alt={preview.title}
                className="h-44 w-full object-cover md:h-full"
                onError={() => setImageFailed(true)}
              />
            )}
          </div>
          <div className="p-4 md:p-5">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-foreground">{preview.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{preview.subtitle}</p>
            </div>
            <div className="space-y-2.5">
              {preview.bullets.map(bullet => (
                <div key={bullet} className="flex gap-2 text-xs leading-relaxed text-foreground/85">
                  <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary/80" />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/70 p-3">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Structured Read
        </div>
        <div className="flex flex-wrap gap-2">
          {facts.map(fact => (
            <span
              key={fact}
              className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-medium text-foreground"
            >
              {fact}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const ChatAgent = ({ onComplete }: ChatAgentProps) => {
  const { t, locale } = useI18n();

  const stepOptions = {
    food_format: getFoodFormats(locale),
    pet_type: getPetTypes(locale),
    core_claims: getCoreClaims(locale),
    budget_band: getBudgetBands(locale),
    preferred_platforms: getPlatforms(locale),
  } satisfies Record<string, { value: string; label: string }[]>;

  const stepConfig: Record<LocalStepId, LocalStep> = {
    welcome: {
      id: 'welcome',
      inputType: 'url',
      field: 'product_url',
    },
    analyzing_url: {
      id: 'analyzing_url',
      inputType: 'loading',
    },
    food_format: {
      id: 'food_format',
      inputType: 'select',
      field: 'food_format',
      options: stepOptions.food_format,
    },
    pet_type: {
      id: 'pet_type',
      inputType: 'select',
      field: 'pet_type',
      options: stepOptions.pet_type,
    },
    core_claims: {
      id: 'core_claims',
      inputType: 'multi-select',
      field: 'core_claims',
      options: stepOptions.core_claims,
      maxSelections: 3,
    },
    budget_band: {
      id: 'budget_band',
      inputType: 'select',
      field: 'budget_band',
      options: stepOptions.budget_band,
    },
    preferred_platforms: {
      id: 'preferred_platforms',
      inputType: 'multi-select',
      field: 'preferred_platforms',
      options: stepOptions.preferred_platforms,
      maxSelections: 2,
    },
    matching: {
      id: 'matching',
      inputType: 'loading',
    },
    kol_results: {
      id: 'kol_results',
      inputType: 'kol-cards',
    },
  };

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStepId, setCurrentStepId] = useState<LocalStepId>('welcome');
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [previewKols, setPreviewKols] = useState<KolProfile[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [multiSelection, setMultiSelection] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [welcomeReady, setWelcomeReady] = useState(false);
  const initiated = useRef(false);
  const sessionBootstrapRef = useRef<Promise<{ session_id: string } | null> | null>(null);
  const backgroundParseRef = useRef<Promise<void> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentStep = stepConfig[currentStepId];

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  const addAgentMessages = useCallback((contents: string[]) => {
    const filtered = contents.filter(Boolean);
    if (filtered.length === 0) return;
    setMessages(prev => [
      ...prev,
      ...filtered.map((content, index) => ({
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

  const addAgentComponent = useCallback((component: ReactNode) => {
    setMessages(prev => [
      ...prev,
      {
        id: `agent-component-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        role: 'agent',
        component,
      },
    ]);
  }, []);

  const playAgentSequence = useCallback(async (items: Array<string | ReactNode>, gap = 520) => {
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      if (typeof item === 'string') {
        addAgentMessages([item]);
      } else {
        addAgentComponent(item);
      }
      if (index < items.length - 1) {
        await delay(gap);
      }
    }
  }, [addAgentComponent, addAgentMessages]);

  useEffect(() => {
    if (initiated.current) return;
    initiated.current = true;

    const welcomeMessages = FIXED_WELCOME_MESSAGES[locale];
    const firstTimer = window.setTimeout(() => {
      setMessages([
        {
          id: 'welcome-0',
          role: 'agent',
          content: welcomeMessages[0],
        },
      ]);
    }, 120);
    const secondTimer = window.setTimeout(() => {
      setMessages([
        {
          id: 'welcome-0',
          role: 'agent',
          content: welcomeMessages[0],
        },
        {
          id: 'welcome-1',
          role: 'agent',
          content: welcomeMessages[1],
        },
      ]);
      setWelcomeReady(true);
    }, 720);

    sessionBootstrapRef.current = quickChatStart()
      .then(response => ({ session_id: response.session_id }))
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
  }, [addAgentMessages, locale]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentStepId, isBusy, scrollToBottom]);

  const ensureSessionId = useCallback(async () => {
    if (sessionId) return sessionId;
    if (sessionBootstrapRef.current) {
      const response = await sessionBootstrapRef.current;
      if (response?.session_id) {
        setSessionId(response.session_id);
        return response.session_id;
      }
    }
    const response = await quickChatStart();
    setSessionId(response.session_id);
    return response.session_id;
  }, [sessionId]);

  const handleUrlSubmit = async () => {
    if (!urlInput.trim() || isBusy) return;

    const value = urlInput.trim();
    addUserMessage(value);
    setUrlInput('');
    setCurrentStepId('analyzing_url');
    setLoadingMessage(t('chatAnalyzing'));
    setIsBusy(true);

    try {
      const knownFastUrl = isKnownFastUrl(value);
      const ensuredSessionId = knownFastUrl ? (sessionId ?? 'pending') : await ensureSessionId();
      const [response] = await Promise.all([
        quickChatTurn({
          session_id: ensuredSessionId,
          step_id: 'welcome',
          value,
        }),
      ]);

      if (response.step.step_id === 'welcome') {
        addAgentMessages(response.agent_messages);
        setCurrentStepId('welcome');
        return;
      }

      if (response.session_id && response.session_id !== 'pending') {
        setSessionId(response.session_id);
      }
      setFormData(prev => ({
        ...prev,
        product_url: value,
        food_format: response.form_data.food_format,
        pet_type: response.form_data.pet_type,
        core_claims: response.form_data.core_claims,
      }));
      const formatLabel = stepOptions.food_format.find(option => option.value === response.form_data.food_format)?.label;
      const petTypeLabel = stepOptions.pet_type.find(option => option.value === response.form_data.pet_type)?.label;
      const claimLabels = response.form_data.core_claims
        .map(value => stepOptions.core_claims.find(option => option.value === value)?.label)
        .filter(Boolean) as string[];

      await playAgentSequence([
        ...response.agent_messages,
        ...(response.product_preview ? [
          <ProductPreviewMessage
            preview={response.product_preview}
            facts={[formatLabel, petTypeLabel, ...claimLabels].filter(Boolean)}
          />,
        ] : []),
        t('chatFoodFormat'),
      ], 650);
      setCurrentStepId('food_format');

      if (knownFastUrl) {
        backgroundParseRef.current = ensureSessionId()
          .then(realSessionId => quickChatTurnLive({
            session_id: realSessionId,
            step_id: 'welcome',
            value,
          }))
          .then(liveResponse => {
            if (liveResponse.session_id) {
              setSessionId(liveResponse.session_id);
            }
          })
          .catch(() => {})
          .finally(() => {
            backgroundParseRef.current = null;
          });
      }
    } catch (error) {
      addAgentMessages([
        error instanceof Error ? error.message : 'I could not analyze that product page. Please try another URL.',
      ]);
      setCurrentStepId('welcome');
    } finally {
      setIsBusy(false);
      setLoadingMessage('');
    }
  };

  const handleSelect = (value: string, label: string) => {
    if (isBusy || !currentStep.field) return;

    setFormData(prev => ({ ...prev, [currentStep.field as keyof FormData]: value }));
    addUserMessage(label);
    setMultiSelection([]);

    if (currentStepId === 'food_format') {
      addAgentMessages([t('chatPetType')]);
      setCurrentStepId('pet_type');
      return;
    }

    if (currentStepId === 'pet_type') {
      addAgentMessages([t('chatCoreClaims')]);
      setCurrentStepId('core_claims');
      return;
    }

    if (currentStepId === 'budget_band') {
      addAgentMessages([t('chatPlatforms')]);
      setCurrentStepId('preferred_platforms');
    }
  };

  const handleMultiSubmit = async () => {
    if (multiSelection.length === 0 || isBusy || !currentStep.field) return;

    const labels = multiSelection.map(value => currentStep.options?.find(option => option.value === value)?.label || value);
    const nextFormData = {
      ...formData,
      [currentStep.field]: multiSelection,
    } as FormData;

    setFormData(nextFormData);
    addUserMessage(labels.join(', '));
    setMultiSelection([]);

    if (currentStepId === 'core_claims') {
      addAgentMessages([t('chatBudgetBand')]);
      setCurrentStepId('budget_band');
      return;
    }

    if (currentStepId !== 'preferred_platforms') {
      return;
    }

    setCurrentStepId('matching');
    setLoadingMessage(t('chatMatching'));
    setIsBusy(true);

    try {
      if (backgroundParseRef.current) {
        await backgroundParseRef.current;
      }
      const startedAt = Date.now();
      const normalizedFormData = normalizeFormDataForApi(nextFormData);
      const response = await quickMatchPreview({
        session_id: sessionId ?? undefined,
        form_data: normalizedFormData,
        source: 'quick_chat',
      });
      const elapsed = Date.now() - startedAt;
      if (elapsed < 2000) {
        await delay(2000 - elapsed);
      }
      setSessionId(response.session_id);
      setPreviewKols(response.top_kols);
      setCurrentStepId('kol_results');
      addAgentMessages([response.summary]);
    } catch (error) {
      addAgentMessages([
        error instanceof Error ? error.message : 'I could not match creators for this product right now.',
      ]);
      setCurrentStepId('preferred_platforms');
    } finally {
      setIsBusy(false);
      setLoadingMessage('');
    }
  };

  const handleViewReport = () => {
    onComplete({ formData, sessionId });
  };

  const showInput =
    !isBusy &&
    currentStep.inputType !== 'loading' &&
    (currentStepId !== 'welcome' || welcomeReady);

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
                    <span className="text-[10px] font-bold text-primary">D</span>
                  </div>
                )}
                {msg.component ? (
                  <div className="max-w-[88%]">
                    {msg.component}
                  </div>
                ) : (
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-secondary text-foreground rounded-bl-md'
                  }`}>
                    {msg.content}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isBusy && loadingMessage && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center mr-2 mt-1 shrink-0">
                <span className="text-[10px] font-bold text-primary">D</span>
              </div>
              <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <span className="text-sm text-muted-foreground">{loadingMessage}</span>
              </div>
            </motion.div>
          )}

          {showInput && currentStepId === 'kol_results' && (
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
                    t={t}
                  />
                ))}
              </div>
              <div className="flex justify-center pt-2">
                <button
                  onClick={handleViewReport}
                  className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all inline-flex items-center gap-2 text-sm"
                >
                  {t('chatViewReport')} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {showInput && !['kol-cards', 'loading'].includes(currentStep.inputType) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-border/50 bg-background/90 px-4 py-4"
        >
          <div className="mx-auto">
            {currentStep.inputType === 'url' && (
              <div className="flex gap-2">
                <Input
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && void handleUrlSubmit()}
                  placeholder={t('chatUrlPlaceholder')}
                  className="bg-secondary/50 border-border flex-1"
                  autoFocus
                />
                <button
                  onClick={() => void handleUrlSubmit()}
                  disabled={!urlInput.trim() || isBusy}
                  className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}

            {currentStep.inputType === 'select' && currentStep.options && (
              <div className="flex flex-wrap gap-2 justify-center">
                {currentStep.options.map(opt => (
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

            {currentStep.inputType === 'multi-select' && currentStep.options && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 justify-center">
                  {currentStep.options.map(opt => {
                    const selected = multiSelection.includes(opt.value);
                    const atMax = currentStep.maxSelections && multiSelection.length >= currentStep.maxSelections && !selected;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => {
                          if (selected) {
                            setMultiSelection(prev => prev.filter(v => v !== opt.value));
                            return;
                          }
                          if (!atMax) {
                            setMultiSelection(prev => [...prev, opt.value]);
                          }
                        }}
                        disabled={!!atMax}
                        className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                          selected
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
                      onClick={() => void handleMultiSubmit()}
                      disabled={isBusy}
                      className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('chatConfirm')} ({multiSelection.length}) <ArrowRight className="w-4 h-4" />
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
