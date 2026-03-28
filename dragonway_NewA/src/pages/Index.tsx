import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormData, KolProfile, AnalysisResult } from '@/data/types';
import { DEMO_FORM_DATA } from '@/data/mockData';
import { submitAnalysis } from '@/lib/api';
import HeroSection from '@/components/dragonway/HeroSection';
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

const Index = () => {
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

  const handleModeSelect = useCallback((selected: 'quick' | 'detailed') => {
    if (mode === selected) return;
    if (chatStarted && mode === 'quick' && selected === 'detailed') {
      if (!window.confirm('Switching will reset your chat progress. Continue?')) return;
      setChatStarted(false);
    }
    setMode(selected);
    if (selected === 'quick') setChatStarted(true);
  }, [mode, chatStarted]);

  useEffect(() => {
    if (stage !== 'processing') return;
    if (!processingDone || !pendingResult) return;
    setAnalysisResult(pendingResult);
    setStage('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [stage, processingDone, pendingResult]);

  useEffect(() => {
    if (stage !== 'processing') return;
    if (!processingDone || !analysisError) return;
    window.alert(analysisError);
    setStage('input');
    setProcessingDone(false);
    setAnalysisError(null);
  }, [stage, processingDone, analysisError]);

  const startAnalysis = useCallback(async (
    nextFormData: FormData,
    source: 'quick_chat' | 'detailed_form',
    sessionId?: string | null,
  ) => {
    setFormData(nextFormData);
    setLeadSourceMode(source === 'quick_chat' ? 'quick' : 'detailed');
    setAnalysisSessionId(sessionId ?? null);
    setPendingResult(null);
    setAnalysisError(null);
    setProcessingDone(false);
    setStage('processing');
    try {
      const response = await submitAnalysis({
        session_id: sessionId ?? undefined,
        form_data: nextFormData,
        source,
      });
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
    setFormData(DEMO_FORM_DATA);
    setMode('detailed');
  }, []);

  const handleKolRefined = useCallback((newKols: KolProfile[]) => {
    if (!analysisResult) return;
    setAnalysisResult({
      ...analysisResult,
      kols: newKols,
    });
  }, [analysisResult]);

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
            <span className="text-muted-foreground text-xs hidden sm:inline">/ 入华引擎</span>
          </div>
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
              New Analysis
            </button>
          )}
        </div>
      </header>

      {/* Input stage */}
      {stage === 'input' && (
        <div className="max-w-5xl mx-auto px-4 pt-16 pb-12">
          <HeroSection onDemoMode={handleDemoMode} />
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
      )}

      {/* Processing stage */}
      {stage === 'processing' && (
        <div className="max-w-2xl mx-auto px-4 py-24">
          <AgentProgress onComplete={() => {
            setProcessingDone(true);
          }} />
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
              <h1 className="text-2xl font-display font-semibold text-foreground mb-1">Your China Market Plan</h1>
              <p className="text-muted-foreground text-sm">AI-generated analysis and KOL matching results</p>
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
        <div className="text-2xl opacity-30 mb-2">🐾🐾🐾</div>
        <p className="text-xs text-muted-foreground">DragonWay Lab — AI-Powered China Market Entry for Pet Brands</p>
      </footer>
    </div>
  );
};

export default Index;
