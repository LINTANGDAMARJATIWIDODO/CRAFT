'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/components/wallet/WalletContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { INITIAL_AGENTS } from '@/lib/constants';
import { parseCsvContent, profileDataset } from '@/lib/dataset-analyzer';
import { createTaskRecord, SAMPLE_SALES_CSV } from '@/lib/task-store';
import { DatasetProfilingResult, TaskState } from '@craft/shared';
import {
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Bot,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

export default function CreateTaskPage() {
  const router = useRouter();
  const { isConnected, address, hasAgentId } = useWallet();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [objective, setObjective] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState(INITIAL_AGENTS[0].id);

  // CSV file state
  const [csvContent, setCsvContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isProfiling, setIsProfiling] = useState(false);
  const [profilingResult, setProfilingResult] = useState<DatasetProfilingResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setErrorMessage('Please upload a valid CSV file.');
      return;
    }

    setErrorMessage(null);
    setIsProfiling(true);
    setFileName(file.name);

    try {
      const text = await file.text();
      setCsvContent(text);
      const parsed = await parseCsvContent(text);

      if (parsed.headers.length === 0 || parsed.rows.length === 0) {
        throw new Error('CSV file appears empty or unparseable.');
      }

      const profile = await profileDataset(file.name, text, parsed);
      setProfilingResult(profile);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to inspect CSV dataset.');
      setProfilingResult(null);
    } finally {
      setIsProfiling(false);
    }
  };

  const handleLoadSampleDataset = async () => {
    setErrorMessage(null);
    setIsProfiling(true);
    setFileName('enterprise_q1_sales_sample.csv');
    setTitle('Enterprise Hardware & Cloud Q1 Revenue Decomposition');
    setDescription('Decompose revenue performance across hardware vs cloud customer accounts and quantify discount impacts.');
    setObjective('Compute total revenue, average order value, identify high-volume SKUs, and evaluate discount elasticity.');

    try {
      setCsvContent(SAMPLE_SALES_CSV);
      const parsed = await parseCsvContent(SAMPLE_SALES_CSV);
      const profile = await profileDataset('enterprise_q1_sales_sample.csv', SAMPLE_SALES_CSV, parsed);
      setProfilingResult(profile);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing sample CSV.');
    } finally {
      setIsProfiling(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !objective) {
      setErrorMessage('Please complete all task requirement fields.');
      return;
    }
    if (!profilingResult) {
      setErrorMessage('Please upload or load a valid CSV dataset to analyze.');
      return;
    }

    setIsSubmitting(true);
    try {
      const clientAddr = address || '0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db';

      let createdRemote: any = null;
      try {
        const res = await fetch('http://localhost:4000/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            description,
            objective,
            clientAddress: clientAddr,
            assignedAgentId: selectedAgentId,
            datasetHash: profilingResult.sha256Hash,
            fileName,
            rowCount: profilingResult.rowCount,
          }),
        });
        if (res.ok) {
          const d = await res.json();
          createdRemote = d.task;
        }
      } catch {}

      // Create / sync task in browser store
      const newTask = createTaskRecord(
        createdRemote || {
          title,
          description,
          objective,
          status: TaskState.Created,
          clientAddress: clientAddr,
          assignedAgentId: selectedAgentId,
          datasetFileName: fileName,
          datasetRowCount: profilingResult.rowCount,
          datasetHash: profilingResult.sha256Hash,
        }
      );

      // Save raw csv in sessionStorage for AI processor
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`dataset_${newTask.id}`, csvContent);
      }

      // Redirect to the task execution workspace
      router.push(`/tasks/${newTask.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create task.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-subtle">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ivory-50">
          Create Data Analysis Task
        </h1>
        <p className="text-sm text-charcoal-400 mt-1">
          Delegate a structured data analysis assignment to an autonomous AI agent with verifiable BNB Chain anchors.
        </p>
      </div>

      {/* Identity Banner */}
      {!hasAgentId && (
        <div className="p-4 rounded-xl border border-amber-800/40 bg-amber-950/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-charcoal-300">
              Note: You can configure and test this task now. Final on-chain task approval requires Binance Agent ID verification.
            </span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl border border-rose-800/50 bg-rose-950/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Task Specifications */}
        <Card className="bg-charcoal-900 border-subtle space-y-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-ivory-100">1. Task Specifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div>
              <label className="block text-xs font-mono text-charcoal-300 mb-1.5 uppercase">
                Task Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Q3 SaaS Subscription Churn & Retention Analysis"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-charcoal-950 border border-subtle rounded-lg px-3.5 py-2 text-xs text-ivory-100 placeholder:text-charcoal-500 focus:outline-none focus:border-forest-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-charcoal-300 mb-1.5 uppercase">
                Task Description *
              </label>
              <textarea
                rows={3}
                placeholder="Describe the context and business situation..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full bg-charcoal-950 border border-subtle rounded-lg px-3.5 py-2 text-xs text-ivory-100 placeholder:text-charcoal-500 focus:outline-none focus:border-forest-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-charcoal-300 mb-1.5 uppercase">
                Analysis Objective &amp; Questions *
              </label>
              <textarea
                rows={2}
                placeholder="Specify exact calculations and strategic questions for the AI Data Analyst..."
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                required
                className="w-full bg-charcoal-950 border border-subtle rounded-lg px-3.5 py-2 text-xs text-ivory-100 placeholder:text-charcoal-500 focus:outline-none focus:border-forest-500/50"
              />
            </div>

            {/* Agent Assignment Selection */}
            <div>
              <label className="block text-xs font-mono text-charcoal-300 mb-1.5 uppercase">
                Assign to AI Agent *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {INITIAL_AGENTS.map((agent) => {
                  const isSelected = selectedAgentId === agent.id;
                  return (
                    <div
                      key={agent.id}
                      onClick={() => setSelectedAgentId(agent.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-forest-950/40 border-forest-500/60 ring-1 ring-forest-500/40'
                          : 'bg-charcoal-950 border-subtle hover:border-refined'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <img
                          src={agent.avatarUrl}
                          alt={agent.name}
                          className="w-7 h-7 rounded-lg object-cover"
                        />
                        <div>
                          <h5 className="text-xs font-semibold text-ivory-100">{agent.name}</h5>
                          <span className="text-[10px] text-charcoal-400 font-mono">
                            {agent.reputationScore}% Rep
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-charcoal-400 line-clamp-2">{agent.title}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: CSV Dataset Ingestion */}
        <Card className="bg-charcoal-900 border-subtle space-y-4">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base text-ivory-100">2. Dataset Ingestion &amp; Validation</CardTitle>
            <button
              type="button"
              onClick={handleLoadSampleDataset}
              className="text-xs font-mono text-forest-400 hover:text-forest-300 flex items-center gap-1.5 px-2.5 py-1 rounded bg-forest-950 border border-forest-700/40"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Load Sample Dataset (Quick Test)
            </button>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {/* Drag & Drop Area */}
            <div className="border-2 border-dashed border-subtle hover:border-forest-600/50 rounded-xl p-6 text-center bg-charcoal-950/50 transition-colors">
              <input
                type="file"
                accept=".csv"
                id="csv-file-input"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <label htmlFor="csv-file-input" className="cursor-pointer block">
                <UploadCloud className="w-8 h-8 text-forest-400 mx-auto mb-2" />
                <span className="text-xs font-medium text-ivory-100 block">
                  Click to select CSV dataset or drag &amp; drop
                </span>
                <span className="text-[11px] text-charcoal-400 block mt-1">
                  Supported format: CSV (max 10MB) • Never uploaded to public blockchain
                </span>
              </label>
            </div>

            {/* Profiling Inspection Preview */}
            {profilingResult && (
              <div className="p-4 rounded-xl bg-charcoal-950 border border-subtle space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-subtle">
                  <span className="flex items-center gap-1.5 text-ivory-100 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Dataset Profile: {profilingResult.fileName}
                  </span>
                  <Badge variant="success" size="sm">
                    Quality: {profilingResult.dataQualityScore}/100
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-charcoal-300">
                  <div className="p-2 bg-charcoal-900 rounded border border-subtle">
                    <span className="text-charcoal-500 block">Row Count</span>
                    <span className="font-bold text-ivory-100">{profilingResult.rowCount} rows</span>
                  </div>
                  <div className="p-2 bg-charcoal-900 rounded border border-subtle">
                    <span className="text-charcoal-500 block">Columns</span>
                    <span className="font-bold text-ivory-100">{profilingResult.columnCount} cols</span>
                  </div>
                  <div className="p-2 bg-charcoal-900 rounded border border-subtle">
                    <span className="text-charcoal-500 block">Missing Cells</span>
                    <span className="font-bold text-emerald-400">{profilingResult.missingValuesTotal}</span>
                  </div>
                  <div className="p-2 bg-charcoal-900 rounded border border-subtle">
                    <span className="text-charcoal-500 block">Duplicates</span>
                    <span className="font-bold text-ivory-100">{profilingResult.duplicateRows}</span>
                  </div>
                </div>

                <div className="pt-2 text-[11px]">
                  <span className="text-charcoal-400 block mb-1">Detected Columns &amp; Inferred Types:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profilingResult.columns.map((col) => (
                      <span
                        key={col.name}
                        className="px-2 py-0.5 rounded bg-charcoal-900 border border-subtle text-charcoal-300"
                      >
                        {col.name}: <span className="text-forest-400">{col.type}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-subtle text-[11px]">
                  <span className="text-charcoal-500 block">Cryptographic SHA-256 Digest:</span>
                  <span className="text-forest-300 break-all">{profilingResult.sha256Hash}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            disabled={!profilingResult || isSubmitting}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Deploy Work Order to Agent
          </Button>
        </div>
      </form>
    </div>
  );
}
