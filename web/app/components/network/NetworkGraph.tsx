'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { NetworkGraph as NetworkGraphData } from '@/lib/api';
import * as d3 from 'd3';

interface Props { data: NetworkGraphData; }

const C = {
  canvasBg: '#1C0E10',
  edge: '#6B1019',
  edgeHover: '#9A2A3A',
  nodePerson: '#AD222F',
  nodeCentral: '#FEB226',
  nodeCase: '#9A8A6E',
  label: '#FBF6E9',
  labelMuted: '#9A8A6E',
  tooltipBg: '#241214',
  tooltipBorder: '#6B1019',
  tooltipText: '#FBF6E9',
  stroke: '#160A0B',
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
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const simRef = useRef<d3.Simulation<SimNode, undefined> | null>(null);
  const nodesRef = useRef<SimNode[]>([]);
  const linksRef = useRef<SimLink[]>([]);
  const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
  const rafRef = useRef<number>(0);
  const sizeRef = useRef({ w: 800, h: 520, dpr: 1 });
  const hoverNodeRef = useRef<SimNode | null>(null);
  const dragNodeRef = useRef<SimNode | null>(null);

  const getR = useCallback((d: SimNode) => d.is_central ? R.central : d.type === 'person' ? R.person : R.case, []);
  const getFill = useCallback((d: SimNode) => d.is_central ? C.nodeCentral : d.type === 'person' ? C.nodePerson : C.nodeCase, []);

  const resizeCanvas = useCallback(() => {
    const cont = containerRef.current;
    const canvas = canvasRef.current;
    if (!cont || !canvas) return;
    const rect = cont.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(100, rect.width);
    const h = Math.max(200, rect.height);
    sizeRef.current = { w, h, dpr };
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  const invertPoint = useCallback((clientX: number, clientY: number) => {
    const cont = containerRef.current;
    if (!cont) return [0, 0] as [number, number];
    const rect = cont.getBoundingClientRect();
    const t = transformRef.current;
    return [(clientX - rect.left - t.x) / t.k, (clientY - rect.top - t.y) / t.k] as [number, number];
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { w, h, dpr } = sizeRef.current;
    const t = transformRef.current;
    const nodes = nodesRef.current;
    const links = linksRef.current;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = C.canvasBg;
    ctx.fillRect(0, 0, w, h);
    ctx.translate(t.x, t.y);
    ctx.scale(t.k, t.k);

    for (const l of links) {
      const s = l.source as SimNode;
      const tt = l.target as SimNode;
      if (s.x == null || s.y == null || tt.x == null || tt.y == null) continue;
      const isHover = hoverNodeRef.current && (hoverNodeRef.current === s || hoverNodeRef.current === tt);
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(tt.x, tt.y);
      ctx.strokeStyle = isHover ? C.edgeHover : C.edge;
      ctx.lineWidth = (isHover ? 2.4 : 1.4) / t.k;
      ctx.stroke();
      const ang = Math.atan2(tt.y - s.y, tt.x - s.x);
      const r = getR(tt);
      const ax = tt.x - Math.cos(ang) * (r + 4);
      const ay = tt.y - Math.sin(ang) * (r + 4);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax - 6 * Math.cos(ang - Math.PI / 6), ay - 6 * Math.sin(ang - Math.PI / 6));
      ctx.lineTo(ax - 6 * Math.cos(ang + Math.PI / 6), ay - 6 * Math.sin(ang + Math.PI / 6));
      ctx.closePath();
      ctx.fillStyle = isHover ? C.edgeHover : C.edge;
      ctx.fill();
    }

    for (const n of nodes) {
      if (n.x == null || n.y == null) continue;
      const r = getR(n);
      const isHover = hoverNodeRef.current === n;
      const isDrag = dragNodeRef.current === n;
      ctx.beginPath();
      ctx.arc(n.x, n.y, r + (isHover || isDrag ? 2 : 0), 0, Math.PI * 2);
      ctx.fillStyle = getFill(n);
      ctx.fill();
      ctx.lineWidth = (isDrag ? 3 : 2) / t.k;
      ctx.strokeStyle = isDrag ? C.nodeCentral : C.stroke;
      ctx.stroke();
      if (isHover || isDrag) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 7, 0, Math.PI * 2);
        ctx.strokeStyle = C.nodeCentral + '55';
        ctx.lineWidth = 1.2 / t.k;
        ctx.stroke();
      }
    }

    for (const n of nodes) {
      if (n.x == null || n.y == null) continue;
      const r = getR(n);
      const label = n.label.length > 22 ? n.label.slice(0, 21) + '…' : n.label;
      ctx.fillStyle = n.type === 'case' ? C.labelMuted : C.label;
      ctx.font = `${n.is_central ? '700' : '500'} ${n.is_central ? 11 : 9}px "IBM Plex Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(label, n.x, n.y + r + 9);
    }

    ctx.restore();
  }, [getR, getFill]);

  const scheduleRender = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => render());
  }, [render]);

  useEffect(() => {
    if (!data || !data.nodes.length) return;
    resizeCanvas();
    const { w, h } = sizeRef.current;

    const nodes: SimNode[] = data.nodes.map(n => ({
      id: n.data.id, label: n.data.label, type: n.data.type,
      is_central: !!n.data.is_central, age: n.data.age, crime_type: n.data.crime_type,
    }));
    const byId = new Map(nodes.map(n => [n.id, n]));
    const links: SimLink[] = data.edges
      .filter(e => byId.has(e.data.source) && byId.has(e.data.target))
      .map(e => ({ source: e.data.source, target: e.data.target, relationship: e.data.relationship }));

    nodesRef.current = nodes;
    linksRef.current = links;

    simRef.current?.stop();
    const sim = d3.forceSimulation<SimNode>(nodes)
      .force('link', d3.forceLink<SimNode, SimLink>(links).id(d => d.id)
        .distance(d => {
          const s = d.source as SimNode, t = d.target as SimNode;
          return (s.type === 'case' || t.type === 'case') ? 90 : 130;
        }).strength(0.5))
      .force('charge', d3.forceManyBody<SimNode>().strength(-360))
      .force('center', d3.forceCenter(w / 2, h / 2))
      .force('collide', d3.forceCollide<SimNode>(d => getR(d) + 12))
      .alphaDecay(0.03)
      .velocityDecay(0.32);

    sim.on('tick', () => scheduleRender());
    sim.on('end', () => { sim.stop(); scheduleRender(); });
    simRef.current = sim;
    scheduleRender();

    return () => { sim.stop(); };
  }, [data, resizeCanvas, scheduleRender, getR]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const cont = containerRef.current;
    if (!canvas || !cont) return;
    const tip = tooltipRef.current;

    const showTip = (n: SimNode, clientX: number, clientY: number) => {
      if (!tip || !cont) return;
      const rect = cont.getBoundingClientRect();
      tip.style.display = 'block';
      tip.style.left = `${clientX - rect.left + 14}px`;
      tip.style.top = `${clientY - rect.top - 14}px`;
      (tip.querySelector('.tt-name') as HTMLElement).textContent = n.label;
      (tip.querySelector('.tt-meta') as HTMLElement).textContent =
        n.type === 'person'
          ? `${n.is_central ? 'Central · ' : ''}${n.age ? `Age ${n.age}` : 'Age unknown'}`
          : `Case · ${n.crime_type ?? 'Unknown'}`;
    };
    const hideTip = () => { if (tip) tip.style.display = 'none'; };

    const onHoverMove = (e: MouseEvent) => {
      if (dragNodeRef.current) return;
      const [ix, iy] = invertPoint(e.clientX, e.clientY);
      const found = simRef.current?.find(ix, iy, 30) ?? null;
      if (found !== hoverNodeRef.current) {
        hoverNodeRef.current = found;
        scheduleRender();
      }
      if (found) {
        canvas.style.cursor = 'grab';
        showTip(found, e.clientX, e.clientY);
      } else {
        canvas.style.cursor = 'grab';
        hideTip();
      }
    };

    const onLeave = () => {
      hoverNodeRef.current = null;
      hideTip();
      scheduleRender();
    };

    const zoom = d3.zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.2, 5])
      .filter((ev: any) => {
        if (dragNodeRef.current) return false;
        if (ev.type === 'dblclick') return false;
        if (ev.button !== 0 && ev.type !== 'wheel') return false;
        if (ev.type === 'mousedown') {
          const [ix, iy] = invertPoint(ev.clientX, ev.clientY);
          const under = simRef.current?.find(ix, iy, 28);
          if (under) return false;
        }
        return true;
      })
      .on('zoom', (ev) => {
        transformRef.current = ev.transform;
        scheduleRender();
        hideTip();
      });

    const drag = d3.drag<HTMLCanvasElement, SimNode | null>()
      .subject((ev: any) => {
        const [ix, iy] = invertPoint(ev.sourceEvent.clientX, ev.sourceEvent.clientY);
        const found = simRef.current?.find(ix, iy, 30) ?? null;
        return found as any;
      })
      .on('start', (ev: any) => {
        const n = ev.subject as SimNode;
        if (!n) return;
        dragNodeRef.current = n;
        hoverNodeRef.current = n;
        simRef.current?.alphaTarget(0.35).restart();
        n.fx = n.x;
        n.fy = n.y;
        canvas.style.cursor = 'grabbing';
        ev.sourceEvent.stopPropagation();
        scheduleRender();
      })
      .on('drag', (ev: any) => {
        const n = dragNodeRef.current;
        if (!n) return;
        const [ix, iy] = invertPoint(ev.sourceEvent.clientX, ev.sourceEvent.clientY);
        n.fx = ix;
        n.fy = iy;
      })
      .on('end', (ev: any) => {
        const n = ev.subject as SimNode;
        if (n) {
          n.fx = null;
          n.fy = null;
        }
        if (!ev.active) simRef.current?.alphaTarget(0);
        dragNodeRef.current = null;
        canvas.style.cursor = 'grab';
        scheduleRender();
      });

    const sel = d3.select(canvas);
    sel.call(zoom as any);
    sel.call(zoom.transform as any, transformRef.current);
    sel.call(drag as any);

    canvas.addEventListener('mousemove', onHoverMove);
    canvas.addEventListener('mouseleave', onLeave);

    return () => {
      canvas.removeEventListener('mousemove', onHoverMove);
      canvas.removeEventListener('mouseleave', onLeave);
      sel.on('.zoom', null).on('.drag', null);
    };
  }, [invertPoint, scheduleRender]);

  useEffect(() => {
    const cont = containerRef.current;
    if (!cont) return;
    let t: any;
    const ro = new ResizeObserver(() => {
      clearTimeout(t);
      t = setTimeout(() => {
        resizeCanvas();
        if (simRef.current) {
          const { w, h } = sizeRef.current;
          (simRef.current.force('center') as any)?.x(w / 2).y(h / 2);
          simRef.current.alpha(0.3).restart();
        }
        scheduleRender();
      }, 120);
    });
    ro.observe(cont);
    return () => { ro.disconnect(); clearTimeout(t); };
  }, [resizeCanvas, scheduleRender]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  if (!data || !data.nodes.length) {
    return (
      <div className="w-full h-[520px] bg-surface-muted rounded flex items-center justify-center border border-navy-border/60">
        <span className="text-sm text-ink-muted">No network data · enter a valid Accused ID</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full border-y border-navy-border/40 select-none" style={{ height: 520, backgroundColor: C.canvasBg }}>
      <canvas ref={canvasRef} className="w-full h-full block" style={{ cursor: 'grab', touchAction: 'none' }} />
      <div
        ref={tooltipRef}
        className="absolute pointer-events-none hidden z-10 px-3 py-2 rounded text-xs shadow-panel border"
        style={{ backgroundColor: C.tooltipBg, color: C.tooltipText, borderColor: C.tooltipBorder, maxWidth: 220, minWidth: 140 }}
      >
        <div className="tt-name font-bold text-sm" style={{ fontFamily: '"IBM Plex Mono", monospace' }} />
        <div className="tt-meta mt-0.5 opacity-70 text-2xs" />
      </div>
      <div className="absolute bottom-2 left-2 text-2xs text-ink-muted bg-surface-card/90 px-2.5 py-1 rounded border border-navy-border/60">
        Drag node to move · Drag background to pan · Scroll to zoom
      </div>
    </div>
  );
}
