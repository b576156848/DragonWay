import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AudienceData } from '@/data/types';

const COLORS = ['hsl(174, 72%, 52%)', 'hsl(196, 80%, 46%)', 'hsl(262, 60%, 58%)', 'hsl(340, 65%, 55%)'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.[0]) {
    return (
      <div className="glass-card px-3 py-2 text-xs">
        <p className="text-foreground font-medium">{label}</p>
        <p className="text-primary">{payload[0].value}%</p>
      </div>
    );
  }
  return null;
};

const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="glass-card p-5">
    <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3>
    {children}
  </div>
);

const AudienceCharts = ({ audience }: { audience: AudienceData }) => {
  return (
    <section className="mb-12">
      <h2 className="text-xl font-bold text-foreground mb-1">Audience Visualization</h2>
      <p className="text-sm text-muted-foreground mb-6">Combined audience profile of recommended KOLs</p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid md:grid-cols-2 gap-4 mb-4"
      >
        <ChartCard title="Age Distribution">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={audience.ageDistribution} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
              <XAxis dataKey="age" tick={{ fill: 'hsl(215 12% 52%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(215 12% 52%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                {audience.ageDistribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[0]} fillOpacity={0.6 + i * 0.1} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="City Tier Distribution">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={audience.cityTier} barSize={32} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
              <XAxis type="number" tick={{ fill: 'hsl(215 12% 52%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="tier" tick={{ fill: 'hsl(215 12% 52%)', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
                {audience.cityTier.map((_, i) => (
                  <Cell key={i} fill={COLORS[1]} fillOpacity={0.8 - i * 0.15} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid md:grid-cols-2 gap-4"
      >
        <ChartCard title="Spending Power">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={audience.spendingPower} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
              <XAxis dataKey="segment" tick={{ fill: 'hsl(215 12% 52%)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(215 12% 52%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                {audience.spendingPower.map((_, i) => (
                  <Cell key={i} fill={COLORS[2]} fillOpacity={0.8 - i * 0.15} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Interest Tags">
          <div className="flex flex-wrap gap-2 pt-2">
            {audience.interestTags.map((tag, i) => (
              <motion.span
                key={tag}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary border border-border text-secondary-foreground"
              >
                {tag}
              </motion.span>
            ))}
          </div>
        </ChartCard>
      </motion.div>
    </section>
  );
};

export default AudienceCharts;
