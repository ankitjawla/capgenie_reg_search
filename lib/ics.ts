// Generate a minimal iCalendar (RFC 5545) feed for a list of report
// recommendations. The agent doesn't know real per-bank due dates, so
// we synthesize "typical" cadence anchors from each report's frequency
// — good enough to populate a personal calendar that's then refined
// by the user.

import type { ReportRecommendation, ReportFrequency, Jurisdiction } from './types';

const PROD_ID = '-//CapGenie//Regulatory Calendar//EN';
const DAY_MS = 24 * 60 * 60 * 1000;

interface AnchorPlan {
  // For recurring cadences we emit an RRULE; for once-per-year we pick a
  // jurisdiction-typical month (mirrors lib/FilingCalendar.tsx).
  rrule?: string;
  monthDay?: { month: number; day: number };
}

function planFor(jur: Jurisdiction, freq: ReportFrequency): AnchorPlan | null {
  switch (freq) {
    case 'daily':
      return { rrule: 'FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR' };
    case 'weekly':
      return { rrule: 'FREQ=WEEKLY;BYDAY=MO' };
    case 'fortnightly':
      return { rrule: 'FREQ=WEEKLY;INTERVAL=2;BYDAY=MO' };
    case 'monthly':
      return { rrule: 'FREQ=MONTHLY;BYMONTHDAY=15' };
    case 'quarterly':
      return { rrule: 'FREQ=MONTHLY;BYMONTH=3,6,9,12;BYMONTHDAY=15' };
    case 'semi_annual':
      return { rrule: 'FREQ=MONTHLY;BYMONTH=6,12;BYMONTHDAY=15' };
    case 'annual': {
      if (jur === 'EU' || jur === 'UK') return { monthDay: { month: 2, day: 28 } };
      if (jur === 'IN') return { monthDay: { month: 6, day: 30 } };
      if (jur === 'CA') return { monthDay: { month: 4, day: 30 } };
      if (jur === 'SG') return { monthDay: { month: 3, day: 31 } };
      if (jur === 'HK') return { monthDay: { month: 4, day: 30 } };
      return { monthDay: { month: 3, day: 31 } };
    }
    case 'event_driven':
    case 'ad_hoc':
    default:
      return null;
  }
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function utcStamp(date: Date): string {
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
}

function dateOnly(year: number, month: number, day: number): string {
  return `${year}${pad(month)}${pad(day)}`;
}

function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
}

function fold(line: string): string {
  // RFC 5545 §3.1 — long lines folded at 75 octets with a leading SPACE.
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let pos = 0;
  while (pos < line.length) {
    chunks.push(line.slice(pos, pos + 75));
    pos += 75;
  }
  return chunks[0] + '\r\n' + chunks.slice(1).map((c) => ' ' + c).join('\r\n');
}

export interface IcsOptions {
  bankName: string;
  reports: ReportRecommendation[];
  startFrom?: Date; // default: today
}

export function buildIcs({ bankName, reports, startFrom = new Date() }: IcsOptions): string {
  const dtStamp = utcStamp(startFrom);
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    `PRODID:${PROD_ID}`,
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:CapGenie · ${bankName}`,
    `X-WR-CALDESC:Regulatory filings for ${bankName}`,
  ];
  for (const r of reports) {
    const plan = planFor(r.jurisdiction, r.frequency);
    if (!plan) continue;
    const uid = `${r.id}-${bankName.toLowerCase().replace(/\s+/g, '-')}@capgenie`;
    const summary = `${r.shortName} · ${r.regulator}`;
    const description = `${r.fullName}\n\nWhy it applies: ${r.applicabilityReason}${
      r.referenceUrl ? `\n\nReference: ${r.referenceUrl}` : ''
    }`;

    let firstStart: Date;
    if (plan.monthDay) {
      const y = startFrom.getUTCFullYear();
      firstStart = new Date(Date.UTC(y, plan.monthDay.month - 1, plan.monthDay.day));
      if (firstStart.getTime() < startFrom.getTime()) {
        firstStart = new Date(Date.UTC(y + 1, plan.monthDay.month - 1, plan.monthDay.day));
      }
    } else {
      // For recurring: anchor on next Monday after `startFrom`.
      firstStart = new Date(startFrom);
      while (firstStart.getUTCDay() !== 1) firstStart = new Date(firstStart.getTime() + DAY_MS);
    }
    const startDay = dateOnly(
      firstStart.getUTCFullYear(),
      firstStart.getUTCMonth() + 1,
      firstStart.getUTCDate(),
    );

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${dtStamp}`);
    lines.push(`DTSTART;VALUE=DATE:${startDay}`);
    lines.push(`DTEND;VALUE=DATE:${startDay}`);
    lines.push(fold(`SUMMARY:${escapeText(summary)}`));
    lines.push(fold(`DESCRIPTION:${escapeText(description)}`));
    if (r.referenceUrl) lines.push(fold(`URL:${r.referenceUrl}`));
    if (plan.rrule) lines.push(`RRULE:${plan.rrule}`);
    lines.push(`CATEGORIES:CapGenie,${r.jurisdiction}`);
    lines.push('TRANSP:TRANSPARENT');
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
