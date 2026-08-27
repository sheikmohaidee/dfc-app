/**
 * The multimodal step: photo / voice / text in, structured order out.
 *
 * This runs on the device against Firebase AI Logic, so there is no server in
 * the path — the SDK holds the Gemini call behind App Check rather than behind
 * an API key you would otherwise have to hide in a backend.
 *
 * The model is asked for JSON and the answer is validated by zod before
 * anything downstream sees it (packages/core/src/schema.ts). If validation
 * fails we retry once with the failure quoted back at the model, then give up
 * and hand the request to a human — which is exactly what the "Incoming AI
 * Requests" column on the admin board is for.
 */

import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';

import {
  AiParseError,
  DEFAULT_MODEL,
  GENERATION_CONFIG,
  SYSTEM_PROMPT,
  buildUserPrompt,
  parseAiJson,
  type AiExtraction,
  type InputKind,
} from '@dfc/core';

import { app } from './firebase';

const MODEL = process.env.EXPO_PUBLIC_GEMINI_MODEL ?? DEFAULT_MODEL;

function model() {
  const ai = getAI(app(), { backend: new GoogleAIBackend() });
  return getGenerativeModel(ai, {
    model: MODEL,
    systemInstruction: SYSTEM_PROMPT,
    // The response schema is deliberately *not* pinned here. Constraining the
    // model to a JSON Schema is stricter, but the SDK's schema builder differs
    // between versions; asking for application/json and validating with zod is
    // version-proof and fails just as loudly. GEMINI_RESPONSE_SCHEMA in
    // @dfc/core is there for the server-side path when you add one.
    generationConfig: {
      temperature: GENERATION_CONFIG.temperature,
      topP: GENERATION_CONFIG.topP,
      maxOutputTokens: GENERATION_CONFIG.maxOutputTokens,
      responseMimeType: GENERATION_CONFIG.responseMimeType,
    },
  });
}

export interface ExtractInput {
  kind: InputKind;
  /** base64, no data: prefix. Required for photo and voice. */
  base64?: string;
  mimeType?: string;
  /** Typed message, or a caption alongside a photo. */
  text?: string;
  localityName?: string;
}

export interface ExtractResult {
  extraction: AiExtraction;
  raw: string;
  latencyMs: number;
  model: string;
}

export async function extractOrder(input: ExtractInput): Promise<ExtractResult> {
  const started = Date.now();
  const m = model();

  const parts: unknown[] = [buildUserPrompt(input)];
  if (input.base64 && input.mimeType) {
    parts.push({ inlineData: { mimeType: input.mimeType, data: input.base64 } });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const first = await m.generateContent(parts as any);
  const raw = first.response.text();

  try {
    return {
      extraction: parseAiJson(raw),
      raw,
      latencyMs: Date.now() - started,
      model: MODEL,
    };
  } catch (err) {
    if (!(err instanceof AiParseError)) throw err;

    // One repair attempt. Quoting the validation error back is far more
    // effective than simply asking again.
    const repaired = await m.generateContent([
      'Your previous reply was not valid for this task.',
      `Error: ${err.message}`,
      'Return ONLY the corrected JSON object. No prose, no code fence.',
      `Previous reply:\n${raw.slice(0, 4000)}`,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any);

    const raw2 = repaired.response.text();
    return {
      extraction: parseAiJson(raw2),
      raw: raw2,
      latencyMs: Date.now() - started,
      model: MODEL,
    };
  }
}

/**
 * A last-resort extraction so a failed model call still produces a ticket the
 * admin can work with, rather than an error the customer has to retry.
 */
export function fallbackExtraction(text: string): AiExtraction {
  return {
    category: 'concierge',
    storeHint: null,
    items: [],
    stops: [],
    transcript: text,
    summary: 'We could not read this automatically — our team will call you.',
    needsHuman: true,
  };
}
