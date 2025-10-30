import React, { useMemo, useState, useEffect, useRef } from 'react';
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

declare const d3: any;

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
}

const CATEGORY_SYMBOLS: Record<string, any> = {
  'People': d3.symbolCircle,
  'Accomplishments': d3.symbolSquare,
  'Life Story': d3.symbolDiamond,
  'Ideas/Likes': d3.symbolCross,
  'Other': d3.symbolTriangle
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
}: SelfMapVisualizationProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredEntry, setHoveredEntry] = useState<Entry | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const imageTimeout = useRef<number | null>(null);

  const { positions, weightedDegrees, sizes, colors } = useMemo(() => {
    const positions = radiusMode === 'valence' ? computePositionByValence(entries) : computePositionByPower(entries);
    const weightedDegrees = calculateWeightedDegree(entries, associations);
    const sizes = getSizesForCategory(entries, sizeMetric, weightedDegrees, sizeScale);
    const colors = getColorsForCategory(entries, opacity);
    return { positions, weightedDegrees, sizes, colors };
  }, [entries, sizeMetric, radiusMode, sizeScale, opacity, associations]);

  useEffect(() => {
    if (!svgRef.current || entries.length === 0) return;

    const svgElement = svgRef.current;
    const width = svgElement.clientWidth;
    const height = svgElement.clientHeight;
    
    if (width === 0 || height === 0) return; // Wait for the container to have dimensions

    const svg = d3.select(svgElement);
    svg.selectAll('*').remove(); // Clear previous renders

    const g = svg.append('g');

    // fix: Removed type arguments from d3.zoom() because the global `d3` object is typed as `any`, which doesn't support generics.
    const zoom = d3.zoom()
      .scaleExtent([0.3, 5])
      .on('zoom', (event: any) => {
        g.attr('transform', event.transform);
      });
    
    // Set initial transform
    const initialTransform = d3.zoomIdentity.translate(width / 2, height / 2).scale(Math.min(width, height) / ((R_MAX + 40) * 2));
    svg.call(zoom.transform, initialTransform);
    svg.call(zoom);

    // -- RINGS AND GUIDES --
    const ringData = generateRingGuides(R_MAX);
    g.selectAll('path.ring')
      .data(ringData)
      .enter().append('path')
      .attr('class', 'ring')
      .attr('d', (d: any) => {
        const line = d3.line()
          .x((p: any) => p[0])
          .y((p: any) => p[1])
          .curve(d3.curveBasisClosed);
        const points: [number, number][] = d.x.map((x: number, i: number) => [x, d.y[i]]);
        return line(points);
      })
      .attr('fill', 'none')
      .attr('stroke', 'hsl(var(--border))')
      .attr('stroke-opacity', 0.3)
      .attr('stroke-width', 1);

    g.append('line').attr('x1', -R_MAX).attr('x2', R_MAX).attr('y1', 0).attr('y2', 0).attr('stroke', 'hsl(var(--border))').attr('stroke-opacity', 0.4).attr('stroke-width', 1).attr('stroke-dasharray', '2,2');
    g.append('line').attr('x1', 0).attr('x2', 0).attr('y1', -R_MAX).attr('y2', R_MAX).attr('stroke', 'hsl(var(--border))').attr('stroke-opacity', 0.4).attr('stroke-width', 1).attr('stroke-dasharray', '2,2');

    // -- EDGES --
    if (showEdges) {
      const edgeGroup = g.append('g').attr('class', 'edges');
      edgeGroup.selectAll('line.edge')
        .data(associations)
        .enter().append('line')
        .attr('class', 'edge')
        .attr('x1', (d: Association) => positions[d.src]?.x ?? 0)
        .attr('y1', (d: Association) => positions[d.src]?.y ?? 0)
        .attr('x2', (d: Association) => positions[d.dst]?.x ?? 0)
        .attr('y2', (d: Association) => positions[d.dst]?.y ?? 0)
        .attr('stroke', (d: Association) => {
            if (d.relation === 'affirms') return 'hsl(var(--valence-positive))';
            if (d.relation === 'threatens') return 'hsl(var(--valence-negative))';
            return 'hsl(var(--valence-neutral))';
        })
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', (d: Association) => 1 + d.weight * 2.5);
    }
    
    // -- NODES --
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const nodes = nodeGroup.selectAll('g.node')
      .data(entries, (d: any) => d.label)
      .join('g')
      .attr('class', 'node')
      .attr('transform', (d: Entry) => `translate(${positions[d.label]?.x ?? 0}, ${positions[d.label]?.y ?? 0})`)
      .style('cursor', 'pointer');
    
    // Glow effect
    nodes.append('path')
      .attr('d', (d: Entry, i: number) => d3.symbol().type(CATEGORY_SYMBOLS[d.category]).size(sizes[i] * 2.5)())
      .attr('fill', (d: Entry, i: number) => colors[i])
      .style('opacity', 0.25);
    
    // Main symbol
    nodes.append('path')
      .attr('d', (d: Entry, i: number) => d3.symbol().type(CATEGORY_SYMBOLS[d.category]).size(sizes[i])())
      .attr('fill', (d: Entry, i: number) => colors[i])
      .attr('stroke', 'rgba(0,0,0,0.5)')
      .attr('stroke-width', 1.5);
      
    // -- LABELS --
    if (showLabels) {
      const labelGroup = g.append('g').attr('class', 'labels');
      labelGroup.selectAll('text.label')
        .data(entries, (d: any) => d.label)
        .join('text')
        .attr('class', 'label')
        .attr('x', (d: Entry) => (positions[d.label]?.x ?? 0))
        .attr('y', (d: Entry) => (positions[d.label]?.y ?? 0) - 12)
        .text((d: Entry) => d.label)
        .attr('fill', 'hsl(var(--foreground))')
        .style('font-size', '10px')
        .attr('text-anchor', 'middle')
        .style('pointer-events', 'none')
        .attr('opacity', 0.88);
    }

    // -- CENTER "SELF" STAR --
    g.append('path')
      .attr('d', d3.symbol().type(d3.symbolStar).size(400)())
      .attr('fill', 'hsl(var(--primary))');
    g.append('text')
      .attr('x', 0).attr('y', -18)
      .text('Self')
      .attr('fill', 'hsl(var(--foreground))')
      .style('font-size', '12px').attr('text-anchor', 'middle');

    // -- INTERACTIVITY --
    nodes.on('mouseover', function(event: MouseEvent, d: Entry) {
      setHoveredEntry(d);
      const connected = new Set([d.label]);
      associations.forEach(a => {
        if (a.src === d.label) connected.add(a.dst);
        if (a.dst === d.label) connected.add(a.src);
      });

      nodes.transition().duration(200).style('opacity', (n: any) => connected.has(n.label) ? 1.0 : 0.2);
      d3.selectAll('.edge').transition().duration(200).style('opacity', (e: any) => (e.src === d.label || e.dst === d.label) ? 1.0 : 0.1);
      
      if (imageTimeout.current) clearTimeout(imageTimeout.current);
      setHoveredImage(`https://picsum.photos/seed/${d.label}/200`);
      setImageError(false);
      imageTimeout.current = window.setTimeout(() => setHoveredImage(null), 30000);
    })
    .on('mouseout', function() {
      setHoveredEntry(null);
      nodes.transition().duration(200).style('opacity', 1.0);
      d3.selectAll('.edge').transition().duration(200).style('opacity', 0.6);
    })
    .on('click', function(event: MouseEvent, d: Entry) {
      setSelectedEntry(prev => prev?.label === d.label ? null : d);
    });

    // Update selected/highlighted styles
    nodes.select('path:last-child')
        .transition().duration(200)
        .attr('stroke', (d: any) => selectedEntry?.label === d.label ? 'hsl(var(--foreground))' : 'rgba(0,0,0,0.5)')
        .attr('stroke-width', (d: any) => selectedEntry?.label === d.label ? 3 : 1.5);

  }, [entries, associations, positions, sizes, colors, showEdges, showLabels, selectedEntry]);

  // Handle keyboard escape
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedEntry(null);
        setHoveredEntry(null);
        if (imageTimeout.current) clearTimeout(imageTimeout.current);
        setHoveredImage(null);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
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
      
      <div className={`w-full h-full ${pulsationMode ? 'pulsation-active' : ''}`}>
        <svg ref={svgRef} width="100%" height="100%"></svg>
      </div>
    </div>
  );
};
