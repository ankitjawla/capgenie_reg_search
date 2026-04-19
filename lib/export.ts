import type { ReportRecommendation } from './types';

const CSV_COLUMNS: { header: string; value: (r: ReportRecommendation) => string }[] = [
  { header: 'Jurisdiction', value: (r) => r.jurisdiction },
  { header: 'Regulator', value: (r) => r.regulator },
  { header: 'Short name', value: (r) => r.shortName },
  { header: 'Full name', value: (r) => r.fullName },
  { header: 'Frequency', value: (r) => r.frequency },
  { header: 'Confidence', value: (r) => r.confidence },
  { header: 'Applicability', value: (r) => r.applicabilityReason },
  { header: 'Description', value: (r) => r.description },
  { header: 'Reference URL', value: (r) => r.referenceUrl ?? '' },
];

function escape(cell: string): string {
  if (cell === '') return '';
  if (/[",\r\n]/.test(cell)) return `"${cell.replace(/"/g, '""')}"`;
  return cell;
}

export function reportsToCsv(reports: ReportRecommendation[]): string {
  const header = CSV_COLUMNS.map((c) => c.header).join(',');
  const rows = reports.map((r) => CSV_COLUMNS.map((c) => escape(c.value(r))).join(','));
  return [header, ...rows].join('\r\n');
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function csvFilename(bankName: string): string {
  const slug = bankName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const date = new Date().toISOString().slice(0, 10);
  return `capgenie-${slug || 'report'}-${date}.csv`;
}
