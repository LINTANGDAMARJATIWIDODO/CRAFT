'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SAMPLE_SALES_CSV } from '@/lib/task-store';
import { parseCsvContent, profileDataset, computeDeterministicCalculations } from '@/lib/dataset-analyzer';
import { DatasetProfilingResult, DeterministicCalculations } from '@craft/shared';
import { Database, UploadCloud, Sparkles, CheckCircle2, Cpu } from 'lucide-react';

export default function DataIntelligencePage() {
  const [fileName, setFileName] = useState('enterprise_q1_sales_sample.csv');
  const [profiling, setProfiling] = useState<DatasetProfilingResult | null>(null);
  const [calculations, setCalculations] = useState<DeterministicCalculations | null>(null);
  const [loading, setLoading] = useState(true);

  const analyzeCsv = async (name: string, raw: string) => {
    setLoading(true);
    setFileName(name);
    const parsed = await parseCsvContent(raw);
    const prof = await profileDataset(name, raw, parsed);
    const calc = await computeDeterministicCalculations(parsed, prof);
    setProfiling(prof);
    setCalculations(calc);
    setLoading(false);
  };

  useEffect(() => {
    analyzeCsv('enterprise_q1_sales_sample.csv', SAMPLE_SALES_CSV);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ivory-50">
              Data Intelligence Explorer
            </h1>
            <Badge variant="success" size="sm">
              Deterministic Engine
            </Badge>
          </div>
          <p className="text-sm text-charcoal-400 mt-1">
            Inspect raw schema hygiene, descriptive statistical distributions, IQR dispersion, and SHA-256 evidence digests before delegating to AI Agents.
          </p>
        </div>

        <label className="cursor-pointer">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-forest-600 hover:bg-forest-500 text-ivory-50 text-xs font-medium">
            <UploadCloud className="w-4 h-4" /> Profile Custom CSV
          </span>
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) analyzeCsv(f.name, await f.text());
            }}
          />
        </label>
      </div>

      {profiling && calculations && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
            <Card className="bg-charcoal-900 border-subtle p-4">
              <span className="text-charcoal-400 block">ACTIVE DATASET</span>
              <span className="text-sm font-bold text-ivory-50 mt-1 block truncate">{fileName}</span>
            </Card>
            <Card className="bg-charcoal-900 border-subtle p-4">
              <span className="text-charcoal-400 block">DIMENSIONS</span>
              <span className="text-xl font-bold text-ivory-50 mt-1 block">
                {profiling.rowCount} × {profiling.columnCount}
              </span>
            </Card>
            <Card className="bg-charcoal-900 border-subtle p-4">
              <span className="text-charcoal-400 block">QUALITY SCORE</span>
              <span className="text-xl font-bold text-emerald-400 mt-1 block">{profiling.dataQualityScore}/100</span>
            </Card>
            <Card className="bg-charcoal-900 border-subtle p-4">
              <span className="text-charcoal-400 block">MISSING / DUPLICATES</span>
              <span className="text-xl font-bold text-ivory-50 mt-1 block">
                {profiling.missingValuesTotal} / {profiling.duplicateRows}
              </span>
            </Card>
          </div>

          {/* Numeric Distributions */}
          <Card className="bg-charcoal-900 border-subtle space-y-4">
            <h3 className="text-sm font-semibold text-ivory-100 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-forest-400" />
              Numerical Distributions (Pure Code Aggregation)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-charcoal-950 border-b border-subtle text-charcoal-400 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">FEATURE</th>
                    <th className="py-2.5 px-3">SUM</th>
                    <th className="py-2.5 px-3">MEAN</th>
                    <th className="py-2.5 px-3">MEDIAN</th>
                    <th className="py-2.5 px-3">MIN — MAX</th>
                    <th className="py-2.5 px-3">STD DEV</th>
                    <th className="py-2.5 px-3">IQR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle">
                  {Object.entries(calculations.numericalDistributions).map(([col, stats]) => (
                    <tr key={col} className="hover:bg-charcoal-850/40">
                      <td className="py-2.5 px-3 font-semibold text-forest-300">{col}</td>
                      <td className="py-2.5 px-3 text-ivory-100">{stats.sum.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-ivory-200">{stats.mean}</td>
                      <td className="py-2.5 px-3 text-ivory-200">{stats.median}</td>
                      <td className="py-2.5 px-3 text-charcoal-300">
                        {stats.min} — {stats.max}
                      </td>
                      <td className="py-2.5 px-3 text-amber-300">{stats.stdDev}</td>
                      <td className="py-2.5 px-3 text-emerald-300">{stats.iqr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-3 rounded-lg bg-charcoal-950 border border-subtle font-mono text-[11px]">
              <span className="text-charcoal-400 block">Canonical Calculation Evidence Hash:</span>
              <span className="text-emerald-400 break-all">{calculations.rawHash}</span>
            </div>
          </Card>

          {/* Pearson Correlations & OLS Trend Forecast */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-charcoal-900 border-subtle p-5 space-y-4">
              <h3 className="text-sm font-semibold text-ivory-100">
                Pearson Linear Correlations
              </h3>
              {calculations.correlations && calculations.correlations.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="border-b border-subtle text-charcoal-400">
                      <tr>
                        <th className="py-2 pr-3">VARIABLE PAIR</th>
                        <th className="py-2 px-3">PEARSON R</th>
                        <th className="py-2 pl-3">STRENGTH</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-subtle">
                      {calculations.correlations.map((c, idx) => (
                        <tr key={idx}>
                          <td className="py-2 pr-3 text-ivory-100">{c.colA} × {c.colB}</td>
                          <td className="py-2 px-3 text-emerald-400 font-bold">{c.correlation}</td>
                          <td className="py-2 pl-3 text-charcoal-300">{c.strength}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-charcoal-400">Upload a dataset with 2+ numeric columns to compute correlations.</p>
              )}
            </Card>

            <Card className="bg-charcoal-900 border-subtle p-5 space-y-4">
              <h3 className="text-sm font-semibold text-ivory-100">
                Time-Series &amp; Linear Trend Forecast
              </h3>
              {calculations.forecast ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                    <div className="p-3 rounded-lg bg-charcoal-950 border border-subtle">
                      <span className="text-charcoal-400 block">NEXT PERIOD ({calculations.forecast.nextPeriodLabel})</span>
                      <span className="text-lg font-bold text-emerald-400 mt-1 block">
                        {calculations.forecast.projectedValue.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-charcoal-950 border border-subtle">
                      <span className="text-charcoal-400 block">OLS SLOPE / PERIOD</span>
                      <span className="text-lg font-bold text-bnb mt-1 block">
                        {calculations.forecast.slopePerPeriod >= 0 ? '+' : ''}
                        {calculations.forecast.slopePerPeriod}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-charcoal-400">{calculations.forecast.methodology}</p>
                </div>
              ) : (
                <p className="text-xs text-charcoal-400">Requires a chronological date column spanning 2+ periods.</p>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
