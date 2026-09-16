/**
 * The multimodal step: photo / voice / text in, structured order out.
 *
 * Supports seamless Demo Mode via local deterministic mock AI extractor,
 * while preserving future Firebase AI Logic / Gemini live integration.
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
import { DEMO_MODE } from '@/demo/config';
import { mockAiRepository } from '@/demo/repositories/ai.repository';

const MODEL = process.env.EXPO_PUBLIC_GEMINI_MODEL ?? DEFAULT_MODEL;

function model() {
  const ai = getAI(app(), { backend: new GoogleAIBackend() });
  return getGenerativeModel(ai, {
    model: MODEL,
    systemInstruction: SYSTEM_PROMPT,
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
  if (DEMO_MODE) {
    const res = mockAiRepository.extractOrderFromInput({
      kind: input.kind === 'photo' ? 'photo' : input.kind === 'voice' ? 'voice' : 'text',
      text: input.text,
      localityName: input.localityName,
    });
    // Realistic short delay
    await new Promise((r) => setTimeout(r, res.latencyMs));
    return {
      extraction: res.extraction,
      raw: JSON.stringify(res.extraction),
      latencyMs: res.latencyMs,
      model: res.model,
    };
  }

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
