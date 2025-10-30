
import React from 'react';
import { SizeMetric, RadiusMode } from '../types/selfmap';
import { Upload, Search, Filter, X, HelpCircle } from 'lucide-react';

interface ControlPanelProps {
  sizeMetric: SizeMetric;
  onSizeMetricChange: (metric: SizeMetric) => void;
  radiusMode: RadiusMode;
  onRadiusModeChange: (mode: RadiusMode) => void;
  showEdges: boolean;
  onShowEdgesChange: (show: boolean) => void;
  showLabels: boolean;
  onShowLabelsChange: (show: boolean) => void;
  sizeScale: number;
  onSizeScaleChange: (scale: number) => void;
  opacity: number;
  onOpacityChange: (opacity: number) => void;
  pulsationMode: boolean;
  onPulsationModeChange: (mode: boolean) => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadSample: () => void;
  onShowHelp: () => void;
}

const Button: React.FC<React.PropsWithChildren<{
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md';
  className?: string;
}>> = ({ onClick, children, variant = 'secondary', size = 'md', className = '' }) => (
  <button onClick={onClick} className={`px-4 py-2 rounded-md font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
    variant === 'primary' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
  } ${
    size === 'sm' ? 'text-sm' : ''
  } ${className}`}>
    {children}
  </button>
);

export const ControlPanel = ({
  sizeMetric,
  onSizeMetricChange,
  radiusMode,
  onRadiusModeChange,
  showEdges,
  onShowEdgesChange,
  showLabels,
  onShowLabelsChange,
  sizeScale,
  onSizeScaleChange,
  opacity,
  onOpacityChange,
  pulsationMode,
  onPulsationModeChange,
  onFileUpload,
  onLoadSample,
  onShowHelp,
}: ControlPanelProps) => {
  const sizeMetrics: Array<{ label: string; value: SizeMetric }> = [
    { label: 'Power × |Valence|', value: 'power_x_val' },
    { label: 'Power', value: 'power' },
    { label: '|Valence|', value: 'valence_abs' },
    { label: 'Connections', value: 'weighted_degree' }
  ];

  return (
    <div className="glass-panel p-4 space-y-6 overflow-y-auto">
      <div>
        <h3 className="text-lg font-semibold mb-3 text-foreground">Data Source</h3>
        <div className="flex gap-2">
          <Button onClick={onLoadSample} className="flex-1">Load Sample</Button>
          <Button onClick={() => document.getElementById('file-upload')?.click()} className="flex-1">
            <span className="flex items-center justify-center gap-2">
              <Upload className="w-4 h-4" /> Upload
            </span>
          </Button>
          <input id="file-upload" type="file" accept=".json" onChange={onFileUpload} className="hidden" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3 text-foreground">Node Size Metric</h3>
        <div className="grid grid-cols-2 gap-2">
          {sizeMetrics.map((metric) => (
            <Button
              key={metric.value}
              onClick={() => onSizeMetricChange(metric.value)}
              variant={sizeMetric === metric.value ? 'primary' : 'secondary'}
              size="sm"
              className="text-xs h-10"
            >
              {metric.label}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3 text-foreground">Radius Mode</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => onRadiusModeChange('valence')} variant={radiusMode === 'valence' ? 'primary' : 'secondary'}>Valence</Button>
          <Button onClick={() => onRadiusModeChange('power')} variant={radiusMode === 'power' ? 'primary' : 'secondary'}>Power</Button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3 text-foreground">Display Options</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => onShowEdgesChange(!showEdges)} variant={showEdges ? 'primary' : 'secondary'}>{showEdges ? 'Hide' : 'Show'} Edges</Button>
          <Button onClick={() => onShowLabelsChange(!showLabels)} variant={showLabels ? 'primary' : 'secondary'}>{showLabels ? 'Hide' : 'Show'} Labels</Button>
          <Button onClick={() => onPulsationModeChange(!pulsationMode)} variant={pulsationMode ? 'primary' : 'secondary'} className="col-span-2">{pulsationMode ? 'Pulsation On' : 'Pulsation Off'}</Button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm text-muted-foreground">Size Scale</label>
            <span className="text-sm font-mono text-foreground">{sizeScale.toFixed(2)}</span>
          </div>
          <input type="range" value={sizeScale} onChange={(e) => onSizeScaleChange(Number(e.target.value))} min={0.3} max={3.0} step={0.1} className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary" />
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm text-muted-foreground">Opacity</label>
            <span className="text-sm font-mono text-foreground">{opacity.toFixed(2)}</span>
          </div>
          <input type="range" value={opacity} onChange={(e) => onOpacityChange(Number(e.target.value))} min={0.35} max={1.0} step={0.05} className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary" />
        </div>
      </div>
      
      <Button onClick={onShowHelp} className="w-full flex items-center justify-center gap-2">
        <HelpCircle className="w-4 h-4" />
        Keyboard Shortcuts
      </Button>
    </div>
  );
};
