// PDF compliance-memo export.
//
// Given an AnalysisResult JSON body, generates a multi-page PDF you can
// hand to a compliance team. No external service — pure pdf-lib on the
// Node runtime.

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { AnalysisResult, BankProfile, ReportRecommendation } from '@/lib/types';
import { logJson, newRequestId } from '@/lib/errors';
import { isOriginAllowed } from '@/lib/origin-check';
import { getClientKey, rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const maxDuration = 30;

const BRAND_NAVY = rgb(0 / 255, 31 / 255, 54 / 255); // #001F36
const BRAND_BLUE = rgb(18 / 255, 171 / 255, 219 / 255); // #12ABDB
const INK = rgb(0.08, 0.1, 0.18);
const MUTED = rgb(0.4, 0.45, 0.55);

interface MemoBody {
  result: AnalysisResult;
}

export async function POST(req: Request) {
  const requestId = newRequestId();
  if (!isOriginAllowed(req)) {
    return Response.json({ error: 'Origin not allowed.', requestId }, { status: 403 });
  }
  const clientKey = getClientKey(req);
  const limit = rateLimit(`pdf:${clientKey}`, { capacity: 10, refillPerSec: 10 / 60 });
  if (!limit.allowed) {
    return Response.json(
      { error: 'Rate limit exceeded.', requestId },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } },
    );
  }

  let body: MemoBody;
  try {
    body = (await req.json()) as MemoBody;
  } catch {
    return Response.json({ error: 'Invalid JSON body.', requestId }, { status: 400 });
  }
  const { result } = body;
  if (!result?.profile || !Array.isArray(result?.reports)) {
    return Response.json({ error: 'profile + reports required.', requestId }, { status: 400 });
  }

  try {
    const pdf = await renderMemo(result.profile, result.reports, result.generatedAtIso);
    const bytes = await pdf.save();
    logJson({
      level: 'info',
      requestId,
      route: '/api/export/pdf',
      msg: 'pdf.served',
      bank: result.profile.legalName,
      reports: result.reports.length,
      bytes: bytes.length,
    });
    const filename = slugify(result.profile.legalName) + '-capgenie-memo.pdf';
    return new Response(new Blob([new Uint8Array(bytes)]), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Request-Id': requestId,
      },
    });
  } catch (err) {
    logJson({
      level: 'error',
      requestId,
      route: '/api/export/pdf',
      msg: 'pdf.error',
      err: (err as Error).message,
    });
    return Response.json(
      { error: (err as Error).message, requestId },
      { status: 500 },
    );
  }
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'analysis'
  );
}

async function renderMemo(
  profile: BankProfile,
  reports: ReportRecommendation[],
  generatedAtIso: string,
): Promise<PDFDocument> {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const PAGE_W = 612; // 8.5"
  const PAGE_H = 792; // 11"
  const MARGIN_X = 56;
  const TOP = PAGE_H - 56;
  const BOTTOM = 72;

  type Cursor = { page: import('pdf-lib').PDFPage; y: number };
  const ctx: Cursor = { page: pdf.addPage([PAGE_W, PAGE_H]), y: TOP };

  function newPage() {
    ctx.page = pdf.addPage([PAGE_W, PAGE_H]);
    ctx.y = TOP;
    drawHeader();
  }

  function ensure(space: number) {
    if (ctx.y - space < BOTTOM) newPage();
  }

  function drawHeader() {
    ctx.page.drawRectangle({
      x: 0,
      y: PAGE_H - 28,
      width: PAGE_W,
      height: 28,
      color: BRAND_NAVY,
    });
    ctx.page.drawText('CapGenie', {
      x: MARGIN_X,
      y: PAGE_H - 19,
      size: 11,
      font: bold,
      color: rgb(1, 1, 1),
    });
    ctx.page.drawText('Regulatory Report Advisor', {
      x: MARGIN_X + 60,
      y: PAGE_H - 19,
      size: 9,
      font: regular,
      color: rgb(0.8, 0.85, 0.9),
    });
    ctx.page.drawText(new Date(generatedAtIso).toLocaleString(), {
      x: PAGE_W - MARGIN_X - 140,
      y: PAGE_H - 19,
      size: 8,
      font: regular,
      color: rgb(0.8, 0.85, 0.9),
    });
  }

  function drawTitle(text: string, size = 24) {
    ensure(size + 12);
    ctx.page.drawText(text, {
      x: MARGIN_X,
      y: ctx.y - size,
      size,
      font: bold,
      color: INK,
    });
    ctx.y -= size + 8;
  }

  function drawSubtitle(text: string, size = 14) {
    ensure(size + 16);
    ctx.y -= 8;
    ctx.page.drawRectangle({
      x: MARGIN_X,
      y: ctx.y - 2,
      width: 24,
      height: 2,
      color: BRAND_BLUE,
    });
    ctx.y -= 8;
    ctx.page.drawText(text, {
      x: MARGIN_X,
      y: ctx.y - size,
      size,
      font: bold,
      color: INK,
    });
    ctx.y -= size + 6;
  }

  function drawParagraph(text: string, size = 10) {
    const maxWidth = PAGE_W - 2 * MARGIN_X;
    const lines = wrapText(text, regular, size, maxWidth);
    for (const line of lines) {
      ensure(size + 4);
      ctx.page.drawText(line, {
        x: MARGIN_X,
        y: ctx.y - size,
        size,
        font: regular,
        color: INK,
      });
      ctx.y -= size + 4;
    }
  }

  function drawKv(label: string, value: string) {
    const size = 10;
    ensure(size + 6);
    ctx.page.drawText(label, {
      x: MARGIN_X,
      y: ctx.y - size,
      size,
      font: bold,
      color: MUTED,
    });
    ctx.page.drawText(value, {
      x: MARGIN_X + 130,
      y: ctx.y - size,
      size,
      font: regular,
      color: INK,
    });
    ctx.y -= size + 4;
  }

  // === COVER ===
  drawHeader();
  ctx.y -= 30;
  ctx.page.drawRectangle({
    x: MARGIN_X,
    y: ctx.y - 6,
    width: 56,
    height: 6,
    color: BRAND_BLUE,
  });
  ctx.y -= 24;
  drawTitle('Regulatory report memo', 28);
  drawParagraph(profile.legalName, 18);
  ctx.y -= 4;

  drawSubtitle('Bank profile');
  drawKv('HQ country', profile.hqCountry ?? 'unknown');
  drawKv('Category', humanize(profile.category));
  if (profile.entityType) drawKv('Entity type', humanize(profile.entityType));
  drawKv(
    'Global assets (USD B)',
    profile.globalAssetsUsdB ? `${profile.globalAssetsUsdB}` : 'unknown',
  );
  drawKv('Asset size tier', profile.assetSizeTier);
  drawKv('G-SIB', String(profile.isGSIB ?? 'unknown'));
  drawKv('D-SIB', String(profile.isDSIB ?? 'unknown'));
  drawKv('FDIC insured', String(profile.isFDICInsured ?? 'unknown'));
  drawKv('Publicly listed', String(profile.isPubliclyListed ?? 'unknown'));

  drawSubtitle('Regulated presence');
  for (const p of profile.presence) {
    drawKv(
      p.jurisdiction,
      `${humanize(p.entityType)}${p.isFBO ? ' (FBO)' : ''}${
        p.jurisdictionAssetsUsdB ? ` · ~$${p.jurisdictionAssetsUsdB}B` : ''
      }`,
    );
  }

  if (profile.rationale) {
    drawSubtitle('Research rationale');
    drawParagraph(profile.rationale);
  }

  if (profile.sources && profile.sources.length > 0) {
    drawSubtitle('Sources cited');
    for (const s of profile.sources.slice(0, 8)) {
      drawParagraph(`• ${s.title ?? s.url} — ${s.url}`, 9);
    }
  }

  // === REPORTS ===
  newPage();
  drawTitle(`Applicable reports · ${reports.length}`, 22);
  drawParagraph(
    'Each row below was produced by the deterministic rules engine over the verified profile.',
    10,
  );

  const byJur = reports.reduce<Record<string, ReportRecommendation[]>>((acc, r) => {
    (acc[r.jurisdiction] ||= []).push(r);
    return acc;
  }, {});
  for (const jur of Object.keys(byJur).sort()) {
    drawSubtitle(`${jur} · ${byJur[jur].length}`);
    for (const r of byJur[jur]) {
      ensure(48);
      ctx.page.drawText(`${r.shortName}`, {
        x: MARGIN_X,
        y: ctx.y - 11,
        size: 11,
        font: bold,
        color: INK,
      });
      ctx.page.drawText(
        `· ${humanize(r.frequency)} · ${r.regulator}`.slice(0, 80),
        {
          x: MARGIN_X + 90,
          y: ctx.y - 11,
          size: 9,
          font: regular,
          color: MUTED,
        },
      );
      ctx.y -= 16;
      drawParagraph(r.fullName, 9);
      drawParagraph(`Why: ${r.applicabilityReason}`, 9);
      if (r.citation?.sourceUrl) {
        drawParagraph(
          `Cited: ${r.citation.regulationSection ? r.citation.regulationSection + ' — ' : ''}${
            r.citation.sourceTitle ?? r.citation.sourceUrl
          }`,
          8,
        );
      }
      ctx.y -= 4;
    }
  }

  // === DISCLAIMER ===
  ensure(80);
  ctx.y -= 12;
  ctx.page.drawRectangle({
    x: MARGIN_X,
    y: ctx.y - 56,
    width: PAGE_W - 2 * MARGIN_X,
    height: 56,
    color: rgb(0.98, 0.97, 0.94),
    borderColor: rgb(0.9, 0.84, 0.6),
    borderWidth: 1,
  });
  ctx.page.drawText('Advisory only', {
    x: MARGIN_X + 12,
    y: ctx.y - 18,
    size: 11,
    font: bold,
    color: rgb(0.5, 0.35, 0.07),
  });
  const disclaimer = wrapText(
    'CapGenie outputs are generated by AI over a curated rules engine. Verify every recommendation with your compliance team before filing anything. Sources cited are starting points, not certifications.',
    regular,
    9,
    PAGE_W - 2 * MARGIN_X - 24,
  );
  let y = ctx.y - 30;
  for (const line of disclaimer) {
    ctx.page.drawText(line, {
      x: MARGIN_X + 12,
      y,
      size: 9,
      font: regular,
      color: rgb(0.4, 0.3, 0.1),
    });
    y -= 12;
  }

  return pdf;
}

function humanize(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function wrapText(
  text: string,
  font: import('pdf-lib').PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const candidate = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}
