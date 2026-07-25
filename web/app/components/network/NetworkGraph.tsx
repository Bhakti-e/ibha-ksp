'use client';

/**
 * NetworkGraph — D3 v7 Force-Directed Graph
 * ============================================
 * Professional institutional palette:
 *   Amber    (#B45309) — central / queried person
 *   Blue     (#1D4ED8) — co-accused persons
 *   Slate    (#475569) — case nodes
 *   Gray     (#CBD5E1) — edges
 *
 * Features: zoom/pan, drag nodes, hover tooltip
 * D3 force docs: https://d3js.org/d3-force
 */

import { useEffect, useRef, useCallback } from 'react';
import type { NetworkGraph as NetworkGraphData } from '@/lib/api';
import * as d3 from 'd3';

interface Props { data: NetworkGraphData; }

const C = {
  canvasBg:    '#F8FAFC',
  edge:        '#CBD5E1',
  nodePerson:  '#1D4ED8',
  nodeCentral: '#B45309',
  nodeCase:    '#475569',
  label:       '#0F172A',
  labelMuted:  '#64748B',
  tooltipBg:   '#0F172A',
  tooltipText: '#F1F5F9',
};

const R = { central: 22, person: 16, case: 12 };

interface SimNode extends d3.SimulationNodeDatum {
  id: string; label: string; type: 'person' | 'case';
  is_central: boolean; age?: number; crime_type?: string;
}
interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  relationship: string;
}

export default function NetworkGraph({ data }: Props) {
  const svgRef     = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const simRef     = useRef<d3.Simulation<SimNode, undefined> | null>(null);

  const buildGraph = useCallback(() => {
    if (!svgRef.current || !data) return;
    simRef.current?.stop();

    const svg    = d3.select(svgRef.current);
    const width  = svgRef.current.clientWidth  || 800;
    const height = svgRef.current.clientHeight || 520;
    svg.selectAll('*').remove();

    // Zoom
    const g    = svg.append('g');
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on('zoom', ev => g.attr('transform', ev.transform));
    svg.call(zoom as any);

    // Data
    const nodes: SimNode[] = data.nodes.map(n => ({
      id: n.data.id, label: n.data.label, type: n.data.type,
      is_central: !!n.data.is_central, age: n.data.age, crime_type: n.data.crime_type,
    }));
    const byId = new Map(nodes.map(n => [n.id, n]));
    const links: SimLink[] = data.edges
      .filter(e => byId.has(e.data.source) && byId.has(e.data.target))
      .map(e => ({ source: e.data.source, target: e.data.target, relationship: e.data.relationship }));

    // Simulation
    const sim = d3.forceSimulation<SimNode>(nodes)
      .force('link',    d3.forceLink<SimNode, SimLink>(links).id(d => d.id).distance(d => {
        const s = d.source as SimNode, t = d.target as SimNode;
        return (s.type === 'case' || t.type === 'case') ? 90 : 130;
      }).strength(0.5))
      .force('charge',  d3.forceManyBody<SimNode>().strength(-280))
      .force('center',  d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide<SimNode>(d =>
        (d.is_central ? R.central : d.type === 'person' ? R.person : R.case) + 8));
    simRef.current = sim;

    // Arrow marker
    svg.append('defs').append('marker')
      .attr('id', 'arrow').attr('viewBox', '0 -4 8 8').attr('refX', 20)
      .attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
      .append('path').attr('d', 'M0,-4L8,0L0,4').attr('fill', C.edge);

    // Edges
    const link = g.append('g')
      .selectAll('line').data(links).join('line')
      .attr('stroke', C.edge).attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#arrow)');

    // Tooltip
    const tip = d3.select(tooltipRef.current!);

    // Drag
    const drag = d3.drag<SVGGElement, SimNode>()
      .on('start', (ev, d) => { if (!ev.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on('drag',  (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
      .on('end',   (ev, d) => { if (!ev.active) sim.alphaTarget(0); d.fx = null; d.fy = null; });

    // Nodes
    const node = g.append('g')
      .selectAll<SVGGElement, SimNode>('g').data(nodes).join('g')
      .attr('cursor', 'grab')
      .call(drag as any);

    node.append('circle')
      .attr('r', d => d.is_central ? R.central : d.type === 'person' ? R.person : R.case)
      .attr('fill', d => d.is_central ? C.nodeCentral : d.type === 'person' ? C.nodePerson : C.nodeCase)
      .attr('stroke', '#fff').attr('stroke-width', 2)
      .on('mouseover', (ev, d) => {
        tip.style('display', 'block')
           .style('left', `${ev.offsetX + 14}px`).style('top', `${ev.offsetY - 14}px`);
        tip.select('.tt-name').text(d.label);
        tip.select('.tt-meta').text(
          d.type === 'person'
            ? `${d.is_central ? 'Central · ' : ''}${d.age ? `Age ${d.age}` : 'Age unknown'}`
            : `Case · ${d.crime_type ?? 'Unknown'}`);
      })
      .on('mousemove', ev => tip.style('left', `${ev.offsetX + 14}px`).style('top', `${ev.offsetY - 14}px`))
      .on('mouseout',  ()  => tip.style('display', 'none'));

    node.append('text')
      .attr('dy', d => (d.is_central ? R.central : d.type === 'person' ? R.person : R.case) + 14)
      .attr('text-anchor', 'middle')
      .attr('font-size',   d => d.is_central ? 11 : 9)
      .attr('font-family', '"IBM Plex Sans", sans-serif')
      .attr('font-weight', d => d.is_central ? '600' : '400')
      .attr('fill',        d => d.type === 'case' ? C.labelMuted : C.label)
      .text(d => d.label.length > 20 ? d.label.slice(0, 19) + '…' : d.label)
      .style('pointer-events', 'none');

    // Tick
    sim.on('tick', () => {
      link
        .attr('x1', d => (d.source as SimNode).x ?? 0)
        .attr('y1', d => (d.source as SimNode).y ?? 0)
        .attr('x2', d => (d.target as SimNode).x ?? 0)
        .attr('y2', d => (d.target as SimNode).y ?? 0);
      node.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });
    sim.on('end', () => sim.stop());

  }, [data]);

  useEffect(() => {
    buildGraph();
    return () => { simRef.current?.stop(); };
  }, [buildGraph]);

  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(() => buildGraph());
    ro.observe(el);
    return () => ro.disconnect();
  }, [buildGraph]);

  return (
    <div className="relative w-full" style={{ height: 520, backgroundColor: C.canvasBg }}>
      <svg ref={svgRef} className="w-full h-full" style={{ display: 'block' }} />
      <div
        ref={tooltipRef}
        className="absolute pointer-events-none hidden z-10 px-3 py-2 rounded text-xs shadow-lg"
        style={{ backgroundColor: C.tooltipBg, color: C.tooltipText, maxWidth: 220, minWidth: 120 }}
      >
        <div className="tt-name font-semibold text-sm" />
        <div className="tt-meta mt-0.5 opacity-70" />
      </div>
    </div>
  );
}
