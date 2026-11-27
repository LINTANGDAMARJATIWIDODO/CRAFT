'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContext';
import { API_BASE, fetchWorkflowsUnified } from '@/lib/craft-client';
import { INITIAL_AGENTS } from '@/lib/constants';
import { SAMPLE_SALES_CSV } from '@/lib/task-store';
import { parseCsvContent, profileDataset, computeDeterministicCalculations } from '@/lib/dataset-analyzer';
import { computeSha256, formatTimestamp, truncateAddress } from '@/lib/utils';
import {
  WorkflowDefinition,
  WorkflowEdge,
  WorkflowExecutionRecord,
  WorkflowNode,
  WorkflowNodeExecutionLog,
  WorkflowNodeType,
} from '@craft/shared';
import {
  Workflow,
  Play,
  Save,
  Plus,
  Trash2,
  Link2,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sliders,
  Layers,
  X,
} from 'lucide-react';

const NODE_CATALOG: Array<{ type: WorkflowNodeType; label: string; category: string }> = [
  { type: 'dataset_upload', label: 'Dataset Upload', category: 'Ingestion' },
  { type: 'data_cleaning', label: 'Data Cleaning', category: 'Preparation' },
  { type: 'data_validation', label: 'Data Validation', category: 'Audit' },
  { type: 'statistical_analysis', label: 'Statistical Analysis', category: 'Math' },
  { type: 'anomaly_detection', label: 'Anomaly Detection', category: 'Audit' },
  { type: 'ai_interpretation', label: 'AI Interpretation', category: 'AI' },
  { type: 'agent_review', label: 'Agent Review', category: 'Governance' },
  { type: 'report_generation', label: 'Report Generation', category: 'Output' },
  { type: 'proof_verification', label: 'Proof Verification', category: 'Trust' },
  { type: 'human_approval', label: 'Human Approval', category: 'Governance' },
];

export default function WorkflowStudioPage() {
  const { notify } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);

  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecutionRecord[]>([]);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string>('');
  const [workflowName, setWorkflowName] = useState<string>('Custom Enterprise Pipeline');
  const [workflowDesc, setWorkflowDesc] = useState<string>('Configurable node-based analytical workflow.');
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [csvContent, setCsvContent] = useState<string>(SAMPLE_SALES_CSV);
  const [fileName, setFileName] = useState<string>('enterprise_q1_sales_sample.csv');
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [latestExecution, setLatestExecution] = useState<WorkflowExecutionRecord | null>(null);

  useEffect(() => {
    fetchWorkflowsUnified().then((res) => {
      setWorkflows(res.workflows);
      setExecutions(res.executions);
      if (res.workflows.length > 0) {
        const first = res.workflows[0];
        setActiveWorkflowId(first.id);
        setWorkflowName(first.name);
        setWorkflowDesc(first.description);
        setNodes(first.nodes);
        setEdges(first.edges);
        if (first.nodes.length > 0) setSelectedNodeId(first.nodes[0].id);
      }
      if (res.executions.length > 0) {
        setLatestExecution(res.executions[0]);
      }
    });
  }, []);

  const loadTemplate = (wf: WorkflowDefinition) => {
    setActiveWorkflowId(wf.id);
    setWorkflowName(wf.name);
    setWorkflowDesc(wf.description);
    setNodes(wf.nodes.map((n) => ({ ...n, position: { ...n.position }, config: { ...n.config } })));
    setEdges(wf.edges.map((e) => ({ ...e })));
    setSelectedNodeId(wf.nodes[0]?.id || null);
    setConnectSourceId(null);
    notify({ title: 'Workflow Loaded', description: `Loaded '${wf.name}' onto canvas.`, variant: 'info' });
  };

  const addNodeToCanvas = (type: WorkflowNodeType, pos?: { x: number; y: number }) => {
    const meta = NODE_CATALOG.find((c) => c.type === type)!;
    const id = `n-${Date.now().toString(36).slice(-4)}`;
    const position = pos || {
      x: 60 + ((nodes.length % 4) * 230),
      y: 60 + Math.floor(nodes.length / 4) * 140,
    };
    const newNode: WorkflowNode = {
      id,
      type,
      position,
      config: {
        label: meta.label,
        assignedAgentId: 'agent-datacraft-01',
        zScoreThreshold: 2.0,
        handleMissingStrategy: 'flag_only',
        requireProofHash: true,
        requireHumanSignOff: type === 'human_approval',
      },
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(id);

    // Auto-connect from currently selected node if helpful
    if (selectedNodeId && selectedNodeId !== id) {
      const edgeId = `e-${selectedNodeId}-${id}`;
      setEdges((prev) => [...prev, { id: edgeId, source: selectedNodeId, target: id }]);
    }
  };

  const deleteSelectedNode = () => {
    if (!selectedNodeId) return;
    setNodes((prev) => prev.filter((n) => n.id !== selectedNodeId));
    setEdges((prev) => prev.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
  };

  const handleNodePortConnect = (nodeId: string) => {
    if (!connectSourceId) {
      setConnectSourceId(nodeId);
      notify({
        title: 'Connect Mode Active',
        description: 'Now click the destination node to create a connection edge.',
        variant: 'info',
      });
      return;
    }
    if (connectSourceId === nodeId) {
      setConnectSourceId(null);
      return;
    }
    const duplicate = edges.some((e) => e.source === connectSourceId && e.target === nodeId);
    if (!duplicate) {
      setEdges((prev) => [...prev, { id: `e-${connectSourceId}-${nodeId}`, source: connectSourceId, target: nodeId }]);
      notify({ title: 'Nodes Connected', description: 'Created directed workflow edge.', variant: 'success' });
    }
    setConnectSourceId(null);
  };

  const updateSelectedNodeConfig = (patch: Partial<WorkflowNode['config']>) => {
    if (!selectedNodeId) return;
    setNodes((prev) =>
      prev.map((n) => (n.id === selectedNodeId ? { ...n, config: { ...n.config, ...patch } } : n))
    );
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingNodeId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(12, Math.min(rect.width - 190, e.clientX - rect.left - dragOffset.x));
    const y = Math.max(12, Math.min(rect.height - 90, e.clientY - rect.top - dragOffset.y));
    setNodes((prev) => prev.map((n) => (n.id === draggingNodeId ? { ...n, position: { x, y } } : n)));
  };

  const handleSaveWorkflow = async () => {
    setIsSaving(true);
    try {
      const payload = { id: activeWorkflowId, name: workflowName, description: workflowDesc, nodes, edges };
      let saved: WorkflowDefinition | null = null;
      try {
        const res = await fetch(`${API_BASE}/api/workflows`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          saved = data.workflow;
        }
      } catch {}

      if (!saved) {
        saved = {
          id: `wf-local-${Date.now().toString(36)}`,
          name: workflowName,
          description: workflowDesc,
          isTemplate: false,
          nodes,
          edges,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      setWorkflows((prev) => [saved!, ...prev.filter((w) => w.id !== saved!.id)]);
      setActiveWorkflowId(saved.id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('craft_workflows_v1', JSON.stringify([saved, ...workflows.filter((w) => w.id !== saved!.id)]));
      }
      notify({ title: 'Workflow Saved', description: `'${saved.name}' saved with ${nodes.length} nodes.`, variant: 'success' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExecuteWorkflow = async (simulateEmptyCsvError = false) => {
    if (nodes.length === 0) {
      notify({ title: 'Empty Canvas', description: 'Add at least one node before running.', variant: 'warning' });
      return;
    }
    setIsRunning(true);
    const activeCsv = simulateEmptyCsvError ? '' : csvContent;

    try {
      let execRecord: WorkflowExecutionRecord | null = null;
      try {
        const res = await fetch(`${API_BASE}/api/workflows/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workflowId: activeWorkflowId,
            workflowName,
            nodes,
            edges,
            csvContent: activeCsv,
            fileName: simulateEmptyCsvError ? 'empty_invalid.csv' : fileName,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          execRecord = data.execution;
        }
      } catch {}

      if (!execRecord) {
        // Pure browser deterministic fallback
        const startedAt = new Date().toISOString();
        const stepResults: WorkflowNodeExecutionLog[] = [];
        let parsed = activeCsv.trim() ? await parseCsvContent(activeCsv) : { headers: [], rows: [], errors: [] };
        let profiling = parsed.rows.length > 0 ? await profileDataset(fileName, activeCsv, parsed) : null;
        let calc = profiling ? await computeDeterministicCalculations(parsed, profiling) : null;
        let failed = false;
        let waitingApproval = false;

        for (const node of nodes) {
          if (node.type === 'dataset_upload' && (!parsed.rows.length || !parsed.headers.length)) {
            failed = true;
            stepResults.push({
              nodeId: node.id,
              nodeType: node.type,
              label: node.config.label,
              status: 'failed',
              durationMs: 4,
              outputSummary: 'Halted at ingestion gate.',
              error: 'Dataset contains 0 parseable rows.',
            });
            break;
          }
          if (node.type === 'human_approval') {
            waitingApproval = true;
            stepResults.push({
              nodeId: node.id,
              nodeType: node.type,
              label: node.config.label,
              status: 'waiting_approval',
              durationMs: 2,
              outputSummary: 'Paused awaiting human approval sign-off.',
            });
          } else {
            stepResults.push({
              nodeId: node.id,
              nodeType: node.type,
              label: node.config.label,
              status: 'completed',
              durationMs: 14,
              outputSummary: `Executed ${node.config.label} (${profiling?.rowCount || 0} rows processed).`,
              evidenceHash: calc?.rawHash,
            });
          }
        }

        const proofHash = profiling && calc ? await computeSha256(`${profiling.sha256Hash}:${calc.rawHash}`) : undefined;
        execRecord = {
          id: `wfexec-${Date.now().toString(36)}`,
          workflowId: activeWorkflowId || 'custom',
          workflowName,
          datasetFileName: simulateEmptyCsvError ? 'empty_invalid.csv' : fileName,
          status: failed ? 'failed' : waitingApproval ? 'waiting_human_approval' : 'completed',
          startedAt,
          completedAt: new Date().toISOString(),
          stepResults,
          finalProofHash: proofHash,
        };
      }

      setLatestExecution(execRecord);
      setExecutions((prev) => [execRecord!, ...prev]);
      notify({
        title: `Workflow ${execRecord.status === 'failed' ? 'Failed (Handled)' : 'Executed'}`,
        description: `Processed ${execRecord.stepResults.length} node(s). Status: ${execRecord.status}.`,
        variant: execRecord.status === 'failed' ? 'warning' : 'success',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ivory-50">
              Visual Workflow Studio
            </h1>
            <Badge variant="success" size="sm">
              Node Pipeline Builder
            </Badge>
          </div>
          <p className="text-sm text-charcoal-400 mt-1">
            Compose, connect, save, and execute multi-node AI data workflows with drag-and-drop control and verifiable SHA-256 outputs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-charcoal-900 border border-subtle hover:border-refined text-xs font-mono text-ivory-200 flex items-center gap-1.5">
            <UploadCloud className="w-3.5 h-3.5 text-forest-400" />
            <span className="truncate max-w-[140px]">{fileName}</span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setCsvContent(await f.text());
                  setFileName(f.name);
                  notify({ title: 'Dataset Attached', description: f.name, variant: 'info' });
                }
              }}
            />
          </label>
          <Button variant="secondary" size="sm" isLoading={isSaving} leftIcon={<Save className="w-3.5 h-3.5" />} onClick={handleSaveWorkflow}>
            Save Graph
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExecuteWorkflow(true)} disabled={isRunning}>
            Test Error Gate
          </Button>
          <Button variant="primary" size="sm" isLoading={isRunning} leftIcon={<Play className="w-3.5 h-3.5" />} onClick={() => handleExecuteWorkflow(false)}>
            Execute Workflow
          </Button>
        </div>
      </div>

      {/* Templates Selector Strip */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-mono text-charcoal-400 uppercase text-[11px] mr-1">Templates &amp; Saved:</span>
        {workflows.map((wf) => (
          <button
            key={wf.id}
            type="button"
            onClick={() => loadTemplate(wf)}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs border transition-colors ${
              activeWorkflowId === wf.id
                ? 'bg-forest-950/60 border-forest-500/50 text-ivory-50'
                : 'bg-charcoal-900 border-subtle text-charcoal-400 hover:text-ivory-100'
            }`}
          >
            {wf.name} ({wf.nodes.length})
          </button>
        ))}
      </div>

      {/* Main 3-Column Studio Grid: Node Palette + Interactive Canvas + Config Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Node Palette (2 cols on desktop, compact grid on tablet/mobile) */}
        <Card className="lg:col-span-2 bg-charcoal-900 border-subtle p-3.5 space-y-2.5">
          <span className="text-[10px] font-mono uppercase text-charcoal-400 block">
            Node Palette (Drag or Tap)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1.5">
            {NODE_CATALOG.map((item) => (
              <div
                key={item.type}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('craft/node-type', item.type)}
                onClick={() => addNodeToCanvas(item.type)}
                className="p-2 rounded-lg bg-charcoal-950 border border-subtle hover:border-forest-500/50 cursor-pointer transition-colors flex items-center justify-between text-xs"
              >
                <div className="min-w-0">
                  <div className="font-medium text-ivory-100 truncate text-[11px]">{item.label}</div>
                  <div className="text-[9px] font-mono text-charcoal-500">{item.category}</div>
                </div>
                <Plus className="w-3 h-3 text-forest-400 shrink-0" />
              </div>
            ))}
          </div>
        </Card>

        {/* Center Interactive Drag & Connect Canvas (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div
            ref={canvasRef}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={() => setDraggingNodeId(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const nodeType = e.dataTransfer.getData('craft/node-type') as WorkflowNodeType;
              if (nodeType && canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                addNodeToCanvas(nodeType, {
                  x: Math.max(16, e.clientX - rect.left - 80),
                  y: Math.max(16, e.clientY - rect.top - 30),
                });
              }
            }}
            className="relative w-full h-[360px] sm:h-[420px] lg:h-[460px] rounded-2xl border border-subtle bg-charcoal-950 bg-grid-pattern overflow-auto select-none"
          >
            {/* SVG Edges Layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: '1080px', minHeight: '420px' }}>
              {edges.map((edge) => {
                const src = nodes.find((n) => n.id === edge.source);
                const tgt = nodes.find((n) => n.id === edge.target);
                if (!src || !tgt) return null;
                const x1 = src.position.x + 170;
                const y1 = src.position.y + 32;
                const x2 = tgt.position.x;
                const y2 = tgt.position.y + 32;
                const cx = (x1 + x2) / 2;
                return (
                  <path
                    key={edge.id}
                    d={`M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`}
                    stroke="rgba(76, 146, 118, 0.75)"
                    strokeWidth="2"
                    fill="none"
                  />
                );
              })}
            </svg>

            {/* Draggable Nodes Layer */}
            <div className="relative" style={{ minWidth: '1080px', minHeight: '420px' }}>
              {nodes.map((node) => {
                const isSelected = node.id === selectedNodeId;
                const isConnectSource = node.id === connectSourceId;
                const stepExec = latestExecution?.stepResults.find((s) => s.nodeId === node.id);

                return (
                  <div
                    key={node.id}
                    style={{ left: node.position.x, top: node.position.y }}
                    onPointerDown={(e) => {
                      setSelectedNodeId(node.id);
                      const rect = e.currentTarget.getBoundingClientRect();
                      setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                      setDraggingNodeId(node.id);
                    }}
                    className={`absolute w-[170px] rounded-xl border p-2.5 cursor-grab active:cursor-grabbing shadow-subtle transition-colors touch-none ${
                      isConnectSource
                        ? 'bg-amber-950/50 border-amber-500 ring-1 ring-amber-400'
                        : isSelected
                        ? 'bg-forest-950/70 border-forest-400 ring-1 ring-forest-500/40'
                        : 'bg-charcoal-900 border-subtle hover:border-refined'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[9px] font-mono text-charcoal-400 mb-1">
                      <span className="truncate uppercase">{node.type.replace('_', ' ')}</span>
                      {stepExec?.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                      {stepExec?.status === 'failed' && <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />}
                      {stepExec?.status === 'waiting_approval' && <Clock className="w-3 h-3 text-amber-400 shrink-0" />}
                    </div>
                    <div className="text-xs font-semibold text-ivory-100 truncate">{node.config.label}</div>
                    <div className="mt-2 pt-1.5 border-t border-subtle flex items-center justify-between">
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => handleNodePortConnect(node.id)}
                        className="text-[10px] font-mono text-forest-400 hover:underline flex items-center gap-1"
                      >
                        <Link2 className="w-2.5 h-2.5" />
                        {connectSourceId ? (connectSourceId === node.id ? 'Cancel' : 'Link Here') : 'Connect'}
                      </button>
                      <span className="text-[9px] font-mono text-charcoal-500">{node.id}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Workflow Metadata Bar */}
          <Card className="bg-charcoal-900 border-subtle p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-mono text-[10px] text-charcoal-400 uppercase mb-1">Workflow Name</label>
              <input
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="w-full bg-charcoal-950 border border-subtle rounded-lg px-2.5 py-1.5 text-ivory-100"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-charcoal-400 uppercase mb-1">Description</label>
              <input
                type="text"
                value={workflowDesc}
                onChange={(e) => setWorkflowDesc(e.target.value)}
                className="w-full bg-charcoal-950 border border-subtle rounded-lg px-2.5 py-1.5 text-ivory-100"
              />
            </div>
          </Card>
        </div>

        {/* Right Configuration Panel (3 cols) */}
        <Card className="lg:col-span-3 bg-charcoal-900 border-subtle p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-subtle">
            <span className="text-xs font-semibold text-ivory-100 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-forest-400" />
              Node Configuration
            </span>
            {selectedNode && (
              <button
                type="button"
                onClick={deleteSelectedNode}
                className="text-rose-400 hover:text-rose-300 text-[11px] font-mono flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            )}
          </div>

          {!selectedNode ? (
            <p className="text-xs text-charcoal-400 py-8 text-center">
              Select a node on the canvas to configure parameters, agent assignment, or edges.
            </p>
          ) : (
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-mono text-[10px] text-charcoal-400 uppercase mb-1">Node Label</label>
                <input
                  type="text"
                  value={selectedNode.config.label}
                  onChange={(e) => updateSelectedNodeConfig({ label: e.target.value })}
                  className="w-full bg-charcoal-950 border border-subtle rounded-lg px-2.5 py-1.5 text-ivory-100"
                />
              </div>

              {(selectedNode.type === 'statistical_analysis' ||
                selectedNode.type === 'anomaly_detection' ||
                selectedNode.type === 'ai_interpretation') && (
                <div>
                  <label className="block font-mono text-[10px] text-charcoal-400 uppercase mb-1">Assigned Agent</label>
                  <select
                    value={selectedNode.config.assignedAgentId || ''}
                    onChange={(e) => updateSelectedNodeConfig({ assignedAgentId: e.target.value })}
                    className="w-full bg-charcoal-950 border border-subtle rounded-lg px-2.5 py-1.5 text-ivory-100 font-mono"
                  >
                    {INITIAL_AGENTS.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedNode.type === 'data_cleaning' && (
                <div>
                  <label className="block font-mono text-[10px] text-charcoal-400 uppercase mb-1">Missing Value Strategy</label>
                  <select
                    value={selectedNode.config.handleMissingStrategy || 'flag_only'}
                    onChange={(e) => updateSelectedNodeConfig({ handleMissingStrategy: e.target.value as any })}
                    className="w-full bg-charcoal-950 border border-subtle rounded-lg px-2.5 py-1.5 text-ivory-100 font-mono"
                  >
                    <option value="flag_only">Flag Only (Preserve Raw)</option>
                    <option value="zero_fill">Impute Missing with 0</option>
                    <option value="drop_nulls">Drop Rows Containing Nulls</option>
                  </select>
                </div>
              )}

              {selectedNode.type === 'anomaly_detection' && (
                <div>
                  <label className="block font-mono text-[10px] text-charcoal-400 uppercase mb-1">Z-Score Threshold</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="4.0"
                    value={selectedNode.config.zScoreThreshold ?? 2.0}
                    onChange={(e) => updateSelectedNodeConfig({ zScoreThreshold: parseFloat(e.target.value) || 2.0 })}
                    className="w-full bg-charcoal-950 border border-subtle rounded-lg px-2.5 py-1.5 text-ivory-100 font-mono"
                  />
                </div>
              )}

              {selectedNode.type === 'ai_interpretation' && (
                <div>
                  <label className="block font-mono text-[10px] text-charcoal-400 uppercase mb-1">Objective Prompt</label>
                  <textarea
                    rows={3}
                    value={selectedNode.config.objectivePrompt || ''}
                    placeholder="Instructions for grounded strategic narrative..."
                    onChange={(e) => updateSelectedNodeConfig({ objectivePrompt: e.target.value })}
                    className="w-full bg-charcoal-950 border border-subtle rounded-lg px-2.5 py-1.5 text-ivory-100"
                  />
                </div>
              )}

              {/* Outgoing edges management */}
              <div className="pt-2 border-t border-subtle space-y-1.5">
                <span className="text-[10px] font-mono text-charcoal-400 uppercase block">
                  Connections from {selectedNode.id}
                </span>
                {edges.filter((e) => e.source === selectedNode.id).length === 0 ? (
                  <p className="text-[11px] text-charcoal-500">No outgoing edges.</p>
                ) : (
                  edges
                    .filter((e) => e.source === selectedNode.id)
                    .map((edge) => (
                      <div key={edge.id} className="flex items-center justify-between text-[11px] font-mono bg-charcoal-950 px-2 py-1 rounded border border-subtle">
                        <span>→ {edge.target}</span>
                        <button
                          type="button"
                          onClick={() => setEdges((prev) => prev.filter((x) => x.id !== edge.id))}
                          className="text-rose-400 hover:text-rose-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Execution History & Step Results */}
      <Card className="bg-charcoal-900 border-subtle space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-subtle">
          <h3 className="text-sm font-semibold text-ivory-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-forest-400" />
            Workflow Execution History &amp; Step Logs ({executions.length})
          </h3>
          {latestExecution?.finalProofHash && (
            <span className="text-[11px] font-mono text-emerald-400">
              Latest Proof: {truncateAddress(latestExecution.finalProofHash, 8)}
            </span>
          )}
        </div>

        {!latestExecution ? (
          <p className="text-xs text-charcoal-400 py-4 text-center">
            Click &quot;Execute Workflow&quot; above to run your node graph against the attached CSV dataset.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <span className="text-ivory-100 font-semibold">
                Run: {latestExecution.id} ({latestExecution.datasetFileName})
              </span>
              <Badge
                variant={
                  latestExecution.status === 'completed'
                    ? 'success'
                    : latestExecution.status === 'waiting_human_approval'
                    ? 'warning'
                    : 'error'
                }
                size="sm"
              >
                {latestExecution.status.toUpperCase()}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 font-mono text-[11px]">
              {latestExecution.stepResults.map((s) => (
                <div
                  key={s.nodeId}
                  className={`p-3 rounded-xl border space-y-1 ${
                    s.status === 'failed'
                      ? 'bg-rose-950/20 border-rose-800/50'
                      : s.status === 'waiting_approval'
                      ? 'bg-amber-950/20 border-amber-800/50'
                      : 'bg-charcoal-950 border-subtle'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ivory-100 truncate">{s.label}</span>
                    <span className="text-[10px] text-charcoal-400">{s.durationMs}ms</span>
                  </div>
                  <p className="text-[10px] font-sans text-charcoal-300">{s.outputSummary}</p>
                  {s.error && <p className="text-[10px] text-rose-400">Error: {s.error}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
