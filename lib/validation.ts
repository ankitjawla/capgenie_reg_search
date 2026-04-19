// Zod schemas for every HTTP route's request body. Size caps are enforced
// here so DoS vectors (huge bankName, unbounded chat history) can't reach
// the LLM.

import { z } from 'zod';

export const analyzeRequestSchema = z.object({
  bankName: z
    .string()
    .trim()
    .min(1, 'bankName is required')
    .max(120, 'bankName must be ≤ 120 characters'),
});

export const MAX_CHAT_HISTORY_TURNS = 10;
export const MAX_CHAT_HISTORY_BYTES = 8 * 1024;
export const MAX_CHAT_QUESTION_LEN = 1000;

const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(8000),
});

export const chatRequestSchema = z
  .object({
    profile: z.unknown(), // shape validated by the rules engine, not here
    reports: z.array(z.unknown()),
    history: z.array(chatMessageSchema).max(MAX_CHAT_HISTORY_TURNS),
    question: z
      .string()
      .trim()
      .min(1, 'question is required')
      .max(MAX_CHAT_QUESTION_LEN, `question must be ≤ ${MAX_CHAT_QUESTION_LEN} chars`),
  })
  .superRefine((val, ctx) => {
    const bytes = Buffer.byteLength(JSON.stringify(val.history ?? []), 'utf8');
    if (bytes > MAX_CHAT_HISTORY_BYTES) {
      ctx.addIssue({
        code: 'custom',
        message: `chat history exceeds ${MAX_CHAT_HISTORY_BYTES} bytes (got ${bytes})`,
      });
    }
  });

export const MAX_SHARE_FRAGMENT_BYTES = 4 * 1024;

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
