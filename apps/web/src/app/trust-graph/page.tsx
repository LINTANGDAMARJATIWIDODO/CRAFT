'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { fetchTrustGraph } from '@/lib/craft-client';
import { TrustGraphNode, TrustGraphSnapshot } from '@craft/shared';
import { Network, RefreshCw, ShieldCheck, ArrowRight } from 'lucide-react';

export default function TrustGraphPage() {
  const [snapshot, setSnapshot] = useState<TrustGraphSnapshot | null>(null);
  const [selectedNode, setSelectedNode] = useState<TrustGraphNode | null>(null);
  const [loading, setLoading] = useState(true);

  const loadGraph = async () => {
    setLoading(true);
    const res = await fetchTrustGraph();
    setSnapshot(res.snapshot);
    setLoading(false);
  };

  useEffect(() => {
    loadGraph();
  }, []);

  const nodes = snapshot?.nodes || [];
  const edges = snapshot?.edges || [];

  // Deterministic circular SVG layout
  const nodePositions = new Map<string, { x: number; y: number }>();
  const cx = 360;
  const cy = 190;
  const rx = 250;
  const ry = 135;
  nodes.forEach((n, idx) => {
    const angle = (idx / Math.max(1, nodes.length)) * Math.PI * 2 - Math.PI / 2;
    nodePositions.set(n.id, {
      x: cx + Math.cos(angle) * rx,
      y: cy + Math.sin(angle) * ry,
    });
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ivory-50">
              Verified Agent Trust Graph
            </h1>
            <Badge variant="success" size="sm">Recorded Provenance Only</Badge>
          </div>
          <p className="text-sm text-charcoal-400 mt-1">
            Real-time relationship topology constructed strictly from observed delegations, validation handoffs, and client approvals.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={loadGraph} leftIcon={<RefreshCw className="w-4 h-4" />}>
          Refresh Graph
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-charcoal-900 border-subtle p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-charcoal-400">
              {nodes.length} NODES · {edges.length} VERIFIED EDGES
            </span>
            <span className="text-[11px] font-mono text-charcoal-500">Click any node to inspect edges</span>
          </div>

          <div className="w-full overflow-x-auto bg-charcoal-950 rounded-xl border border-subtle p-2">
            <svg viewBox="0 0 720 380" className="w-full min-w-[540px] h-80 sm:h-96">
              {edges.map((edge) => {
                const from = nodePositions.get(edge.source);
                const to = nodePositions.get(edge.target);
                if (!from || !to) return null;
                const stroke =
                  edge.relation === 'APPROVED_BY'
                    ? '#10b981'
                    : edge.relation === 'VALIDATED_BY'
                    ? '#F3BA2F'
                    : '#34725a';
                return (
                  <g key={edge.id}>
                    <line
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke={stroke}
                      strokeWidth={1.6}
                      strokeOpacity={0.55}
                      strokeDasharray={edge.isDemo ? '4 4' : undefined}
                    />
                  </g>
                );
              })}

              {nodes.map((node) => {
                const pos = nodePositions.get(node.id);
                if (!pos) return null;
                const isSelected = selectedNode?.id === node.id;
                const fill = node.kind === 'agent' ? '#12261e' : '#1b1d22';
                const stroke = isSelected
                  ? '#F3BA2F'
                  : node.kind === 'agent'
                  ? '#34725a'
                  : '#525866';
                return (
                  <g
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={node.kind === 'agent' ? 28 : 22}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={isSelected ? 2.8 : 1.8}
                    />
                    <text
                      x={pos.x}
                      y={pos.y + 42}
                      textAnchor="middle"
                      fill="#e4e4e7"
                      fontSize="11"
                      fontFamily="monospace"
                    >
                      {node.label.slice(0, 22)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </Card>

        <Card className="bg-charcoal-900 border-subtle p-5 space-y-4">
          <h2 className="text-sm font-semibold text-ivory-50 flex items-center gap-2">
            <Network className="w-4 h-4 text-forest-400" />
            {selectedNode ? selectedNode.label : 'Relationship Ledger'}
          </h2>

          {selectedNode && (
            <div className="p-3 rounded-lg bg-charcoal-950 border border-subtle text-xs space-y-1">
              <div className="font-mono text-forest-400 uppercase">{selectedNode.kind}</div>
              {selectedNode.roleTitle && <div className="text-charcoal-300">{selectedNode.roleTitle}</div>}
              {selectedNode.reputationScore !== undefined && (
                <div className="text-emerald-400 font-mono">Reputation: {selectedNode.reputationScore}</div>
              )}
            </div>
          )}

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {edges
              .filter((e) => !selectedNode || e.source === selectedNode.id || e.target === selectedNode.id)
              .map((e) => (
                <div key={e.id} className="p-2.5 rounded-lg bg-charcoal-950 border border-subtle text-[11px] space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-emerald-400">{e.relation}</span>
                    {e.isDemo ? (
                      <Badge variant="outline" size="sm">Seed Reference</Badge>
                    ) : (
                      <Badge variant="success" size="sm">Live Record</Badge>
                    )}
                  </div>
                  <div className="text-ivory-200 font-mono flex items-center gap-1 flex-wrap">
                    <span>{e.source}</span>
                    <ArrowRight className="w-3 h-3 text-charcoal-500" />
                    <span>{e.target}</span>
                  </div>
                  <div className="text-charcoal-500 font-mono">Task: {e.taskId}</div>
                </div>
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
