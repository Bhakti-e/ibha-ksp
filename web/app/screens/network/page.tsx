'use client';

import { useState, useEffect, useRef } from 'react';
import { getNetwork, getCurrentUser } from '@/lib/api';
import type { NetworkGraph } from '@/lib/api';

export default function NetworkPage() {
  const [personId, setPersonId] = useState('');
  const [network, setNetwork] = useState<NetworkGraph | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      window.location.href = '/login';
      return;
    }
  }, []);

  useEffect(() => {
    if (network) {
      drawNetwork();
    }
  }, [network]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personId.trim()) return;

    setLoading(true);
    setError('');

    try {
      const data = await getNetwork(personId);
      setNetwork(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load network');
      setNetwork(null);
    } finally {
      setLoading(false);
    }
  };

  const drawNetwork = () => {
    if (!network || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = 600;

    // Clear canvas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Simple force-directed layout
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 3;

    // Position nodes
    const nodePositions: Record<string, { x: number; y: number }> = {};
    network.nodes.forEach((node, idx) => {
      const angle = (idx / network.nodes.length) * 2 * Math.PI;
      nodePositions[node.data.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });

    // Draw edges
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    network.edges.forEach((edge) => {
      const source = nodePositions[edge.data.source];
      const target = nodePositions[edge.data.target];
      if (source && target) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
      }
    });

    // Draw nodes
    network.nodes.forEach((node) => {
      const pos = nodePositions[node.data.id];
      if (!pos) return;

      // Node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, node.data.type === 'person' ? 25 : 15, 0, 2 * Math.PI);
      
      if (node.data.type === 'person') {
        ctx.fillStyle = node.data.is_central ? '#f59e0b' : '#3b82f6';
      } else {
        ctx.fillStyle = '#ef4444';
      }
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#f1f5f9';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.data.label.substring(0, 20), pos.x, pos.y + 35);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text mb-2">Criminal Network Analysis</h1>
        <p className="text-foreground-muted">Visualize connections between accused and cases</p>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <input
            type="text"
            value={personId}
            onChange={(e) => setPersonId(e.target.value)}
            placeholder="Enter Accused ID (e.g., 1, 2, 3...)"
            className="input flex-1"
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Loading...' : 'Load Network'}
          </button>
        </form>
        <p className="text-xs text-foreground-muted mt-2">
          Try IDs from seed data: 1, 2, 3, 4 (Ravi Kumar, Deepak Shetty, etc.)
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Network Visualization */}
      {network && (
        <div className="card">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Network Graph</h2>
            <div className="flex items-center space-x-6 text-sm text-foreground-muted">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-amber-500" />
                <span>Central Person</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-blue-500" />
                <span>Co-Accused</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-red-500" />
                <span>Cases</span>
              </div>
            </div>
          </div>

          <canvas
            ref={canvasRef}
            className="w-full bg-slate-900 rounded-lg border border-border"
            style={{ height: '600px' }}
          />

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-foreground-muted">Total Nodes</p>
              <p className="text-2xl font-bold">{network.metadata.total_nodes}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-foreground-muted">Total Connections</p>
              <p className="text-2xl font-bold">{network.metadata.total_edges}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-foreground-muted">Cases Involved</p>
              <p className="text-2xl font-bold">{network.metadata.cases_count}</p>
            </div>
          </div>

          {/* Node List */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Network Details</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {network.nodes
                .filter((n) => n.data.type === 'person')
                .map((node) => (
                  <div
                    key={node.data.id}
                    className="p-3 bg-muted/50 rounded-lg border border-border hover:border-primary transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{node.data.label}</p>
                        <p className="text-sm text-foreground-muted">
                          {node.data.age ? `Age: ${node.data.age}` : 'Age unknown'}
                        </p>
                      </div>
                      {node.data.is_central && (
                        <span className="px-2 py-1 bg-amber-500/20 text-amber-500 text-xs rounded-full">
                          Central
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {!network && !loading && !error && (
        <div className="card text-center py-12">
          <svg
            className="w-16 h-16 text-foreground-muted mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <p className="text-foreground-muted">Enter an Accused ID to visualize their network</p>
        </div>
      )}
    </div>
  );
}
