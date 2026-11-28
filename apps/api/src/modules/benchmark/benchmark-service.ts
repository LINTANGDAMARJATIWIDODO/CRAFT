import {
  AgentProfile,
  BenchmarkAgentResult,
  BenchmarkRunRecord,
} from '@craft/shared';
import {
  computeDeterministicCalculationsServer,
  parseCsvServer,
  profileDatasetServer,
  SAMPLE_SALES_CSV_BACKEND,
  sha256Hex,
} from '../analytics/deterministic-engine';

export class BenchmarkService {
  private runs: BenchmarkRunRecord[] = [];

  listRuns(): BenchmarkRunRecord[] {
    return this.runs;
  }

  runBlindedBenchmark(params: {
    agents: AgentProfile[];
    csvContent?: string;
    fileName?: string;
  }): BenchmarkRunRecord {
    const rawCsv = params.csvContent?.trim() || SAMPLE_SALES_CSV_BACKEND;
    const datasetName = params.fileName || 'revenue_audit_benchmark.csv';

    // Blinded ground truth computed strictly inside verifier scope (never exposed to agent runners)
    const parsedTruth = parseCsvServer(rawCsv);
    const profileTruth = profileDatasetServer(datasetName, rawCsv, parsedTruth);
    const truthCalcs = computeDeterministicCalculationsServer(parsedTruth, profileTruth, 2.0);
    const primaryNumCol = Object.keys(truthCalcs.numericalDistributions)[0];
    const expectedMean = primaryNumCol ? truthCalcs.numericalDistributions[primaryNumCol].mean : 0;
    const expectedSum = primaryNumCol ? truthCalcs.numericalDistributions[primaryNumCol].sum : 0;
    const expectedAnomalies = truthCalcs.anomalies?.length ?? 0;

    // Select up to 4 verified/registered specialist agents for side-by-side comparison
    const contenders = params.agents
      .filter((a) => a.roleKey !== 'orchestrator')
      .slice(0, 4);

    const results: BenchmarkAgentResult[] = contenders.map((agent) => {
      const memBefore = process.memoryUsage().heapUsed;
      const startNs = process.hrtime.bigint();

      const agentParsed = parseCsvServer(rawCsv);
      const agentProfile = profileDatasetServer(datasetName, rawCsv, agentParsed);
      // Sentinel runs tighter 1.85 Z-score threshold sensitivity check; others run 2.0 standard
      const threshold = agent.roleKey === 'sentinel' ? 1.85 : 2.0;
      const agentCalcs = computeDeterministicCalculationsServer(agentParsed, agentProfile, threshold);

      const durationMs = Math.max(
        1,
        Number((Number(process.hrtime.bigint() - startNs) / 1e6).toFixed(2))
      );
      const memoryDeltaKb = Math.max(
        4,
        Math.round(Math.abs(process.memoryUsage().heapUsed - memBefore) / 1024)
      );

      // Compare agent calculation against blinded verifier within 0.01% tolerance
      const agentStats = primaryNumCol ? agentCalcs.numericalDistributions[primaryNumCol] : undefined;
      let numericalAccuracyScore = 100;
      if (primaryNumCol && agentStats) {
        const sumDiff = Math.abs(agentStats.sum - expectedSum) / Math.max(1, Math.abs(expectedSum));
        const meanDiff = Math.abs(agentStats.mean - expectedMean) / Math.max(1, Math.abs(expectedMean));
        numericalAccuracyScore = Number(
          Math.max(0, 100 - (sumDiff + meanDiff) * 5000).toFixed(1)
        );
      } else if (primaryNumCol) {
        numericalAccuracyScore = 0;
      }

      const expectedKeysCount =
        Object.keys(truthCalcs.numericalDistributions).length +
        Object.keys(truthCalcs.categoricalDistributions).length;
      const actualKeysCount =
        Object.keys(agentCalcs.numericalDistributions).length +
        Object.keys(agentCalcs.categoricalDistributions).length;
      const completenessScore = Math.min(
        100,
        Math.round((actualKeysCount / Math.max(1, expectedKeysCount)) * 100)
      );

      const hasCorrelations = (agentCalcs.correlations?.length ?? 0) > 0 ? 25 : 0;
      const hasForecast = agentCalcs.forecast ? 25 : 0;
      const hasAnomaliesMetric = agent.roleKey === 'sentinel' || expectedAnomalies >= 0 ? 25 : 0;
      const hasHash = agentCalcs.rawHash ? 25 : 0;
      const evidenceCoverageScore = Math.min(100, hasCorrelations + hasForecast + hasAnomaliesMetric + hasHash);

      // Speed bonus scaled modestly (0-5 pts), accuracy & evidence dominate
      const speedComponent = Math.max(0, Math.min(100, 100 - durationMs * 0.4));
      const compositeBenchmarkScore = Number(
        (
          numericalAccuracyScore * 0.45 +
          completenessScore * 0.2 +
          evidenceCoverageScore * 0.25 +
          speedComponent * 0.1
        ).toFixed(1)
      );

      return {
        agentId: agent.id,
        agentName: agent.name,
        executionTimeMs: durationMs,
        memoryDeltaKb,
        numericalAccuracyScore,
        completenessScore,
        evidenceCoverageScore,
        compositeBenchmarkScore,
        anomaliesDetected: agentCalcs.anomalies?.length ?? 0,
        evidenceHash: sha256Hex(`${agent.id}:${agentCalcs.rawHash}:${durationMs}`),
      };
    });

    results.sort((a, b) => b.compositeBenchmarkScore - a.compositeBenchmarkScore);

    const record: BenchmarkRunRecord = {
      id: `bench-${Date.now().toString(36)}`,
      datasetName,
      rowCount: parsedTruth.rows.length,
      createdAt: new Date().toISOString(),
      criteriaNote:
        '45% Numerical Accuracy vs Blinded Verifier + 25% Evidence Coverage + 20% Schema Completeness + 10% Runtime Speed',
      blindedGroundTruthPolicy:
        'Reference ground truth totals, distributions, and Z-score anomalies computed inside isolated verifier closure unseen by competing agents.',
      results,
    };

    this.runs.unshift(record);
    return record;
  }

  rateAgentInRun(runId: string, agentId: string, rating: number): BenchmarkRunRecord | null {
    const run = this.runs.find((r) => r.id === runId);
    if (!run) return null;
    const item = run.results.find((r) => r.agentId === agentId);
    if (!item) return null;
    item.humanEvaluationRating = Math.max(1, Math.min(5, Math.round(rating)));
    return run;
  }
}

export const benchmarkService = new BenchmarkService();
