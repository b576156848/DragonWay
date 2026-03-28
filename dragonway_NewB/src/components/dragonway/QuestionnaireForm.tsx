import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, ArrowRight, Package, Target, ClipboardList } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormData } from '@/data/types';
import {
  FOOD_FORMATS, PET_TYPES, LIFE_STAGES, CORE_CLAIMS,
  PRIMARY_GOALS, OWNER_PET_OPTIONS, OWNER_CITY_OPTIONS,
  OWNER_PRICE_OPTIONS, BRAND_POSITIONS, PLATFORMS,
  CONTENT_PREFS, KOL_TYPES, BUDGET_BANDS, TIMELINES,
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
        <SectionLabel>Product URL</SectionLabel>
        <div className="relative">
          <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={formData.product_url}
            onChange={e => update({ product_url: e.target.value })}
            placeholder="https://shopify.com/products/your-product"
            className="pl-10 bg-secondary/50 border-border rounded-full"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <SectionLabel>Food Format</SectionLabel>
          <Select value={formData.food_format} onValueChange={v => update({ food_format: v })}>
            <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{FOOD_FORMATS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <SectionLabel>Pet Type</SectionLabel>
          <Select value={formData.pet_type} onValueChange={v => update({ pet_type: v })}>
            <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{PET_TYPES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <SectionLabel>Life Stage</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {LIFE_STAGES.map(o => (
            <ToggleChip key={o.value} label={o.label} selected={formData.life_stage.includes(o.value)} onClick={() => toggleMulti('life_stage', o.value)} />
          ))}
        </div>
      </div>
      <div>
        <SectionLabel>Core Claims (max 3)</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {CORE_CLAIMS.map(o => (
            <ToggleChip key={o.value} label={o.label} selected={formData.core_claims.includes(o.value)} onClick={() => toggleMulti('core_claims', o.value, 3)} disabled={!formData.core_claims.includes(o.value) && formData.core_claims.length >= 3} />
          ))}
        </div>
      </div>
    </div>,

    // Step 1: Strategy
    <div key="strategy" className="space-y-5">
      <div>
        <SectionLabel>Primary Goal</SectionLabel>
        <Select value={formData.primary_goal} onValueChange={v => update({ primary_goal: v })}>
          <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>{PRIMARY_GOALS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <SectionLabel>Brand Positioning</SectionLabel>
        <Select value={formData.brand_positioning} onValueChange={v => update({ brand_positioning: v })}>
          <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>{BRAND_POSITIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <SectionLabel>Target Owner</SectionLabel>
          <Select value={formData.owner_pet} onValueChange={v => update({ owner_pet: v })}>
            <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{OWNER_PET_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <SectionLabel>City Tier</SectionLabel>
          <Select value={formData.owner_city} onValueChange={v => update({ owner_city: v })}>
            <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{OWNER_CITY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <SectionLabel>Price Tier</SectionLabel>
          <Select value={formData.owner_price} onValueChange={v => update({ owner_price: v })}>
            <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{OWNER_PRICE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
    </div>,

    // Step 2: Content & Budget
    <div key="content" className="space-y-5">
      <div>
        <SectionLabel>Preferred Platforms</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map(o => (
            <ToggleChip key={o.value} label={o.label} selected={formData.preferred_platforms.includes(o.value)} onClick={() => toggleMulti('preferred_platforms', o.value)} />
          ))}
        </div>
      </div>
      <div>
        <SectionLabel>Content Preference (max 3)</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {CONTENT_PREFS.map(o => (
            <ToggleChip key={o.value} label={o.label} selected={formData.content_preference.includes(o.value)} onClick={() => toggleMulti('content_preference', o.value, 3)} disabled={!formData.content_preference.includes(o.value) && formData.content_preference.length >= 3} />
          ))}
        </div>
      </div>
      <div>
        <SectionLabel>Preferred KOL Type</SectionLabel>
        <Select value={formData.preferred_kol_type} onValueChange={v => update({ preferred_kol_type: v })}>
          <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>{KOL_TYPES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <SectionLabel>Budget Range</SectionLabel>
          <Select value={formData.budget_band} onValueChange={v => update({ budget_band: v })}>
            <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{BUDGET_BANDS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <SectionLabel>Timeline</SectionLabel>
          <Select value={formData.timeline} onValueChange={v => update({ timeline: v })}>
            <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{TIMELINES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <SectionLabel>Special Constraints (optional)</SectionLabel>
        <Textarea
          value={formData.special_constraints}
          onChange={e => update({ special_constraints: e.target.value })}
          placeholder="Any specific requirements, restrictions, or notes..."
          className="bg-secondary/50 border-border resize-none"
          rows={3}
        />
      </div>
    </div>,
  ];

  const stepLabels = ['Product Info', 'Strategy', 'Content & Budget'];
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
            key={label}
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
          <Button variant="ghost" onClick={() => setStep(s => s - 1)} className="text-muted-foreground rounded-full">Back</Button>
        ) : <div />}
        {isLastStep ? (
          <motion.div whileHover={{ scale: 1.03 }}>
            <Button onClick={onSubmit} className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 rounded-full font-semibold">
              Start Matching
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        ) : (
          <Button onClick={() => setStep(s => s + 1)} variant="ghost" className="text-primary hover:text-primary/80 rounded-full">
            Next
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default QuestionnaireForm;
