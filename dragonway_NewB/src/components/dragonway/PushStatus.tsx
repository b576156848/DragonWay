import { motion } from 'framer-motion';
import { CheckCircle2, Package, Send, FileText, Users } from 'lucide-react';

const steps = [
  { icon: FileText, label: 'Analysis complete', desc: 'Product opportunity & audience mapped', done: true },
  { icon: Users, label: 'KOLs matched', desc: '3 creators selected from 2,400+ pool', done: true },
  { icon: Package, label: 'Content generated', desc: 'Campaign drafts ready for review', done: true },
  { icon: Send, label: 'Plan forwarded', desc: 'Sent to China-side partner network', done: true },
];

const PushStatus = () => {
  return (
    <section className="mb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card glow-border p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Plan Generated & Forwarded</h2>
            <p className="text-sm text-muted-foreground">Your China KOL marketing plan has been pushed to our partner network</p>
          </div>
        </div>

        <div className="space-y-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 pl-2"
            >
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <step.icon className="w-3 h-3 text-primary" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-foreground">{step.label}</span>
                <span className="text-xs text-muted-foreground ml-2">{step.desc}</span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-primary/60" />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default PushStatus;
