import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FormData, ProductIntakeAnalysis, mergeIntakePrefill, toQuestionnaireInput } from '@/data/types';
import HeroSection from '@/components/dragonway/HeroSection';
import ProductIntelligenceSection from '@/components/dragonway/ProductIntelligenceSection';
import QuestionnaireForm from '@/components/dragonway/QuestionnaireForm';
import { analyzeProductUrl, createCampaign } from '@/lib/api';

const SAMPLE_PRODUCT_URL = 'https://tomlinsonsdev.myshopify.com/products/zignature-catfish-dog-food';

const EMPTY_FORM: FormData = {
  product_url: '',
  food_format: '',
  pet_type: '',
  life_stage: [],
  core_claims: [],
  primary_goal: '',
  owner_pet: '',
  owner_city: '',
  owner_price: '',
  brand_positioning: '',
  preferred_platforms: [],
  content_preference: [],
  preferred_kol_type: '',
  budget_band: '',
  timeline: '',
  special_constraints: '',
};

const Index = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [intakeAnalysis, setIntakeAnalysis] = useState<ProductIntakeAnalysis | null>(null);
  const [intakeError, setIntakeError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const applyIntakeAnalysis = (analysis: ProductIntakeAnalysis) => {
    setIntakeAnalysis(analysis);
    setFormData((current) => mergeIntakePrefill({ ...current, product_url: analysis.product_data.source_url || current.product_url }, analysis));
  };

  const runProductScan = async (url = formData.product_url) => {
    try {
      setIntakeError(null);
      setIsAnalyzing(true);
      const analysis = await analyzeProductUrl(url);
      applyIntakeAnalysis(analysis);
    } catch (err) {
      setIntakeError(err instanceof Error ? err.message : 'Failed to analyze product URL.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDemoMode = async () => {
    setFormData((current) => ({ ...current, product_url: SAMPLE_PRODUCT_URL }));
    await runProductScan(SAMPLE_PRODUCT_URL);
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      setIsSubmitting(true);
      const response = await createCampaign(toQuestionnaireInput(formData));
      navigate(`/campaign/${response.campaign_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background dot-grid">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-bg border border-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">D</span>
            </div>
            <span className="font-semibold text-foreground text-sm">DragonWay Lab</span>
            <span className="text-muted-foreground text-xs hidden sm:inline">/ 入华引擎</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-10">
        <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1 }}>
          <HeroSection onDemoMode={handleDemoMode} />
          <ProductIntelligenceSection
            url={formData.product_url}
            onUrlChange={(value) => {
              setFormData((current) => ({ ...current, product_url: value }));
              setIntakeError(null);
            }}
            onAnalyze={() => runProductScan()}
            onUseSample={handleDemoMode}
            isAnalyzing={isAnalyzing}
            analysis={intakeAnalysis}
            error={intakeError}
          />
          {error && (
            <div className="glass-card max-w-2xl mx-auto mb-6 p-4 text-sm text-red-300 border-red-500/20">
              {error}
            </div>
          )}
          {intakeAnalysis && (
            <QuestionnaireForm
              formData={formData}
              onChange={setFormData}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-6 text-center">
        <p className="text-xs text-muted-foreground">DragonWay Lab — AI-Powered China Market Entry for Pet Brands</p>
      </footer>
    </div>
  );
};

export default Index;
