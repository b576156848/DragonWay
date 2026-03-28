import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormData, AnalysisResult, AudienceData } from '@/data/types';
import { useI18n } from '@/lib/i18n';
import { normalizeFormDataForApi, submitAnalysis } from '@/lib/api';
import HeroSection from '@/components/dragonway/HeroSection';
import WorkflowSection from '@/components/dragonway/WorkflowSection';

import ModeSelector, { EntryMode } from '@/components/dragonway/ModeSelector';
import ChatAgent from '@/components/dragonway/ChatAgent';
import QuestionnaireForm from '@/components/dragonway/QuestionnaireForm';
import AgentProgress from '@/components/dragonway/AgentProgress';
import OpportunityCards from '@/components/dragonway/OpportunityCards';
import KolCards from '@/components/dragonway/KolCards';
import AudienceCharts from '@/components/dragonway/AudienceCharts';
import CampaignContentSection from '@/components/dragonway/CampaignContent';
import PushStatus from '@/components/dragonway/PushStatus';
import EmailCapture from '@/components/dragonway/EmailCapture';

type Stage = 'input' | 'processing' | 'results';

const delay = (ms: number) => new Promise(resolve => window.setTimeout(resolve, ms));

const SAMPLE_PRODUCT_URL = 'https://tomlinsonsdev.myshopify.com/products/zignature-catfish-dog-food';

const SAMPLE_DETAILED_FORM_DATA: FormData = {
  product_url: SAMPLE_PRODUCT_URL,
  food_format: 'dry',
  pet_type: 'dog',
  life_stage: ['adult', 'all_life'],
  core_claims: ['limited_ingredient', 'grain_free', 'high_protein'],
  primary_goal: 'find_kol',
  owner_pet: 'dog_owner',
  owner_city: 'tier1',
  owner_price: 'mid_high',
  brand_positioning: 'premium_import',
  preferred_platforms: ['xiaohongshu', 'douyin'],
  content_preference: ['ingredient_review', 'educational', 'dog_reaction'],
  preferred_kol_type: 'expert',
  budget_band: '10k_30k',
  timeline: '1_month',
  special_constraints: '',
};

const Index = () => {
  const { t, locale, toggleLocale } = useI18n();
  const [stage, setStage] = useState<Stage>('input');
  const [mode, setMode] = useState<EntryMode>('choosing');
  const [formData, setFormData] = useState<FormData>({
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
  });
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisSessionId, setAnalysisSessionId] = useState<string | null>(null);
  const [chatStarted, setChatStarted] = useState(false);
  const [processingDone, setProcessingDone] = useState(false);
  const [pendingResult, setPendingResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [leadSourceMode, setLeadSourceMode] = useState<'quick' | 'detailed'>('quick');
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const ctaRef = useRef<HTMLDivElement>(null);
  const workflowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  useEffect(() => {
    if (stage !== 'processing' || !processingDone || !pendingResult) return;
    setAnalysisResult(pendingResult);
    setStage('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [stage, processingDone, pendingResult]);

  useEffect(() => {
    if (stage !== 'processing' || !processingDone || !analysisError) return;
    window.alert(analysisError);
    setStage('input');
    setProcessingDone(false);
    setAnalysisError(null);
  }, [stage, processingDone, analysisError]);

  const handleModeSelect = useCallback((selected: 'quick' | 'detailed') => {
    if (mode === selected) return;
    if (chatStarted && mode === 'quick' && selected === 'detailed') {
      if (!window.confirm('Switching will reset your chat progress. Continue?')) return;
      setChatStarted(false);
    }
    setMode(selected);
    if (selected === 'quick') setChatStarted(true);
  }, [mode, chatStarted]);

  const startAnalysis = useCallback(async (
    nextFormData: FormData,
    source: 'quick_chat' | 'detailed_form',
    sessionId?: string | null,
  ) => {
    const normalizedFormData = normalizeFormDataForApi(nextFormData);
    setFormData(nextFormData);
    setLeadSourceMode(source === 'quick_chat' ? 'quick' : 'detailed');
    setAnalysisSessionId(sessionId ?? null);
    setPendingResult(null);
    setAnalysisError(null);
    setProcessingDone(false);
    setStage('processing');
    try {
      const startedAt = Date.now();
      const response = await submitAnalysis({
        session_id: sessionId ?? undefined,
        form_data: normalizedFormData,
        source,
      });
      const elapsed = Date.now() - startedAt;
      if (elapsed < 5000) {
        await delay(5000 - elapsed);
      }
      setPendingResult(response.result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate analysis.';
      setAnalysisError(message);
    }
  }, []);

  const handleChatComplete = useCallback((payload: { formData: FormData; sessionId?: string | null }) => {
    void startAnalysis(payload.formData, 'quick_chat', payload.sessionId);
  }, [startAnalysis]);

  const handleQuestionnaireSubmit = useCallback(() => {
    void startAnalysis(formData, 'detailed_form');
  }, [formData, startAnalysis]);

  const handleDemoMode = useCallback(() => {
    setFormData(SAMPLE_DETAILED_FORM_DATA);
    setMode('detailed');
    setChatStarted(false);
    // scroll to CTA section
    setTimeout(() => ctaRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, []);

  const scrollToCta = useCallback(() => {
    ctaRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const scrollToWorkflow = useCallback(() => {
    workflowRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleKolRefined = useCallback((payload: { kols: AnalysisResult['kols']; audience: AudienceData }) => {
    setAnalysisResult(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        kols: payload.kols,
        audience: payload.audience,
      };
    });
  }, []);

  return (
    <div className="min-h-screen bg-background dot-grid">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl gradient-bg border border-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">D</span>
            </div>
            <span className="font-display font-semibold text-foreground text-sm">DragonWay Lab</span>
            <span className="text-muted-foreground text-xs hidden sm:inline">/ InChina Engine</span>
          </div>
          <div className="flex items-center gap-3">
            {stage === 'results' && (
              <button
                onClick={() => {
                  setStage('input');
                  setMode('choosing');
                  setChatStarted(false);
                  setAnalysisResult(null);
                  setAnalysisSessionId(null);
                  setPendingResult(null);
                  setAnalysisError(null);
                  setProcessingDone(false);
                }}
                className="text-xs text-muted-foreground hover:text-primary transition-colors font-semibold"
              >
                {t('newAnalysis')}
              </button>
            )}
            <button
              onClick={toggleLocale}
              className="w-8 h-8 rounded-lg border border-border/60 bg-secondary/50 flex items-center justify-center hover:border-primary/40 transition-all"
              aria-label="Toggle language"
            >
              <motion.span
                key={locale}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="text-[10px] font-bold text-foreground"
              >
                {locale === 'en' ? '中' : 'EN'}
              </motion.span>
            </button>
            <button
              onClick={() => {
                const next = !isDark;
                setIsDark(next);
                document.documentElement.classList.toggle('dark', next);
                localStorage.setItem('theme', next ? 'dark' : 'light');
              }}
              className="w-8 h-8 rounded-lg border border-border/60 bg-secondary/50 flex items-center justify-center hover:border-primary/40 transition-all"
              aria-label="Toggle dark mode"
            >
              <motion.div
                key={isDark ? 'moon' : 'sun'}
                initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.25 }}
              >
                {isDark ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-foreground"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-foreground"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                )}
              </motion.div>
            </button>
          </div>
        </div>
      </header>

      {stage === 'input' && (
        <>
          {/* Section 1: Hero */}
          <div className="max-w-5xl mx-auto px-4 pt-16 pb-8">
            <HeroSection onDemoMode={handleDemoMode} onSeeHow={scrollToWorkflow} onScrollToCta={scrollToCta} />
          </div>

          {/* Section 2: Workflow */}
          <div ref={workflowRef}>
            <WorkflowSection />
          </div>


          {/* Section 4: CTA + Demo */}
          <div ref={ctaRef} className="max-w-5xl mx-auto px-4 pt-12 pb-16">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <h2 className="font-display text-2xl md:text-3xl font-semibold text-foreground mb-2">
                {t('ctaTitle')}
              </h2>
              <p className="text-sm text-muted-foreground">{t('ctaHelper')}</p>
            </motion.div>

            <ModeSelector mode={mode} onSelect={handleModeSelect} />

            <AnimatePresence mode="wait">
              {mode === 'quick' && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  className="max-w-2xl mx-auto overflow-hidden"
                >
                  <div className="glass-card overflow-hidden" style={{ maxHeight: '70vh' }}>
                    <ChatAgent onComplete={handleChatComplete} />
                  </div>
                </motion.div>
              )}

              {mode === 'detailed' && (
                <motion.div
                  key="detailed"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                >
                  <QuestionnaireForm
                    formData={formData}
                    onChange={setFormData}
                    onSubmit={handleQuestionnaireSubmit}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* Processing stage */}
      {stage === 'processing' && (
        <div className="max-w-2xl mx-auto px-4 py-24">
          <AgentProgress
            ready={pendingResult !== null || analysisError !== null}
            onComplete={() => {
            setProcessingDone(true);
            }}
          />
        </div>
      )}

      {/* Results stage */}
      <AnimatePresence mode="wait">
        {stage === 'results' && (
          <motion.main
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-5xl mx-auto px-4 py-10"
          >
            <div className="mb-8">
              <h1 className="text-2xl font-display font-semibold text-foreground mb-1">{t('resultsTitle')}</h1>
              <p className="text-muted-foreground text-sm">{t('resultsSubtitle')}</p>
            </div>
            {analysisResult && (
              <>
                <OpportunityCards opportunities={analysisResult.opportunities} />
                <KolCards
                  kols={analysisResult.kols}
                  formData={formData}
                  sessionId={analysisSessionId}
                  onRefined={handleKolRefined}
                />
                <AudienceCharts audience={analysisResult.audience} />
                <CampaignContentSection campaign={analysisResult.campaign} />
                <PushStatus />
                <EmailCapture formData={formData} sourceMode={leadSourceMode} />
              </>
            )}
          </motion.main>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="py-6 text-center">
        <div className="w-16 h-px bg-border/50 mx-auto mb-3" />
        <p className="text-xs text-muted-foreground">{t('footerText')}</p>
      </footer>
    </div>
  );
};

export default Index;
