// Everything that differs between Gemini model generations lives here, so swapping models
// (or pointing at an alias like gemini-flash-lite-latest) is an env change, not a code change.
// Unknown and future models get the current-generation request shape.

export type GeminiThinkingLevel = 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH'

export const GEMINI_THINKING_LEVELS: readonly GeminiThinkingLevel[] = [
  'MINIMAL',
  'LOW',
  'MEDIUM',
  'HIGH',
]

export interface GeminiThinkingConfig {
  thinkingLevel?: string
  thinkingBudget?: number
}

export function normalizeGeminiModelName(model: string): string {
  return model.replace(/^models\//, '').trim()
}

export function isGemini25Model(model: string): boolean {
  return /^gemini-2\.5(?:[.-]|$)/.test(model)
}

function getGemini25ThinkingBudget(model: string, level: GeminiThinkingLevel): number {
  const budgets: Record<GeminiThinkingLevel, number> = model.includes('flash-lite')
    ? { MINIMAL: 0, LOW: 512, MEDIUM: 4096, HIGH: 24576 }
    : { MINIMAL: 0, LOW: 1024, MEDIUM: 8192, HIGH: 24576 }

  return budgets[level]
}

export function getGeminiThinkingConfig(
  model: string,
  level: GeminiThinkingLevel
): GeminiThinkingConfig {
  // 2.5 models take token budgets; Gemini 3+ takes named levels.
  if (isGemini25Model(model)) {
    return { thinkingBudget: getGemini25ThinkingBudget(model, level) }
  }

  return { thinkingLevel: level.toLowerCase() }
}

export function buildGeminiGenerateContentBody(options: {
  model: string
  systemPrompt: string
  userText: string
  thinkingLevel: GeminiThinkingLevel
  grounded: boolean
  // Set after a model rejects the thinking config, so newer models that drop or rename
  // a level still answer instead of failing every request.
  omitThinkingConfig?: boolean
}): Record<string, unknown> {
  const { model, systemPrompt, userText, thinkingLevel, grounded, omitThinkingConfig } = options

  return {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userText }] }],
    ...(grounded ? { tools: [{ googleSearch: {} }] } : {}),
    generationConfig: {
      // Gemini 3.6+ ignores sampling params and upcoming models reject them.
      ...(isGemini25Model(model) ? { temperature: 0.1 } : {}),
      // No JSON mode with search: gemini-3.5-flash-lite stalls ~30s and returns no
      // candidates when googleSearch and responseMimeType are combined. The prompt asks
      // for JSON and normalizeObjectionResponse tolerates plain text.
      ...(grounded ? {} : { responseMimeType: 'application/json' }),
      ...(omitThinkingConfig
        ? {}
        : { thinkingConfig: getGeminiThinkingConfig(model, thinkingLevel) }),
    },
  }
}

// e.g. 400 "Thinking level MINIMAL is not supported for this model."
export function isThinkingConfigRejection(status: number, message: string | null): boolean {
  return status === 400 && /thinking/i.test(message ?? '')
}
