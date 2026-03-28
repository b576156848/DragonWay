import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import { CampaignContent as CampaignContentType } from '@/data/types';

const tabs = [
  { id: 'xhs', label: 'Xiaohongshu Post', key: 'xiaohongshuPost' as const },
  { id: 'douyin', label: 'Douyin Script', key: 'douyinScript' as const },
  { id: 'dm', label: 'KOL Outreach DM', key: 'kolOutreach' as const },
];

const CampaignContentSection = ({ campaign }: { campaign: CampaignContentType }) => {
  const [activeTab, setActiveTab] = useState('xhs');
  const [copied, setCopied] = useState(false);

  const activeContent = tabs.find(t => t.id === activeTab);
  const content = activeContent ? campaign[activeContent.key] : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="mb-12">
      <h2 className="text-xl font-bold text-foreground mb-1">Generated Campaign Content</h2>
      <p className="text-sm text-muted-foreground mb-6">Ready-to-use drafts for each platform</p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-elevated overflow-hidden"
      >
        {/* Tabs */}
        <div className="flex border-b border-border">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
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
