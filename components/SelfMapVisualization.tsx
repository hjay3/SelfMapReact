
import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import * as Plotly from 'plotly.js';
import createPlotlyComponent from 'react-plotly.js/factory';
import { Entry, Association, SizeMetric, RadiusMode } from '../types/selfmap';
import {
  computePositionByValence,
  computePositionByPower,
  calculateWeightedDegree,
  getSizesForCategory,
  getColorsForCategory,
  generateRingGuides,
  R_MAX
} from '../utils/visualization';
import { HoverInfo } from './HoverInfo';

const Plot = createPlotlyComponent(Plotly);

interface SelfMapVisualizationProps {
  entries: Entry[];
  associations: Association[];
  sizeMetric: SizeMetric;
  radiusMode: RadiusMode;
  showEdges: boolean;
  showLabels: boolean;
  sizeScale: number;
  opacity: number;
  pulsationMode: boolean;
  onNodeClick?: (entry: Entry) => void;
  onNodeDoubleClick?: (entry: Entry) => void;
  highlightedNodes?: string[];
  width?: number;
  height?: number;
}

const CATEGORIES = ['People', 'Accomplishments', 'Life Story', 'Ideas/Likes', 'Other'];

const CATEGORY_SYMBOLS: Record<string, string> = {
  'People': 'circle',
  'Accomplishments': 'square',
  'Life Story': 'diamond',
  'Ideas/Likes': 'cross',
  'Other': 'triangle-up'
};

export const SelfMapVisualization = ({
  entries,
  associations,
  sizeMetric,
  radiusMode,
  showEdges,
  showLabels,
  sizeScale,
  opacity,
  pulsationMode,
  onNodeClick,
  onNodeDoubleClick,
  highlightedNodes = [],
  width,
  height,
}: SelfMapVisualizationProps) => {
  const [hoveredEntry, setHoveredEntry] = useState<Entry | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const imageTimeout = useRef<NodeJS.Timeout | null>(null);
  const [dimmedNodes, setDimmedNodes] = useState<Set<string>>(new Set());
  const clickTimeoutRef = useRef<number | null>(null);

  const resolvedColors = useMemo(() => {
    if (typeof window === 'undefined') return {}; // Guard for SSR
    const style = getComputedStyle(document.documentElement);
    const getColor = (name: string) => style.getPropertyValue(name).trim();
    return {
        border: getColor('--border'),
        primary: getColor('--primary'),
        foreground: getColor('--foreground'),
        glassBg: getColor('--glass-bg'),
        popover: getColor('--popover'),
        popoverForeground: getColor('--popover-foreground'),
        valencePositive: getColor('--valence-positive'),
        valenceNegative: getColor('--valence-negative'),
        valenceNeutral: getColor('--valence-neutral'),
    };
  }, []);

  useEffect(() => {
    return () => {
      if (imageTimeout.current) clearTimeout(imageTimeout.current);
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    };
  }, []);

  const { positions, traces } = useMemo(() => {
    if (!resolvedColors.border) return { positions: {}, traces: [] }; // Don't render if colors aren't resolved

    const positions = radiusMode === 'valence' ? computePositionByValence(entries) : computePositionByPower(entries);
    const weightedDegrees = calculateWeightedDegree(entries, associations);

    const EDGE_STYLES: Record<string, { color: string; width: number }> = {
      'affirms': { color: `hsla(${resolvedColors.valencePositive}, 0.45)`, width: 2 },
      'threatens': { color: `hsla(${resolvedColors.valenceNegative}, 0.50)`, width: 2 },
      'associates_with': { color: `hsla(${resolvedColors.valenceNeutral}, 0.40)`, width: 2 }
    };

    const traces: any[] = [];
    const ringGuides = generateRingGuides(R_MAX);
    ringGuides.forEach(ring => {
      traces.push({ ...ring, mode: 'lines', line: { color: `hsla(${resolvedColors.border}, 0.3)`, width: 1 }, hoverinfo: 'skip', showlegend: false });
    });

    traces.push({ x: [-R_MAX, R_MAX], y: [0, 0], mode: 'lines', line: { color: `hsla(${resolvedColors.border}, 0.4)`, width: 1, dash: 'dot' }, hoverinfo: 'skip', showlegend: false });
    traces.push({ x: [0, 0], y: [-R_MAX, R_MAX], mode: 'lines', line: { color: `hsla(${resolvedColors.border}, 0.4)`, width: 1, dash: 'dot' }, hoverinfo: 'skip', showlegend: false });

    if (showEdges) {
      Object.entries(EDGE_STYLES).forEach(([relation, style]) => {
        const edgeX: (number | null)[] = [];
        const edgeY: (number | null)[] = [];
        associations.forEach(assoc => {
          if (assoc.relation === relation) {
            const srcPos = positions[assoc.src];
            const dstPos = positions[assoc.dst];
            if (srcPos && dstPos) {
              edgeX.push(srcPos.x, dstPos.x, null);
              edgeY.push(srcPos.y, dstPos.y, null);
            }
          }
        });
        if (edgeX.length > 0) traces.push({ x: edgeX, y: edgeY, mode: 'lines', line: style, hoverinfo: 'skip', showlegend: false });
      });
    }

    traces.push({ x: [0], y: [0], mode: 'markers+text', marker: { size: 20, color: `hsl(${resolvedColors.primary})`, symbol: 'star', line: { color: `hsl(${resolvedColors.primary})`, width: 2 } }, text: ['Self'], textposition: 'top center', textfont: { color: `hsl(${resolvedColors.foreground})`, size: 12 }, hovertemplate: 'Self<extra></extra>', name: 'Self', showlegend: false });

    CATEGORIES.forEach(category => {
      const categoryEntries = entries.filter(e => e.category === category);
      if (categoryEntries.length === 0) return;

      const xs = categoryEntries.map(e => positions[e.label]?.x ?? 0);
      const ys = categoryEntries.map(e => positions[e.label]?.y ?? 0);
      const sizes = getSizesForCategory(categoryEntries, sizeMetric, weightedDegrees, sizeScale);
      const colors = getColorsForCategory(categoryEntries, opacity);
      
      const displayColors = colors.map((color, idx) => dimmedNodes.has(categoryEntries[idx].label) ? color.replace(/[\d.]+\)$/, '0.15)') : color);

      traces.push({
        x: xs, y: ys, mode: 'markers',
        marker: { size: sizes.map(s => Math.min(80, s * 1.55 + 8)), color: displayColors.map(c => c.replace(/[\d.]+\)$/, '0.10)')), symbol: CATEGORY_SYMBOLS[category], line: { width: 0 } },
        hoverinfo: 'skip', showlegend: false
      });

      traces.push({
        x: xs, y: ys, mode: showLabels ? 'markers+text' : 'markers', text: categoryEntries.map(e => e.label), textposition: 'top center', textfont: { color: `hsla(${resolvedColors.foreground}, 0.88)`, size: 10 },
        marker: {
          size: sizes.map((s, i) => selectedEntry?.label === categoryEntries[i].label ? s * 1.3 : (highlightedNodes.includes(categoryEntries[i].label) ? s * 1.15 : s)),
          color: displayColors, symbol: CATEGORY_SYMBOLS[category],
          line: {
            color: displayColors.map((_, i) => selectedEntry?.label === categoryEntries[i].label ? `hsl(${resolvedColors.foreground})` : (highlightedNodes.includes(categoryEntries[i].label) ? `hsla(${resolvedColors.foreground}, 0.7)` : (dimmedNodes.has(categoryEntries[i].label) ? `hsla(${resolvedColors.foreground}, 0.15)` : 'hsla(0,0%,0%,0.45)'))),
            width: displayColors.map((_, i) => selectedEntry?.label === categoryEntries[i].label ? 2.5 : (highlightedNodes.includes(categoryEntries[i].label) ? 1.8 : 1.3))
          }
        },
        customdata: categoryEntries, hovertemplate: '%{customdata.label}<br>Category: %{customdata.category}<br>Power: %{customdata.power:.0%}<br>Valence: %{customdata.valence:+.2f}<extra></extra>',
        name: category, showlegend: true
      });
    });

    return { positions, traces };
  }, [entries, associations, sizeMetric, radiusMode, showEdges, showLabels, sizeScale, opacity, dimmedNodes, selectedEntry, highlightedNodes, resolvedColors]);

  const layout = useMemo(() => ({
    template: 'plotly_dark',
    width, height,
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    margin: { l: 20, r: 20, t: 80, b: 60 },
    title: { text: `Self Map — ${entries.length} entries, ${associations.length} associations`, x: 0.5, xanchor: 'center', font: { color: `hsl(${resolvedColors.foreground})`, size: 24 } },
    legend: { bgcolor: `hsla(${resolvedColors.glassBg}, 0.6)`, font: { color: `hsl(${resolvedColors.foreground})`, size: 12 }, orientation: 'h', y: 1.05, x: 0.5, xanchor: 'center', yanchor: 'top' },
    hovermode: 'closest',
    hoverlabel: { bgcolor: `hsl(${resolvedColors.popover})`, bordercolor: `hsl(${resolvedColors.border})`, font: { color: `hsl(${resolvedColors.popoverForeground})`, size: 12 } },
    xaxis: { visible: false, range: [-R_MAX - 16, R_MAX + 16], constrain: 'domain' },
    yaxis: { visible: false, range: [-R_MAX - 16, R_MAX + 16], scaleanchor: 'x', scaleratio: 1 },
    autosize: true,
  }), [width, height, entries.length, associations.length, resolvedColors]);

  const handleHover = (event: any) => {
    if (event.points?.[0]?.customdata) {
      const entry = event.points[0].customdata as Entry;
      setHoveredEntry(entry);
      
      const connected = new Set<string>([entry.label]);
      associations.forEach(assoc => {
        if (assoc.src === entry.label) connected.add(assoc.dst);
        if (assoc.dst === entry.label) connected.add(assoc.src);
      });
      setDimmedNodes(new Set([...entries.map(e => e.label)].filter(l => !connected.has(l))));
      
      if (imageTimeout.current) clearTimeout(imageTimeout.current);
      
      const entryIndex = entries.findIndex(e => e.label === entry.label);
      setHoveredImage(`https://picsum.photos/seed/${entry.label}/200`);
      setImageError(false);
      
      imageTimeout.current = setTimeout(() => setHoveredImage(null), 30000);
    }
  };

  const handleUnhover = () => {
    setHoveredEntry(null);
    setDimmedNodes(new Set());
  };

  const handleClick = useCallback((event: any) => {
    if (event.points?.[0]?.customdata) {
      const entry = event.points[0].customdata as Entry;
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = window.setTimeout(() => {
        setSelectedEntry(prev => prev?.label === entry.label ? null : entry);
        onNodeClick?.(entry);
      }, 250);
    }
  }, [onNodeClick]);

  const handleDoubleClick = useCallback((event: any) => {
    if (event.points?.[0]?.customdata) {
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
      onNodeDoubleClick?.(event.points[0].customdata as Entry);
    }
  }, [onNodeDoubleClick]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedEntry(null);
        setHoveredEntry(null);
        setDimmedNodes(new Set());
        setHoveredImage(null);
        if (imageTimeout.current) clearTimeout(imageTimeout.current);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 right-4 z-10">
        <HoverInfo entry={hoveredEntry} visible={!!hoveredEntry} />
      </div>
      
      {hoveredImage && !imageError && (
        <div className="image-preview">
          <img 
            src={hoveredImage} alt="Entry visualization"
            className={`w-32 h-32 object-cover ${pulsationMode ? 'pulse-glow' : ''}`}
            onError={() => setImageError(true)}
          />
        </div>
      )}
      
      <div className={`w-full h-full relative overflow-hidden ${pulsationMode ? 'pulsation-active' : ''}`}>
        <Plot
          data={traces}
          layout={layout}
          config={{ displayModeBar: false, responsive: true }}
          onHover={handleHover}
          onUnhover={handleUnhover}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler
        />
      </div>
    </div>
  );
};
