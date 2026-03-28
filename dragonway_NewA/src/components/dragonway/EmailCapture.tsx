import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FormData } from '@/data/types';
import { captureLead } from '@/lib/api';

const EmailCapture = ({
  formData,
  sourceMode,
}: {
  formData?: FormData;
  sourceMode?: 'quick' | 'detailed';
}) => {
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await captureLead({
        email,
        company: company || undefined,
        context: {
          source_mode: sourceMode,
          form_data: formData,
        },
      });
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card glow-border p-8 text-center max-w-md mx-auto"
      >
        <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
          <Send className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">Plan sent!</h3>
        <p className="text-sm text-muted-foreground">We'll follow up with your detailed KOL marketing plan and next steps.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 max-w-md mx-auto"
    >
      <h3 className="text-lg font-bold text-foreground mb-1">Get the Full Plan</h3>
      <p className="text-sm text-muted-foreground mb-5">We'll send you the complete analysis with actionable next steps.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-foreground/80 mb-1.5 block">Work Email</Label>
          <Input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="bg-secondary/50 border-border"
            required
          />
        </div>
        <div>
          <Label className="text-sm font-medium text-foreground/80 mb-1.5 block">Company (optional)</Label>
          <Input
            value={company}
            onChange={e => setCompany(e.target.value)}
            placeholder="Your brand or company name"
            className="bg-secondary/50 border-border"
          />
        </div>
        <Button type="submit" disabled={isSubmitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
          Send Me the Plan
          <Send className="w-4 h-4 ml-2" />
        </Button>
      </form>
    </motion.div>
  );
};

export default EmailCapture;
