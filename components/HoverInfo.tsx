
import { Entry } from '../types/selfmap';

interface HoverInfoProps {
  entry: Entry | null;
  visible: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  'People': 'hsl(var(--category-people))',
  'Accomplishments': 'hsl(var(--category-accomplishments))',
  'Life Story': 'hsl(var(--category-lifestory))',
  'Ideas/Likes': 'hsl(var(--category-ideas))',
  'Other': 'hsl(var(--category-other))'
};

export const HoverInfo = ({ entry, visible }: HoverInfoProps) => {
  if (!visible || !entry) return null;

  const categoryColor = CATEGORY_COLORS[entry.category] || CATEGORY_COLORS['Other'];

  return (
    <div className="glass-panel p-4 min-w-[250px] animate-[fadeInSlideUp_0.2s_ease-out]">
      <h3 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
        <span 
          className="w-3 h-3 rounded-full pulse-glow"
          style={{ backgroundColor: categoryColor, boxShadow: `0 0 15px ${categoryColor}` }}
        />
        {entry.label}
      </h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Category:</span>
          <span 
            className="font-medium px-2 py-0.5 rounded"
            style={{ 
              backgroundColor: categoryColor.replace(')', ', 0.2)'),
              color: categoryColor
            }}
          >
            {entry.category}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Power:</span>
          <span className="font-mono text-foreground font-semibold">{(entry.power * 100).toFixed(0)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Valence:</span>
          <span 
            className="font-mono font-semibold"
            style={{ color: entry.valence >= 0 ? 'hsl(var(--valence-positive))' : 'hsl(var(--valence-negative))' }}
          >
            {entry.valence >= 0 ? '+' : ''}{entry.valence.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};
