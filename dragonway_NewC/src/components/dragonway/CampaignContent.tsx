import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import { CampaignContent as CampaignContentType } from '@/data/types';
import { useI18n } from '@/lib/i18n';

const tabKeys = [
  { id: 'xhs', labelKey: 'campaignXhs' as const, key: 'xiaohongshuPost' as const },
  { id: 'douyin', labelKey: 'campaignDouyin' as const, key: 'douyinScript' as const },
  { id: 'dm', labelKey: 'campaignDm' as const, key: 'kolOutreach' as const },
];

const CampaignContentSection = ({ campaign }: { campaign: CampaignContentType }) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('xhs');
  const [copied, setCopied] = useState(false);

  const activeContent = tabKeys.find(tab => tab.id === activeTab);
  const content = activeContent ? campaign[activeContent.key] : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="mb-12">
      <h2 className="text-xl font-bold text-foreground mb-1">{t('campaignTitle')}</h2>
      <p className="text-sm text-muted-foreground mb-6">{t('campaignSubtitle')}</p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-elevated overflow-hidden"
      >
        <div className="flex border-b border-border">
          {tabKeys.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>

        <div className="p-5 relative">
          <button
            onClick={handleCopy}
            className="absolute top-4 right-4 p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
          </button>
          <pre className="text-sm text-foreground/90 whitespace-pre-wrap font-sans leading-relaxed pr-10 max-h-96 overflow-y-auto">
            {content}
          </pre>
        </div>
      </motion.div>
    </section>
  );
};

export default CampaignContentSection;
