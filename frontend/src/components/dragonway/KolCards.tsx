import { motion } from 'framer-motion';
import { Users, Heart, DollarSign } from 'lucide-react';
import { KolProfile } from '@/data/types';

const platformColors: Record<string, string> = {
  Xiaohongshu: 'bg-red-500/10 text-red-400 border-red-500/20',
  Douyin: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

const KolCards = ({ kols }: { kols: KolProfile[] }) => {
  return (
    <section className="mb-12">
      <h2 className="text-xl font-bold text-foreground mb-1">Top 3 KOL Recommendations</h2>
      <p className="text-sm text-muted-foreground mb-6">AI-matched creators for your product and audience</p>
      <div className="grid md:grid-cols-3 gap-4">
        {kols.map((kol, i) => (
          <motion.div
            key={kol.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.12 }}
            className="glass-card-elevated p-5 flex flex-col"
          >
            {/* Badge */}
            <div className="mb-4">
              <span className="inline-block px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                {kol.badge}
              </span>
            </div>

            {/* Avatar + Info */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/30 to-glow-secondary/30 flex items-center justify-center text-lg font-bold text-primary">
                {kol.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">{kol.name}</h3>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${platformColors[kol.platform]}`}>
                  {kol.platform}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center p-2 rounded-lg bg-secondary/50">
                <Users className="w-3.5 h-3.5 mx-auto mb-1 text-muted-foreground" />
                <div className="text-sm font-semibold text-foreground">{kol.followers}</div>
                <div className="text-[10px] text-muted-foreground">Followers</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-secondary/50">
                <Heart className="w-3.5 h-3.5 mx-auto mb-1 text-muted-foreground" />
                <div className="text-sm font-semibold text-foreground">{kol.engagement}</div>
                <div className="text-[10px] text-muted-foreground">Engagement</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-secondary/50">
                <DollarSign className="w-3.5 h-3.5 mx-auto mb-1 text-muted-foreground" />
                <div className="text-xs font-semibold text-foreground">{kol.priceRange.split('–')[0]}</div>
                <div className="text-[10px] text-muted-foreground">From</div>
              </div>
            </div>

            {/* Match reason */}
            <p className="text-xs text-muted-foreground leading-relaxed mb-4 flex-1">{kol.matchReason}</p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              {kol.contentTags.map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded text-[10px] font-medium bg-secondary text-secondary-foreground">
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default KolCards;
