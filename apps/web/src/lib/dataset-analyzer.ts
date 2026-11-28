import Papa from 'papaparse';
import { computeSha256 } from './utils';
import {
  DatasetColumnSchema,
  DatasetProfilingResult,
  DeterministicCalculations,
  computeCorrelationsAndTimeForecast,
} from '@craft/shared';

export interface ParseResult {
  headers: string[];
  rows: Record<string, any>[];
  errors: Papa.ParseError[];
}

/**
 * Parses raw CSV string or file into structured rows with schema inference
 */
export function parseCsvContent(csvString: string): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvString, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        resolve({
          headers,
          rows: results.data as Record<string, any>[],
          errors: results.errors,
        });
      },
      error: (error: Error) => {
        reject(error);
      },
    });
  });
}

/**
 * Inspects columns, infers statistical types, checks missing values and quality score
 */
export async function profileDataset(
  fileName: string,
  rawContent: string,
  parsed: ParseResult
): Promise<DatasetProfilingResult> {
  const sha256Hash = await computeSha256(rawContent);
  const rowCount = parsed.rows.length;
  const columnCount = parsed.headers.length;
  const warnings: string[] = [];

  let totalNulls = 0;
  const columns: DatasetColumnSchema[] = [];

  for (const header of parsed.headers) {
    let nullCount = 0;
    let numericCount = 0;
    let dateCount = 0;
    let booleanCount = 0;
    let stringCount = 0;
    const distinctSet = new Set<string>();
    const sampleValues: (string | number)[] = [];

    for (let i = 0; i < rowCount; i++) {
      const val = parsed.rows[i][header];
      if (val === null || val === undefined || val === '' || (typeof val === 'number' && isNaN(val))) {
        nullCount++;
      } else {
        distinctSet.add(String(val));
        if (sampleValues.length < 5) {
          sampleValues.push(val);
        }

        if (typeof val === 'number') {
          numericCount++;
        } else if (typeof val === 'boolean') {
          booleanCount++;
        } else if (typeof val === 'string') {
          // Check if valid date format
          if (!isNaN(Date.parse(val)) && val.length > 5 && /\d/.test(val)) {
            dateCount++;
          } else {
            stringCount++;
          }
        }
      }
    }

    totalNulls += nullCount;

    // Infer dominant type
    const nonNullCount = rowCount - nullCount;
    let type: DatasetColumnSchema['type'] = 'unknown';

    if (nonNullCount > 0) {
      if (numericCount / nonNullCount > 0.7) {
        type = 'numeric';
      } else if (dateCount / nonNullCount > 0.7) {
        type = 'date';
      } else if (booleanCount / nonNullCount > 0.7) {
        type = 'boolean';
      } else {
        type = 'string';
      }
    }

    const missingPercent = rowCount > 0 ? Number(((nullCount / rowCount) * 100).toFixed(2)) : 0;

    if (nullCount > rowCount * 0.2) {
      warnings.push(`Column '${header}' has high missing rate (${missingPercent.toFixed(1)}%).`);
    }

    columns.push({
      name: header,
      type,
      sampleValues,
      nullCount,
      distinctCount: distinctSet.size,
      missingPercent,
    });
  }

  // Detect duplicate rows
  const rowSignatures = new Set<string>();
  let duplicateRows = 0;
  for (const row of parsed.rows) {
    const sig = JSON.stringify(row);
    if (rowSignatures.has(sig)) {
      duplicateRows++;
    } else {
      rowSignatures.add(sig);
    }
  }

  if (duplicateRows > 0) {
    warnings.push(`Detected ${duplicateRows} identical duplicate rows.`);
  }

  // Calculate Data Quality Score (0 to 100)
  const totalCells = Math.max(1, rowCount * columnCount);
  const missingRatio = totalNulls / totalCells;
  const duplicateRatio = duplicateRows / Math.max(1, rowCount);

  let qualityScore = Math.round(100 - (missingRatio * 60 + duplicateRatio * 40));
  qualityScore = Math.max(10, Math.min(100, qualityScore));

  return {
    fileName,
    fileSizeBytes: new Blob([rawContent]).size,
    rowCount,
    columnCount,
    sha256Hash,
    columns,
    missingValuesTotal: totalNulls,
    duplicateRows,
    dataQualityScore: qualityScore,
    warnings,
  };
}

/**
 * Deterministic calculation engine. Computes mathematical aggregations,
 * descriptive stats, standard deviation, IQR, and frequencies.
 */
export async function computeDeterministicCalculations(
  parsed: ParseResult,
  profiling: DatasetProfilingResult
): Promise<DeterministicCalculations> {
  const rowCount = parsed.rows.length;
  const numericalDistributions: DeterministicCalculations['numericalDistributions'] = {};
  const categoricalDistributions: DeterministicCalculations['categoricalDistributions'] = {};
  const summaryMetrics: Record<string, number | string> = {};

  // Numeric column processing
  const numericCols = profiling.columns.filter((c) => c.type === 'numeric');

  for (const col of numericCols) {
    const rawValues: number[] = [];
    for (let i = 0; i < rowCount; i++) {
      const v = parsed.rows[i][col.name];
      if (typeof v === 'number' && !isNaN(v)) {
        rawValues.push(v);
      }
    }

    if (rawValues.length === 0) continue;

    rawValues.sort((a, b) => a - b);
    const count = rawValues.length;
    const sum = rawValues.reduce((acc, curr) => acc + curr, 0);
    const mean = Number((sum / count).toFixed(4));
    
    // Median
    const mid = Math.floor(count / 2);
    const median = count % 2 !== 0 ? rawValues[mid] : Number(((rawValues[mid - 1] + rawValues[mid]) / 2).toFixed(4));

    const min = rawValues[0];
    const max = rawValues[count - 1];

    // Variance & StdDev
    const variance = Number((rawValues.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / count).toFixed(4));
    const stdDev = Number(Math.sqrt(variance).toFixed(4));

    // Quartiles & IQR
    const q1 = rawValues[Math.floor(count * 0.25)];
    const q3 = rawValues[Math.floor(count * 0.75)];
    const iqr = Number((q3 - q1).toFixed(4));

    numericalDistributions[col.name] = {
      count,
      sum: Number(sum.toFixed(4)),
      mean,
      median,
      min,
      max,
      variance,
      stdDev,
      iqr,
    };

    summaryMetrics[`Total ${col.name}`] = sum > 1000 ? sum.toLocaleString() : sum;
    summaryMetrics[`Avg ${col.name}`] = mean.toLocaleString();
  }

  // Categorical column frequency processing
  const categoricalCols = profiling.columns.filter((c) => c.type === 'string' || c.type === 'boolean');

  for (const col of categoricalCols) {
    const freqMap: Record<string, number> = {};
    for (let i = 0; i < rowCount; i++) {
      const v = parsed.rows[i][col.name];
      if (v !== null && v !== undefined && v !== '') {
        const key = String(v);
        freqMap[key] = (freqMap[key] || 0) + 1;
      }
    }

    const sortedFreq = Object.entries(freqMap)
      .map(([value, count]) => ({
        value,
        count,
        percentage: Number(((count / rowCount) * 100).toFixed(2)),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Top 8 values

    categoricalDistributions[col.name] = {
      topFrequencies: sortedFreq,
    };
  }

  const { correlations, timeSeriesAggregation, forecast } = computeCorrelationsAndTimeForecast(
    parsed.rows,
    profiling.columns
  );

  // Build deterministic canonical payload string and SHA-256
  const canonicalPayload = JSON.stringify({
    totalRows: rowCount,
    numerical: numericalDistributions,
    categorical: categoricalDistributions,
    correlations,
    timeSeriesAggregation,
    forecast,
  });

  const rawHash = await computeSha256(canonicalPayload);

  return {
    summary: {
      totalRows: rowCount,
      metrics: summaryMetrics,
    },
    numericalDistributions,
    categoricalDistributions,
    correlations,
    timeSeriesAggregation,
    forecast,
    rawHash,
  };
}
