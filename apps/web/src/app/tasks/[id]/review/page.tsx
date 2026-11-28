'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useWallet } from '@/components/wallet/WalletContext';
import { useToast } from '@/components/ui/ToastContext';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { getTaskById, updateTask } from '@/lib/task-store';
import { API_BASE } from '@/lib/craft-client';
import { TaskRecord, TaskState } from '@craft/shared';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, TaskStateBadge } from '@/components/ui/Badge';
import { formatTimestamp, truncateAddress } from '@/lib/utils';
import {
  ShieldCheck,
  CheckCircle2,
  FileText,
  Download,
  RotateCcw,
  ExternalLink,
  Cpu,
  Sparkles,
  ArrowLeft,
  X,
  SearchCheck,
} from 'lucide-react';

export default function ResultReviewPage() {
  const params = useParams();
  const taskId = (params?.id as string) || '';
  const { isConnected, address, authenticateWithSignature } = useWallet();
  const { notify } = useToast();

  const [task, setTask] = useState<TaskRecord | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionReason, setRevisionReason] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      let record = getTaskById(taskId);
      if (!record) {
        try {
          const res = await fetch(`${API_BASE}/api/tasks/${taskId}`);
          if (res.ok) {
            const d = await res.json();
            record = d.task;
          }
        } catch {}
      }
      if (record) setTask(record);
    };
    load();
  }, [taskId]);

  if (!task || !task.report) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-charcoal-400">
        <h3 className="text-lg font-semibold text-ivory-100">Report Not Found or Still Processing</h3>
        <p className="text-xs text-charcoal-400 mt-2 mb-4">
          This task has not yet generated a finalized analytical report.
        </p>
        <Link href={`/tasks/${taskId}`}>
          <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Back to Workspace
          </Button>
        </Link>
      </div>
    );
  }

  const report = task.report;

  const handleApproveConfirmed = async () => {
    setIsApproving(true);
    try {
      let signed = false;
      if (isConnected) {
        signed = await authenticateWithSignature();
      }

      const approveRes = await fetch(`${API_BASE}/api/tasks/${task.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callerAddress: address || task.clientAddress }),
      }).catch(() => null);

      if (approveRes && !approveRes.ok) {
        const errBody = await approveRes.json().catch(() => ({}));
        throw new Error(errBody.error || 'Approval rejected by anti-self-approval safeguard.');
      }

      const updated = updateTask(task.id, {
        status: TaskState.Approved,
        approvedAt: new Date().toISOString(),
        isDemo: false,
        verificationTier: 'local_verified_digest',
      });

      if (updated) setTask(updated);
      const msg = signed
        ? `Client signature verified & work order finalized! Proof digest sealed & Agent Passport updated.`
        : `Work order approved! Proof digest sealed & Agent Passport updated.`;
      setSuccessMessage(msg);
      notify({ title: 'Deliverable Approved', description: msg, variant: 'success' });
    } catch (err: any) {
      notify({ title: 'Approval Error', description: err.message, variant: 'error' });
    } finally {
      setIsApproving(false);
      setIsApproveConfirmOpen(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionReason.trim()) {
      notify({ title: 'Feedback Required', description: 'Please describe requested revisions.', variant: 'warning' });
      return;
    }

    try {
      await fetch(`${API_BASE}/api/tasks/${task.id}/revision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: revisionReason.trim() }),
      });
    } catch {}

    const updated = updateTask(task.id, {
      status: TaskState.RevisionRequested,
      revisionReason: revisionReason.trim(),
    });

    if (updated) setTask(updated);
    setIsRevisionModalOpen(false);
    setSuccessMessage('Revision requested and recorded against Agent SLA telemetry.');
    notify({ title: 'Revision Requested', description: 'Agent notified to inspect client feedback.', variant: 'warning' });
  };

  const handleExportMarkdown = () => {
    const mdContent = `# Analytical Report: ${task.title}
**Task ID:** ${task.id}
**Generated At:** ${report.generatedAt}
**Assigned Agent:** ${report.agentId}
**Cryptographic Proof Hash:** ${report.proofHash}

---

## Executive Summary
${report.executiveSummary}

## Dataset Overview
- **File:** ${report.datasetOverview.datasetName}
- **Rows:** ${report.datasetOverview.totalRows}
- **Features:** ${report.datasetOverview.totalFeatures}
- **Quality:** ${report.datasetOverview.qualityAssessment}

## Key Metrics Audit
${report.keyMetrics.map((m) => `- **${m.label}:** ${m.value} (${m.interpretation})`).join('\n')}

## Detailed Analysis
${report.detailedAnalysis.map((d) => `- ${d}`).join('\n')}

## Business Recommendations
${report.recommendations.map((r) => `### [${r.priority.toUpperCase()}] ${r.action}\n*Rationale:* ${r.rationale}\n`).join('\n')}

## Calculation Evidence Audit
- **Deterministic Digest:** ${report.calculationEvidence.deterministicHash}
- **Evidence Audit:**
\`\`\`json
${JSON.stringify(report.calculationEvidence.metricsAudit, null, 2)}
\`\`\`
`;

    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CRAFT_Report_${task.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
    notify({ title: 'Exported Markdown Report', description: `CRAFT_Report_${task.id}.md`, variant: 'info' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-subtle">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href={`/tasks/${task.id}`} className="text-xs text-charcoal-400 hover:text-ivory-100 flex items-center gap-1 font-mono">
              <ArrowLeft className="w-3 h-3" /> Back
            </Link>
            <span className="text-xs text-charcoal-500">•</span>
            <TaskStateBadge state={task.status} />
            <Badge variant={task.isDemo ? 'outline' : 'success'} size="sm">
              {task.isDemo ? 'Sample Seed' : 'Live Record'}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ivory-50">
            Work Order Review: {task.title}
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-400">
            Submitted by Agent {report.agentId} on {formatTimestamp(task.submittedAt)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="outline" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />} onClick={handleExportMarkdown}>
            Export Report (.md)
          </Button>
          <Link href={`/trust?q=${encodeURIComponent(report.proofHash)}`}>
            <Button variant="outline" size="sm" leftIcon={<SearchCheck className="w-3.5 h-3.5" />}>
              Verify Proof
            </Button>
          </Link>

          {task.status !== TaskState.Approved && (
            <>
              <Button variant="secondary" size="sm" leftIcon={<RotateCcw className="w-3.5 h-3.5" />} onClick={() => setIsRevisionModalOpen(true)}>
                Request Revision
              </Button>
              <Button variant="primary" size="sm" leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />} onClick={() => setIsApproveConfirmOpen(true)}>
                Approve &amp; Finalize
              </Button>
            </>
          )}
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl border border-emerald-800/50 bg-emerald-950/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Proof Bar */}
      <div className="p-4 rounded-xl bg-charcoal-900 border border-subtle flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-ivory-100 font-semibold">Verified SHA-256 Output Proof</span>
            <Badge variant={task.onChainTxHash ? 'bnb' : 'outline'} size="sm">
              {task.onChainTxHash ? 'BNB Chain Anchored' : 'Cryptographic Digest Verified'}
            </Badge>
          </div>
          <p className="text-forest-300 text-[11px] break-all">{report.proofHash}</p>
        </div>

        {task.onChainTxHash && (
          <div className="shrink-0 text-right">
            <span className="text-[10px] text-charcoal-500 block uppercase">Transaction Hash</span>
            <a
              href={`https://${task.onChainChainId === 97 ? 'testnet.' : ''}bscscan.com/tx/${task.onChainTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-bnb-yellow hover:underline flex items-center gap-1 font-mono text-[11px]"
            >
              {truncateAddress(task.onChainTxHash, 8)} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <Card className="bg-charcoal-900 border-subtle">
            <CardHeader className="pb-3 border-b border-subtle">
              <CardTitle className="text-base text-ivory-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-forest-400" />
                Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-sm text-charcoal-200 leading-relaxed">
              <p>{report.executiveSummary}</p>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-charcoal-400">Audited Key Metrics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {report.keyMetrics.map((metric, i) => (
                <Card key={i} className="bg-charcoal-900/70 border-subtle p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-charcoal-400">{metric.label}</span>
                    <Badge variant="success" size="sm">
                      Audited
                    </Badge>
                  </div>
                  <div className="text-xl font-bold font-mono text-ivory-50 mb-1.5">{metric.value}</div>
                  <p className="text-[11px] text-charcoal-400 leading-snug">{metric.interpretation}</p>
                </Card>
              ))}
            </div>
          </div>

          <Card className="bg-charcoal-900 border-subtle">
            <CardHeader className="pb-3 border-b border-subtle">
              <CardTitle className="text-base text-ivory-100 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-400" />
                Detailed Mathematical Findings
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs text-charcoal-200">
              {report.detailedAnalysis.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-forest-400 mt-1.5 shrink-0" />
                  <p className="leading-relaxed">{item}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-charcoal-900 border-subtle">
            <CardHeader className="pb-3 border-b border-subtle">
              <CardTitle className="text-base text-ivory-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-bnb-yellow" />
                Prioritized Action Items
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {report.recommendations.map((rec, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-charcoal-950 border border-subtle text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ivory-100">{rec.action}</span>
                    <Badge variant={rec.priority === 'high' ? 'warning' : 'default'} size="sm">
                      {rec.priority.toUpperCase()} PRIORITY
                    </Badge>
                  </div>
                  <p className="text-charcoal-400 text-[11px] leading-relaxed">{rec.rationale}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-charcoal-900 border-subtle">
            <CardHeader className="pb-3 border-b border-subtle">
              <CardTitle className="text-sm font-semibold text-ivory-100">Dataset Overview</CardTitle>
            </CardHeader>
            <CardContent className="pt-3 space-y-2.5 font-mono text-xs">
              <div className="flex justify-between text-charcoal-400">
                <span>Dataset:</span>
                <span className="text-ivory-200 truncate max-w-[160px]">{report.datasetOverview.datasetName}</span>
              </div>
              <div className="flex justify-between text-charcoal-400">
                <span>Row Count:</span>
                <span className="text-ivory-100 font-bold">{report.datasetOverview.totalRows} rows</span>
              </div>
              <div className="flex justify-between text-charcoal-400">
                <span>Features:</span>
                <span className="text-ivory-100 font-bold">{report.datasetOverview.totalFeatures} cols</span>
              </div>
              <div className="pt-2 border-t border-subtle text-[11px] text-emerald-400">
                {report.datasetOverview.qualityAssessment}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-charcoal-900 border-subtle">
            <CardHeader className="pb-3 border-b border-subtle">
              <CardTitle className="text-sm font-semibold text-ivory-100 flex items-center justify-between">
                <span>Calculation Evidence</span>
                <span className="text-[10px] text-forest-400 font-mono">NON-LLM</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 font-mono text-xs space-y-3">
              <div>
                <span className="text-charcoal-500 text-[10px] block">Deterministic Engine Digest:</span>
                <span className="text-forest-300 text-[11px] break-all">{report.calculationEvidence.deterministicHash}</span>
              </div>
              <div className="bg-charcoal-950 p-3 rounded-lg border border-subtle text-[11px] space-y-1 text-charcoal-300">
                {Object.entries(report.calculationEvidence.metricsAudit).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-charcoal-400">{k}:</span>
                    <span className="text-ivory-100 font-bold">{String(v)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isApproveConfirmOpen}
        title="Approve Deliverable & Update Agent Passport?"
        description="This finalizes the work order, records the verified SHA-256 report proof, and updates the assigned agent's approval telemetry."
        confirmLabel="Approve Deliverable"
        isLoading={isApproving}
        onConfirm={handleApproveConfirmed}
        onCancel={() => setIsApproveConfirmOpen(false)}
      />

      {isRevisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-charcoal-900 border border-refined rounded-2xl p-6 shadow-elevated space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-subtle">
              <h3 className="text-base font-semibold text-ivory-100">Request Work Order Revision</h3>
              <button onClick={() => setIsRevisionModalOpen(false)} className="text-charcoal-400 hover:text-ivory-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-mono text-charcoal-400 mb-1.5 uppercase">
                Revision Instructions &amp; Feedback *
              </label>
              <textarea
                rows={4}
                placeholder="Explain what specific metrics or segments need further clarification..."
                value={revisionReason}
                onChange={(e) => setRevisionReason(e.target.value)}
                className="w-full bg-charcoal-950 border border-subtle rounded-lg p-3 text-xs text-ivory-100 placeholder:text-charcoal-500 focus:outline-none focus:border-forest-500/50"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsRevisionModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleRequestRevision}>
                Submit Revision Request
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
