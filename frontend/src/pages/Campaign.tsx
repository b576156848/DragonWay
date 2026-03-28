import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import AgentProgress from '@/components/dragonway/AgentProgress';
import AudienceCharts from '@/components/dragonway/AudienceCharts';
import CampaignContentSection from '@/components/dragonway/CampaignContent';
import ChinaStrategySection from '@/components/dragonway/ChinaStrategySection';
import ExecutionPlanSection from '@/components/dragonway/ExecutionPlanSection';
import KolCards from '@/components/dragonway/KolCards';
import OpportunityCards from '@/components/dragonway/OpportunityCards';
import OutreachPanel from '@/components/dragonway/OutreachPanel';
import ProductAnalysisSection from '@/components/dragonway/ProductAnalysisSection';
import PushStatus from '@/components/dragonway/PushStatus';
import { getCampaign, getCampaignStatus } from '@/lib/api';
import { toAnalysisResult } from '@/lib/view-models';
import { CampaignResult, CampaignStatusResponse } from '@/data/types';

const CampaignPage = () => {
  const { campaignId } = useParams();
  const [status, setStatus] = useState<CampaignStatusResponse | null>(null);
  const [result, setResult] = useState<CampaignResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId) return;

    let cancelled = false;
    let timer: number | undefined;

    const poll = async () => {
      try {
        const nextStatus = await getCampaignStatus(campaignId);
        if (cancelled) return;
        setStatus(nextStatus);

        if (nextStatus.status === 'ready') {
          const campaign = await getCampaign(campaignId);
          if (cancelled) return;
          setResult(campaign);
          return;
        }

        if (nextStatus.status === 'error') {
          setError(nextStatus.error_message ?? 'Campaign processing failed.');
          return;
        }

        timer = window.setTimeout(poll, 1500);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load campaign.');
        }
      }
    };

    poll();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [campaignId]);

  const analysis = result ? toAnalysisResult(result) : null;

  return (
    <div className="min-h-screen bg-background dot-grid">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-bg border border-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">D</span>
            </div>
            <span className="font-semibold text-foreground text-sm">DragonWay Lab</span>
            <span className="text-muted-foreground text-xs hidden sm:inline">/ 入华引擎</span>
          </div>
          <Link to="/" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            New Analysis
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        {error && (
          <div className="glass-card p-6 max-w-2xl mx-auto">
            <h1 className="text-xl font-semibold text-foreground mb-2">Campaign failed</h1>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{error}</p>
          </div>
        )}

        {!error && !analysis && (
          <AgentProgress currentStepId={status?.current_step ?? 'extract'} status={status?.status ?? 'analyzing'} />
        )}

        {!error && analysis && result && (
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-foreground mb-1">{result.agent_a_output.product_name}</h1>
              <p className="text-muted-foreground text-sm">{result.agent_b_output.china_market_summary}</p>
            </div>
            <ProductAnalysisSection campaign={result} />
            <ChinaStrategySection campaign={result} />
            <OpportunityCards opportunities={analysis.opportunities} />
            <KolCards kols={analysis.kols} />
            <AudienceCharts audience={analysis.audience} />
            <ExecutionPlanSection campaign={result} />
            <CampaignContentSection campaign={analysis.campaign} />
            <PushStatus />
            <OutreachPanel campaign={result} />
          </div>
        )}
      </main>
    </div>
  );
};

export default CampaignPage;
