import crypto from 'crypto';
import Papa from 'papaparse';
import {
  DatasetColumnSchema,
  DatasetProfilingResult,
  DeterministicCalculations,
} from '@craft/shared';

export interface ParsedCsvData {
  headers: string[];
  rows: Record<string, any>[];
  errors: Papa.ParseError[];
}

export const SAMPLE_SALES_CSV_BACKEND = `Transaction_ID,Date,Product_Category,Units_Sold,Unit_Price,Customer_Segment,Revenue,Discount_Applied
TXN-1001,2024-01-05,Hardware,14,120.00,Enterprise,1680.00,0.05
TXN-1002,2024-01-07,Cloud_Services,3,450.00,SMB,1350.00,0.00
TXN-1003,2024-01-10,Security_Software,25,85.50,Enterprise,2137.50,0.10
TXN-1004,2024-01-12,Hardware,8,120.00,Consumer,960.00,0.00
TXN-1005,2024-01-15,Developer_Tools,40,49.00,SMB,1960.00,0.15
TXN-1006,2024-01-18,Cloud_Services,5,450.00,Enterprise,2250.00,0.00
TXN-1007,2024-01-20,Hardware,2,120.00,Consumer,240.00,0.00
TXN-1008,2024-01-22,Security_Software,18,85.50,SMB,1539.00,0.05
TXN-1009,2024-01-25,Developer_Tools,60,49.00,Enterprise,2940.00,0.20
TXN-1010,2024-01-28,Hardware,12,120.00,Enterprise,1440.00,0.05
TXN-1011,2024-02-01,Cloud_Services,7,450.00,Enterprise,3150.00,0.00
TXN-1012,2024-02-04,Security_Software,30,85.50,SMB,2565.00,0.10
TXN-1013,2024-02-08,Developer_Tools,22,49.00,Consumer,1078.00,0.00
TXN-1014,2024-02-12,Hardware,19,120.00,Enterprise,2280.00,0.08
TXN-1015,2024-02-15,Cloud_Services,4,450.00,SMB,1800.00,0.00
TXN-1016,2024-02-18,Security_Software,11,85.50,Enterprise,940.50,0.00
TXN-1017,2024-02-22,Developer_Tools,55,49.00,Enterprise,2695.00,0.15
TXN-1018,2024-02-25,Hardware,6,120.00,Consumer,720.00,0.00
TXN-1019,2024-02-28,Cloud_Services,9,450.00,Enterprise,4050.00,0.05
TXN-1020,2024-03-02,Security_Software,45,85.50,Enterprise,3847.50,0.12`;

export function sha256Hex(payload: string): string {
  return '0x' + crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
}

export function parseCsvServer(csvContent: string): ParsedCsvData {
  const result = Papa.parse<Record<string, any>>(csvContent, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: true,
  });

  return {
    headers: result.meta.fields || [],
    rows: result.data || [],
    errors: result.errors || [],
  };
}

export function cleanCsvRows(
  parsed: ParsedCsvData,
  strategy: 'drop_nulls' | 'zero_fill' | 'flag_only' = 'flag_only'
): { cleaned: ParsedCsvData; removedRows: number; imputedCells: number } {
  if (strategy === 'flag_only') {
    return { cleaned: parsed, removedRows: 0, imputedCells: 0 };
  }

  let removedRows = 0;
  let imputedCells = 0;
  const newRows: Record<string, any>[] = [];

  for (const row of parsed.rows) {
    const hasNull = parsed.headers.some(
      (h) => row[h] === null || row[h] === undefined || row[h] === ''
    );
    if (strategy === 'drop_nulls' && hasNull) {
      removedRows++;
      continue;
    }
    if (strategy === 'zero_fill' && hasNull) {
      const cloned = { ...row };
      for (const h of parsed.headers) {
        if (cloned[h] === null || cloned[h] === undefined || cloned[h] === '') {
          cloned[h] = 0;
          imputedCells++;
        }
      }
      newRows.push(cloned);
    } else {
      newRows.push(row);
    }
  }

  return {
    cleaned: {
      headers: parsed.headers,
      rows: newRows,
      errors: parsed.errors,
    },
    removedRows,
    imputedCells,
  };
}

export function profileDatasetServer(
  fileName: string,
  rawContent: string,
  parsed: ParsedCsvData
): DatasetProfilingResult {
  const sha256Hash = sha256Hex(rawContent);
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
        } else if (typeof val === 'string' && !isNaN(Date.parse(val)) && val.length > 5 && /\d/.test(val)) {
          dateCount++;
        }
      }
    }

    totalNulls += nullCount;
    const nonNullCount = rowCount - nullCount;
    let type: DatasetColumnSchema['type'] = 'unknown';

    if (nonNullCount > 0) {
      if (numericCount / nonNullCount > 0.7) type = 'numeric';
      else if (dateCount / nonNullCount > 0.7) type = 'date';
      else if (booleanCount / nonNullCount > 0.7) type = 'boolean';
      else type = 'string';
    }

    if (rowCount > 0 && nullCount > rowCount * 0.2) {
      warnings.push(`Column '${header}' has high missing rate (${((nullCount / rowCount) * 100).toFixed(1)}%).`);
    }

    columns.push({
      name: header,
      type,
      sampleValues,
      nullCount,
      distinctCount: distinctSet.size,
    });
  }

  const rowSignatures = new Set<string>();
  let duplicateRows = 0;
  for (const row of parsed.rows) {
    const sig = JSON.stringify(row);
    if (rowSignatures.has(sig)) duplicateRows++;
    else rowSignatures.add(sig);
  }

  if (duplicateRows > 0) {
    warnings.push(`Detected ${duplicateRows} duplicate row(s).`);
  }

  const totalCells = Math.max(1, rowCount * columnCount);
  const missingRatio = totalNulls / totalCells;
  const duplicateRatio = duplicateRows / Math.max(1, rowCount);
  const dataQualityScore = Math.max(10, Math.min(100, Math.round(100 - (missingRatio * 60 + duplicateRatio * 40))));

  return {
    fileName,
    fileSizeBytes: Buffer.byteLength(rawContent, 'utf8'),
    rowCount,
    columnCount,
    sha256Hash,
    columns,
    missingValuesTotal: totalNulls,
    duplicateRows,
    dataQualityScore,
    warnings,
  };
}

export function computeDeterministicCalculationsServer(
  parsed: ParsedCsvData,
  profiling: DatasetProfilingResult,
  zScoreThreshold = 2.0
): DeterministicCalculations {
  const rowCount = parsed.rows.length;
  const numericalDistributions: DeterministicCalculations['numericalDistributions'] = {};
  const categoricalDistributions: DeterministicCalculations['categoricalDistributions'] = {};
  const summaryMetrics: Record<string, number | string> = {};
  const anomalies: NonNullable<DeterministicCalculations['anomalies']> = [];

  const numericCols = profiling.columns.filter((c) => c.type === 'numeric');

  for (const col of numericCols) {
    const indexedValues: Array<{ rowIndex: number; value: number }> = [];
    for (let i = 0; i < rowCount; i++) {
      const v = parsed.rows[i][col.name];
      if (typeof v === 'number' && !isNaN(v)) {
        indexedValues.push({ rowIndex: i + 1, value: v });
      }
    }

    if (indexedValues.length === 0) continue;

    const sorted = [...indexedValues].map((x) => x.value).sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((acc, curr) => acc + curr, 0);
    const mean = Number((sum / count).toFixed(4));
    const mid = Math.floor(count / 2);
    const median =
      count % 2 !== 0 ? sorted[mid] : Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(4));
    const min = sorted[0];
    const max = sorted[count - 1];
    const variance = Number(
      (sorted.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / count).toFixed(4)
    );
    const stdDev = Number(Math.sqrt(variance).toFixed(4));
    const q1 = sorted[Math.floor(count * 0.25)];
    const q3 = sorted[Math.floor(count * 0.75)];
    const iqr = Number((q3 - q1).toFixed(4));

    let outliersCount = 0;
    if (stdDev > 0) {
      for (const item of indexedValues) {
        const zScore = Number(((item.value - mean) / stdDev).toFixed(2));
        if (Math.abs(zScore) >= zScoreThreshold) {
          outliersCount++;
          anomalies.push({
            rowIndex: item.rowIndex,
            column: col.name,
            value: item.value,
            zScore,
            reason: `Z-score ${zScore} exceeds threshold ±${zScoreThreshold} (mean ${mean.toFixed(2)}, stdDev ${stdDev.toFixed(2)})`,
          });
        }
      }
    }

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
      outliersCount,
    };

    summaryMetrics[`Total ${col.name}`] = sum > 1000 ? sum.toLocaleString('en-US', { maximumFractionDigits: 2 }) : Number(sum.toFixed(2));
    summaryMetrics[`Avg ${col.name}`] = Number(mean.toFixed(2));
  }

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
        percentage: Number(((count / Math.max(1, rowCount)) * 100).toFixed(2)),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    categoricalDistributions[col.name] = {
      topFrequencies: sortedFreq,
    };
  }

  const canonicalPayload = JSON.stringify({
    totalRows: rowCount,
    numerical: numericalDistributions,
    categorical: categoricalDistributions,
    anomaliesCount: anomalies.length,
  });

  const rawHash = sha256Hex(canonicalPayload);

  return {
    summary: {
      totalRows: rowCount,
      metrics: summaryMetrics,
    },
    numericalDistributions,
    categoricalDistributions,
    anomalies: anomalies.slice(0, 20),
    rawHash,
  };
}
