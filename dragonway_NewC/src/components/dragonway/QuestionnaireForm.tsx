import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, ArrowRight, Package, Target, ClipboardList } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormData } from '@/data/types';
import { useI18n } from '@/lib/i18n';
import {
  getFoodFormats, getPetTypes, getLifeStages, getCoreClaims,
  getPrimaryGoals, getOwnerPetOptions, getOwnerCityOptions,
  getOwnerPriceOptions, getBrandPositions, getPlatforms,
  getContentPrefs, getKolTypes, getBudgetBands, getTimelines,
} from '@/data/formOptions';

interface QuestionnaireFormProps {
  formData: FormData;
  onChange: (data: FormData) => void;
  onSubmit: () => void;
}

const ToggleChip = ({
  label, selected, onClick, disabled,
}: { label: string; selected: boolean; onClick: () => void; disabled?: boolean }) => (
  <motion.button
    type="button"
    onClick={onClick}
    disabled={disabled}
    whileTap={{ scale: 0.95 }}
    animate={selected ? { scale: [1, 1.05, 1] } : {}}
    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all border ${
      selected
        ? 'bg-primary/15 border-primary text-primary'
        : 'bg-secondary/50 border-border text-secondary-foreground hover:border-primary/20'
    } ${disabled && !selected ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    {label}
  </motion.button>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <Label className="text-sm font-semibold text-foreground/90 mb-2 block">{children}</Label>
);

const stepIcons = [Package, Target, ClipboardList];

const QuestionnaireForm = ({ formData, onChange, onSubmit }: QuestionnaireFormProps) => {
  const { t, locale } = useI18n();
  const [step, setStep] = useState(0);

  const update = (partial: Partial<FormData>) => onChange({ ...formData, ...partial });

  const toggleMulti = (field: keyof FormData, value: string, max?: number) => {
    const current = formData[field] as string[];
    if (current.includes(value)) {
      update({ [field]: current.filter(v => v !== value) });
    } else if (!max || current.length < max) {
      update({ [field]: [...current, value] });
    }
  };

  const sections = [
    // Step 0: Product basics
    <div key="basics" className="space-y-5">
      <div>
        <SectionLabel>{t('formProductUrl')}</SectionLabel>
        <div className="relative">
          <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={formData.product_url}
            onChange={e => update({ product_url: e.target.value })}
            placeholder={t('formUrlPlaceholder')}
            className="pl-10 bg-secondary/50 border-border rounded-full"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <SectionLabel>{t('formFoodFormat')}</SectionLabel>
          <Select value={formData.food_format} onValueChange={v => update({ food_format: v })}>
            <SelectTrigger className="bg-secondary/50"><SelectValue placeholder={t('formSelect')} /></SelectTrigger>
            <SelectContent>{getFoodFormats(locale).map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <SectionLabel>{t('formPetType')}</SectionLabel>
          <Select value={formData.pet_type} onValueChange={v => update({ pet_type: v })}>
            <SelectTrigger className="bg-secondary/50"><SelectValue placeholder={t('formSelect')} /></SelectTrigger>
            <SelectContent>{getPetTypes(locale).map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <SectionLabel>{t('formLifeStage')}</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {getLifeStages(locale).map(o => (
            <ToggleChip key={o.value} label={o.label} selected={formData.life_stage.includes(o.value)} onClick={() => toggleMulti('life_stage', o.value)} />
          ))}
        </div>
      </div>
      <div>
        <SectionLabel>{t('formCoreClaims')}</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {getCoreClaims(locale).map(o => (
            <ToggleChip key={o.value} label={o.label} selected={formData.core_claims.includes(o.value)} onClick={() => toggleMulti('core_claims', o.value, 3)} disabled={!formData.core_claims.includes(o.value) && formData.core_claims.length >= 3} />
          ))}
        </div>
      </div>
    </div>,

    // Step 1: Strategy
    <div key="strategy" className="space-y-5">
      <div>
        <SectionLabel>{t('formPrimaryGoal')}</SectionLabel>
        <Select value={formData.primary_goal} onValueChange={v => update({ primary_goal: v })}>
          <SelectTrigger className="bg-secondary/50"><SelectValue placeholder={t('formSelect')} /></SelectTrigger>
          <SelectContent>{getPrimaryGoals(locale).map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <SectionLabel>{t('formBrandPositioning')}</SectionLabel>
        <Select value={formData.brand_positioning} onValueChange={v => update({ brand_positioning: v })}>
          <SelectTrigger className="bg-secondary/50"><SelectValue placeholder={t('formSelect')} /></SelectTrigger>
          <SelectContent>{getBrandPositions(locale).map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <SectionLabel>{t('formTargetOwner')}</SectionLabel>
          <Select value={formData.owner_pet} onValueChange={v => update({ owner_pet: v })}>
            <SelectTrigger className="bg-secondary/50"><SelectValue placeholder={t('formSelect')} /></SelectTrigger>
            <SelectContent>{getOwnerPetOptions(locale).map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <SectionLabel>{t('formCityTier')}</SectionLabel>
          <Select value={formData.owner_city} onValueChange={v => update({ owner_city: v })}>
            <SelectTrigger className="bg-secondary/50"><SelectValue placeholder={t('formSelect')} /></SelectTrigger>
            <SelectContent>{getOwnerCityOptions(locale).map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <SectionLabel>{t('formPriceTier')}</SectionLabel>
          <Select value={formData.owner_price} onValueChange={v => update({ owner_price: v })}>
            <SelectTrigger className="bg-secondary/50"><SelectValue placeholder={t('formSelect')} /></SelectTrigger>
            <SelectContent>{getOwnerPriceOptions(locale).map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
    </div>,

    // Step 2: Content & Budget
    <div key="content" className="space-y-5">
      <div>
        <SectionLabel>{t('formPreferredPlatforms')}</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {getPlatforms(locale).map(o => (
            <ToggleChip key={o.value} label={o.label} selected={formData.preferred_platforms.includes(o.value)} onClick={() => toggleMulti('preferred_platforms', o.value)} />
          ))}
        </div>
      </div>
      <div>
        <SectionLabel>{t('formContentPref')}</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {getContentPrefs(locale).map(o => (
            <ToggleChip key={o.value} label={o.label} selected={formData.content_preference.includes(o.value)} onClick={() => toggleMulti('content_preference', o.value, 3)} disabled={!formData.content_preference.includes(o.value) && formData.content_preference.length >= 3} />
          ))}
        </div>
      </div>
      <div>
        <SectionLabel>{t('formKolType')}</SectionLabel>
        <Select value={formData.preferred_kol_type} onValueChange={v => update({ preferred_kol_type: v })}>
          <SelectTrigger className="bg-secondary/50"><SelectValue placeholder={t('formSelect')} /></SelectTrigger>
          <SelectContent>{getKolTypes(locale).map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <SectionLabel>{t('formBudgetRange')}</SectionLabel>
          <Select value={formData.budget_band} onValueChange={v => update({ budget_band: v })}>
            <SelectTrigger className="bg-secondary/50"><SelectValue placeholder={t('formSelect')} /></SelectTrigger>
            <SelectContent>{getBudgetBands(locale).map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <SectionLabel>{t('formTimeline')}</SectionLabel>
          <Select value={formData.timeline} onValueChange={v => update({ timeline: v })}>
            <SelectTrigger className="bg-secondary/50"><SelectValue placeholder={t('formSelect')} /></SelectTrigger>
            <SelectContent>{getTimelines(locale).map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <SectionLabel>{t('formConstraints')}</SectionLabel>
        <Textarea
          value={formData.special_constraints}
          onChange={e => update({ special_constraints: e.target.value })}
          placeholder={t('formConstraintsPlaceholder')}
          className="bg-secondary/50 border-border resize-none"
          rows={3}
        />
      </div>
    </div>,
  ];

  const stepLabels = [t('formStepProduct'), t('formStepStrategy'), t('formStepContent')];
  const isLastStep = step === sections.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-card p-6 md:p-8 max-w-2xl mx-auto"
    >
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {stepLabels.map((label, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
              i === step ? 'bg-primary/10 text-primary border border-primary/30' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {(() => { const StepIcon = stepIcons[i]; return <StepIcon className="w-4 h-4" />; })()}
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {sections[step]}

      <div className="flex justify-between mt-8">
        {step > 0 ? (
          <Button variant="ghost" onClick={() => setStep(s => s - 1)} className="text-muted-foreground rounded-full">{t('formBack')}</Button>
        ) : <div />}
        {isLastStep ? (
          <motion.div whileHover={{ scale: 1.03 }}>
            <Button onClick={onSubmit} className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 rounded-full font-semibold">
              {t('formStartMatching')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        ) : (
          <Button onClick={() => setStep(s => s + 1)} variant="ghost" className="text-primary hover:text-primary/80 rounded-full">
            {t('formNext')}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default QuestionnaireForm;
