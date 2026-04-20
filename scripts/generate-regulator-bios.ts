// Build-time regulator bio refresher.
//
// For each regulator in lib/regulators.ts, ask Azure OpenAI for an updated
// 2-3 sentence bio covering what the regulator supervises, its most-important
// reports, and its scope. Writes to lib/regulators-bios.json, which the
// runtime merges over the hardcoded bios.
//
// Runs during `npm run build:bios`. Silent no-op if Azure env vars are
// missing (so CI without secrets still succeeds).
//
// Usage:
//   npm run build:bios                  # refresh all
//   npm run build:bios -- --slug=ffiec  # refresh one

import { AzureChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import fs from 'node:fs/promises';
import path from 'node:path';
import { REGULATORS } from '../lib/regulators';

const OUT_PATH = path.resolve(__dirname, '../lib/regulators-bios.json');

async function main() {
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? '2024-10-21';
  if (!apiKey || !endpoint || !deployment) {
    console.warn('[generate-regulator-bios] Azure OpenAI not configured — skipping.');
    return;
  }

  const onlySlug = process.argv.find((a) => a.startsWith('--slug='))?.slice('--slug='.length);
  const targets = onlySlug
    ? REGULATORS.filter((r) => r.slug === onlySlug)
    : REGULATORS;

  const existing: Record<string, string> = await fs
    .readFile(OUT_PATH, 'utf8')
    .then((txt) => JSON.parse(txt))
    .catch(() => ({}));

  const llm = new AzureChatOpenAI({
    azureOpenAIApiKey: apiKey,
    azureOpenAIEndpoint: endpoint,
    azureOpenAIApiDeploymentName: deployment,
    azureOpenAIApiVersion: apiVersion,
    model: deployment,
    maxCompletionTokens: 300,
  });

  for (const r of targets) {
    console.log(`[${r.slug}] generating…`);
    try {
      const resp = await llm.invoke([
        new SystemMessage(
          'You are writing concise bios for a financial-regulator browser. 2-3 sentences, factual, neutral tone. Mention (a) what the regulator supervises, (b) its most-important reports or frameworks, (c) its jurisdiction scope. Do not editorialize. Do not use bullet points.',
        ),
        new HumanMessage(
          `Write the bio for "${r.name}" — jurisdiction: ${r.jurisdictions.join(', ')}. Website: ${r.website}. Current bio (may be stale): "${r.shortBio}".`,
        ),
      ]);
      const text = String(resp.content ?? '').trim();
      if (text.length > 50) {
        existing[r.slug] = text;
        console.log(`[${r.slug}] ok (${text.length} chars)`);
      } else {
        console.warn(`[${r.slug}] too-short reply, keeping old bio`);
      }
    } catch (e) {
      console.warn(`[${r.slug}] failed:`, (e as Error).message);
    }
  }

  await fs.writeFile(OUT_PATH, JSON.stringify(existing, null, 2));
  console.log(`Wrote ${Object.keys(existing).length} bios to ${OUT_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
