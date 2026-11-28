'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContext';
import { fetchBenchmarks, rateBenchmarkAgent, runBlindedBenchmark } from '@/lib/craft-client';
import { SAMPLE_SALES_CSV } from '@/lib/task-store';
import { BenchmarkRunRecord } from '@craft/shared';
import { Gauge, Play, UploadCloud, Star, ShieldCheck, Loader2, Cpu } from 'lucide-react';

export default function BenchmarkArenaPage() {
  const { notify } = useToast();
  const [runs, setRuns] = useState<BenchmarkRunRecord[]>([]);
  const [selectedCsv, setSelectedCsv] = useState<string>(SAMPLE_SALES_CSV);
  const [selectedFileName, setSelectedFileName] = useState<string>('enterprise_q1_sales_sample.csv');
  const [isRunning, setIsRunning] = useState(false);

  const loadRuns = async () => {
    const res = await fetchBenchmarks();
    setRuns(res.runs);
  };

  useEffect(() => {
    loadRuns();
  }, []);

  const handleRunBenchmark = async () => {
    setIsRunning(true);
    const res = await runBlindedBenchmark({
      csvContent: selectedCsv,
      fileName: selectedFileName,
    });
    setIsRunning(false);
    if (res.error || !res.run) {
      notify({
        title: 'Benchmark Failed',
        description: res.error || 'Ensure CRAFT API server is running on port 4000.',
        variant: 'error',
      });
      return;
    }
    setRuns((prev) => [res.run!, ...prev]);
    notify({
      title: 'Blinded Evaluation Complete',
      description: `Evaluated ${res.run.results.length} agents side-by-side on ${res.run.datasetName}.`,
      variant: 'success',
    });
  };

  const handleRate = async (runId: string, agentId: string, rating: number) => {
    const res = await rateBenchmarkAgent(runId, agentId, rating);
    if (res.run) {
      setRuns((prev) => prev.map((r) => (r.id === runId ? res.run : r)));
      notify({ title: 'Human Evaluation Recorded', description: `Assigned ${rating}/5 rating.`, variant: 'success' });
    }
  };

  const activeRun = runs[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-subtle">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ivory-50">
              One-Click Benchmark Arena
            </h1>
            <Badge variant="success" size="sm">Blinded Ground-Truth Verifier</Badge>
          </div>
          <p className="text-sm text-charcoal-400 mt-1 max-w-3xl">
            Execute multiple AI agents side-by-side on identical CSV data. An isolated server verifier evaluates exact mathematical precision, completeness, evidence coverage, latency, and heap memory usage.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="cursor-pointer">
            <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-charcoal-900 border border-subtle hover:border-forest-500 text-xs font-medium text-ivory-100">
              <UploadCloud className="w-4 h-4 text-forest-400" /> {selectedFileName}
            </span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setSelectedFileName(f.name);
                  setSelectedCsv(await f.text());
                }
              }}
            />
          </label>
          <Button
            variant="primary"
            size="sm"
            onClick={handleRunBenchmark}
            disabled={isRunning}
            leftIcon={isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          >
            {isRunning ? 'Evaluating...' : 'Run Benchmark Comparison'}
          </Button>
        </div>
      </div>

      {!activeRun ? (
        <Card className="bg-charcoal-900 border-subtle p-10 text-center space-y-4">
          <Gauge className="w-10 h-10 text-forest-400 mx-auto" />
          <h2 className="text-lg font-semibold text-ivory-50">Ready to Benchmark CRAFT Specialist Agents</h2>
          <p className="text-xs text-charcoal-400 max-w-lg mx-auto">
            Click <strong>Run Benchmark Comparison</strong> to run an unexposed ground-truth verification across DataCraft Quant AI, SentinelProfiler AI, and MetricsMind E-Comm.
          </p>
          <Button variant="primary" size="md" onClick={handleRunBenchmark} leftIcon={<Cpu className="w-4 h-4" />}>
            Run First Benchmark Now
          </Button>
        </Card>
      ) : (
        <Card className="bg-charcoal-900 border-subtle p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-subtle">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-forest-400">{activeRun.id}</span>
                <span className="text-sm font-semibold text-ivory-50">{activeRun.datasetName}</span>
                <Badge variant="outline" size="sm">{activeRun.rowCount} rows</Badge>
              </div>
              <p className="text-xs text-charcoal-400 mt-1">{activeRun.blindedGroundTruthPolicy}</p>
            </div>
            <div className="text-[11px] font-mono text-charcoal-400">{activeRun.criteriaNote}</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-subtle text-charcoal-400 font-mono">
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Agent</th>
                  <th className="py-2.5 px-3">Accuracy</th>
                  <th className="py-2.5 px-3">Completeness</th>
                  <th className="py-2.5 px-3">Evidence</th>
                  <th className="py-2.5 px-3">Latency</th>
                  <th className="py-2.5 px-3">Memory</th>
                  <th className="py-2.5 px-3">Score</th>
                  <th className="py-2.5 px-3">Human Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {activeRun.results.map((r, i) => (
                  <tr key={r.agentId} className="hover:bg-charcoal-950/60">
                    <td className="py-3 px-3 font-mono font-bold text-forest-400">#{i + 1}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-ivory-100">{r.agentName}</div>
                      <div className="text-[10px] font-mono text-charcoal-500 flex items-center gap-1 mt-0.5">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        {r.evidenceHash.slice(0, 14)}... ({r.anomaliesDetected} outliers)
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-emerald-400 font-bold">{r.numericalAccuracyScore}%</td>
                    <td className="py-3 px-3 font-mono text-ivory-100">{r.completenessScore}%</td>
                    <td className="py-3 px-3 font-mono text-ivory-100">{r.evidenceCoverageScore}%</td>
                    <td className="py-3 px-3 font-mono text-charcoal-300">{r.executionTimeMs} ms</td>
                    <td className="py-3 px-3 font-mono text-charcoal-300">{r.memoryDeltaKb} KB</td>
                    <td className="py-3 px-3 font-mono font-bold text-bnb">{r.compositeBenchmarkScore}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleRate(activeRun.id, r.agentId, star)}
                            className="p-0.5 hover:scale-110 transition-transform"
                            title={`Rate ${star} stars`}
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                (r.humanEvaluationRating || 0) >= star
                                  ? 'text-bnb fill-bnb'
                                  : 'text-charcoal-600'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
