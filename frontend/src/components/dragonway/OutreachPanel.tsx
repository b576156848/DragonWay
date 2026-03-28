import { useEffect, useMemo, useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { disconnectGmail, getGmailConnectUrl, getGmailStatus, sendOutreach } from '@/lib/api';
import { CampaignResult, GmailConnectionStatusResponse, OutreachSendRequest, OutreachSendResponse } from '@/data/types';

interface OutreachPanelProps {
  campaign: CampaignResult;
}

const OutreachPanel = ({ campaign }: OutreachPanelProps) => {
  const [mode, setMode] = useState<OutreachSendRequest['mode']>('mock');
  const [senderName, setSenderName] = useState('DragonWay Lab');
  const [senderEmail, setSenderEmail] = useState('');
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUsername, setSmtpUsername] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState<OutreachSendResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gmailStatus, setGmailStatus] = useState<GmailConnectionStatusResponse | null>(null);

  useEffect(() => {
    getGmailStatus().then(setGmailStatus).catch(() => undefined);
  }, []);

  const helperText = useMemo(() => {
    if (mode === 'mock') return 'Dry run only. Good for demo and QA.';
    if (mode === 'gmail_oauth') return 'Send using the Gmail account connected through Google OAuth.';
    if (mode === 'env_smtp') return 'Send using the server-side SMTP mailbox configured in backend env vars.';
    return 'Use your own SMTP mailbox. For Gmail or Outlook, use an app password, not your normal login password.';
  }, [mode]);

  const handleSend = async () => {
    try {
      setSending(true);
      setError(null);
      const payload: OutreachSendRequest = { mode };
      if (mode === 'custom_smtp') {
        payload.sender_name = senderName;
        payload.sender_email = senderEmail;
        payload.smtp_host = smtpHost;
        payload.smtp_port = Number(smtpPort || 587);
        payload.smtp_username = smtpUsername;
        payload.smtp_password = smtpPassword;
        payload.smtp_use_tls = true;
      }
      if (mode === 'env_smtp') {
        payload.sender_name = senderName;
      }
      const result = await sendOutreach(campaign.campaign_id, payload);
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send outreach emails.');
    } finally {
      setSending(false);
    }
  };

  const handleConnectGmail = () => {
    window.location.href = getGmailConnectUrl(window.location.href);
  };

  const handleDisconnectGmail = async () => {
    await disconnectGmail();
    setGmailStatus({ connected: false, email: null, expires_at: null, scopes: [] });
  };

  return (
    <section className="mb-12">
      <div className="glass-card-elevated p-6">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-foreground mb-1">Outreach Sending</h2>
          <p className="text-sm text-muted-foreground">
            Preview and send the generated KOL emails. Current drafts: {campaign.outreach_drafts.length}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Send Mode</Label>
              <Select value={mode} onValueChange={(value) => setMode(value as OutreachSendRequest['mode'])}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mock">Mock Send</SelectItem>
                  <SelectItem value="gmail_oauth">Connected Gmail</SelectItem>
                  <SelectItem value="env_smtp">Server SMTP Mailbox</SelectItem>
                  <SelectItem value="custom_smtp">My Own SMTP Mailbox</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">{helperText}</p>
            </div>

            {mode === 'gmail_oauth' && (
              <div className="rounded-xl border border-border bg-secondary/30 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3">Gmail Connection</p>
                {gmailStatus?.connected ? (
                  <div className="space-y-3">
                    <div className="text-sm text-foreground">
                      Connected as <span className="text-primary">{gmailStatus.email}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Scope: {gmailStatus.scopes.join(', ') || 'gmail.send'}
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={handleDisconnectGmail}>
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Connect a Gmail account first. Google will redirect you back to this campaign page after consent.
                    </p>
                    <Button type="button" variant="outline" onClick={handleConnectGmail}>
                      Connect Gmail
                    </Button>
                  </div>
                )}
              </div>
            )}

            {(mode === 'env_smtp' || mode === 'custom_smtp') && (
              <div>
                <Label className="mb-2 block">Sender Name</Label>
                <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} className="bg-secondary/50" />
              </div>
            )}

            {mode === 'custom_smtp' && (
              <>
                <div>
                  <Label className="mb-2 block">Sender Email</Label>
                  <Input value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} className="bg-secondary/50" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-2 block">SMTP Host</Label>
                    <Input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} className="bg-secondary/50" />
                  </div>
                  <div>
                    <Label className="mb-2 block">Port</Label>
                    <Input value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} className="bg-secondary/50" />
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block">SMTP Username</Label>
                  <Input value={smtpUsername} onChange={(e) => setSmtpUsername(e.target.value)} className="bg-secondary/50" />
                </div>
                <div>
                  <Label className="mb-2 block">SMTP App Password</Label>
                  <Input type="password" value={smtpPassword} onChange={(e) => setSmtpPassword(e.target.value)} className="bg-secondary/50" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Gmail: `smtp.gmail.com:587` + app password. Outlook: `smtp.office365.com:587`.
                </p>
              </>
            )}

            <Button
              onClick={handleSend}
              disabled={sending || (mode === 'gmail_oauth' && !gmailStatus?.connected)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Send Outreach Emails
            </Button>

            {error && <p className="text-sm text-red-300 whitespace-pre-wrap">{error}</p>}
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-secondary/30 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">First Draft Preview</p>
              <p className="text-sm text-foreground font-medium mb-1">{campaign.outreach_drafts[0]?.subject}</p>
              <p className="text-xs text-muted-foreground mb-3">To: {campaign.outreach_drafts[0]?.email}</p>
              <pre className="text-xs whitespace-pre-wrap text-foreground/85 font-sans leading-relaxed max-h-64 overflow-y-auto">
                {campaign.outreach_drafts[0]?.body}
              </pre>
            </div>

            {response && (
              <div className="rounded-xl border border-border bg-secondary/30 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Send Results</p>
                <div className="space-y-2">
                  {response.results.map((item) => (
                    <div key={`${item.email}-${item.kol_name}`} className="text-sm">
                      <span className="text-foreground font-medium">{item.kol_name}</span>
                      <span className="text-muted-foreground"> · {item.email} · {item.status}</span>
                      <p className="text-xs text-muted-foreground mt-1">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default OutreachPanel;
