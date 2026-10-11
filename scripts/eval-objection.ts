import fs from 'node:fs/promises'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { loadEnvConfig } from '@next/env'
import {
  buildGeminiGenerateContentBody,
  GEMINI_THINKING_LEVELS,
  normalizeGeminiModelName,
  type GeminiThinkingLevel,
} from '../lib/gemini-models'
import { OBJECTION_EVAL_CASES, type ObjectionEvalCase } from './objection-eval-cases'

// Usage:
//   npm run eval:objection
//   npm run eval:objection -- --models gemini-3.1-flash-lite,gemini-3.5-flash-lite \
//     --levels minimal,high --grounding on --runs 5 --bucket post-cutoff
//   npm run eval:objection -- --canary
//
// Builds requests with the same helper as app/api/objection/route.ts but makes one attempt
// per call, so unparseable or empty responses count against a config instead of being hidden
// by the route's retries and fallback model.
//
// --canary tests the production config from env (GEMINI_MODEL, GEMINI_FALLBACK_MODEL,
// GEMINI_OBJECTION_THINKING_LEVEL, GEMINI_OBJECTION_ENABLE_SEARCH_GROUNDING) on a few stable
// cases and exits 1 on any invalid response, error, or wrong verdict. Run it before changing
// models, or when gemini-flash-lite-latest moves to a new model.

const projectRoot = process.cwd()
const reportDir = path.join(projectRoot, 'scripts', 'generated')
const MAX_RATE_LIMIT_RETRIES = 4

type Verdict = 'sustained' | 'overruled'
type Outcome = Verdict | 'invalid' | 'error'

interface EvalConfig {
  model: string
  level: GeminiThinkingLevel
  grounded: boolean
}

interface EvalCall {
  caseId: string
  bucket: ObjectionEvalCase['bucket']
  expected: Verdict
  config: string
  run: number
  outcome: Outcome
  correct: boolean
  confidence: string | null
  explanation: string | null
  latencyMs: number
  thoughtTokens: number | null
  searchQueries: string[]
  // Sources the answer cited; set even when webSearchQueries comes back empty.
  groundingSources: number
  finishReason: string | null
  modelVersion: string | null
  error: string | null
}

function configKey(config: EvalConfig) {
  return `${config.model} ${config.level.toLowerCase()}${config.grounded ? ' +search' : ''}`
}

function splitList(value: string | undefined, fallback: string[]): string[] {
  if (!value) {
    return fallback
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) {
    return 0
  }

  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))]
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }
  return copy
}

async function runPool<T>(tasks: Array<() => Promise<T>>, concurrency: number): Promise<T[]> {
  const results: T[] = new Array(tasks.length)
  let next = 0

  async function worker() {
    while (next < tasks.length) {
      const index = next
      next += 1
      results[index] = await tasks[index]()
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, worker))
  return results
}

async function main() {
  loadEnvConfig(projectRoot)

  const { values } = parseArgs({
    options: {
      models: { type: 'string' },
      levels: { type: 'string' },
      grounding: { type: 'string' },
      runs: { type: 'string' },
      bucket: { type: 'string' },
      case: { type: 'string' },
      concurrency: { type: 'string' },
      timeout: { type: 'string' },
      canary: { type: 'boolean' },
    },
  })
  const canary = values.canary ?? false

  const geminiKey = process.env.GEMINI_KEY
  if (!geminiKey) {
    throw new Error('GEMINI_KEY is not set (expected in .env.local).')
  }

  const {
    buildObjectionDataset,
    extractGeminiText,
    getObjectionSystemPrompt,
    normalizeObjectionResponse,
  } = await import('../lib/objection')

  // Canary defaults mirror the route's defaults so an unset env var tests what prod runs.
  const models = (
    canary
      ? [
          process.env.GEMINI_MODEL ?? 'gemini-3.1-flash-lite',
          process.env.GEMINI_FALLBACK_MODEL ?? 'gemini-flash-lite-latest',
        ]
      : splitList(values.models, ['gemini-3.1-flash-lite'])
  )
    .map(normalizeGeminiModelName)
    .filter((model, index, all) => model.length > 0 && all.indexOf(model) === index)

  const levels = (
    canary
      ? [process.env.GEMINI_OBJECTION_THINKING_LEVEL ?? 'HIGH']
      : splitList(values.levels, [...GEMINI_THINKING_LEVELS])
  ).map((level) => {
    const normalized = GEMINI_THINKING_LEVELS.find((entry) => entry === level.trim().toUpperCase())
    if (!normalized) {
      throw new Error(
        `Unknown thinking level "${level}". Use ${GEMINI_THINKING_LEVELS.join(', ')}.`
      )
    }
    return normalized
  })

  const grounding = canary
    ? [/^(1|true)$/i.test(process.env.GEMINI_OBJECTION_ENABLE_SEARCH_GROUNDING?.trim() ?? '')]
    : splitList(values.grounding, ['off', 'on']).map((value) => value === 'on')
  const runs = canary ? 1 : Number.parseInt(values.runs ?? '3', 10)
  const concurrency = Number.parseInt(values.concurrency ?? '4', 10)
  const timeoutMs = Number.parseInt(values.timeout ?? '30000', 10)
  const bucketFilter = values.bucket ? splitList(values.bucket, []) : null
  const caseFilter = values.case ? splitList(values.case, []) : null

  const cases = OBJECTION_EVAL_CASES.filter((entry) =>
    canary
      ? // Post-cutoff cases need search, so only check them when prod has it on.
        entry.canary && (entry.bucket !== 'post-cutoff' || grounding[0])
      : (!bucketFilter || bucketFilter.includes(entry.bucket)) &&
        (!caseFilter || caseFilter.includes(entry.id))
  )
  if (cases.length === 0) {
    throw new Error('No cases match the --bucket/--case filters.')
  }

  const configs: EvalConfig[] = models.flatMap((model) =>
    levels.flatMap((level) => grounding.map((grounded) => ({ model, level, grounded })))
  )

  const groundedCalls = cases.length * runs * configs.filter((config) => config.grounded).length
  const totalCalls = cases.length * runs * configs.length
  console.log(
    `${cases.length} cases x ${configs.length} configs x ${runs} runs = ${totalCalls} calls (${groundedCalls} with search, which may be billed)\n`
  )

  async function callGemini(
    entry: ObjectionEvalCase,
    config: EvalConfig,
    run: number
  ): Promise<EvalCall> {
    const dataset = buildObjectionDataset(
      entry.guess,
      entry.rowCategory,
      entry.colCategory,
      entry.familyNames ?? []
    )
    const body = buildGeminiGenerateContentBody({
      model: config.model,
      systemPrompt: getObjectionSystemPrompt(config.model),
      userText: JSON.stringify(dataset, null, 2),
      thinkingLevel: config.level,
      grounded: config.grounded,
    })

    const base = {
      caseId: entry.id,
      bucket: entry.bucket,
      expected: entry.expected,
      config: configKey(config),
      run,
    }

    for (let attempt = 0; ; attempt += 1) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
      const startedAt = performance.now()

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal,
          }
        )
        const latencyMs = Math.round(performance.now() - startedAt)

        // Quota and overload errors say nothing about verdict quality, so wait and retry.
        if (
          (response.status === 429 || response.status === 503) &&
          attempt < MAX_RATE_LIMIT_RETRIES
        ) {
          await sleep(2000 * 2 ** attempt)
          continue
        }

        const payload = (await response.json()) as {
          candidates?: Array<{
            finishReason?: string
            groundingMetadata?: { webSearchQueries?: string[]; groundingChunks?: unknown[] }
          }>
          usageMetadata?: { thoughtsTokenCount?: number }
          modelVersion?: string
          error?: { message?: string }
        }

        if (!response.ok) {
          return {
            ...base,
            outcome: 'error',
            correct: false,
            confidence: null,
            explanation: null,
            latencyMs,
            thoughtTokens: null,
            searchQueries: [],
            groundingSources: 0,
            finishReason: null,
            modelVersion: null,
            error: `HTTP ${response.status}: ${payload.error?.message ?? 'unknown error'}`,
          }
        }

        const candidate = payload.candidates?.[0]
        const text = extractGeminiText(payload)
        const judgment = text ? normalizeObjectionResponse(text) : null

        return {
          ...base,
          outcome: judgment?.verdict ?? 'invalid',
          correct: judgment?.verdict === entry.expected,
          confidence: judgment?.confidence ?? null,
          explanation: judgment?.explanation ?? (text ? text.slice(0, 300) : null),
          latencyMs,
          thoughtTokens: payload.usageMetadata?.thoughtsTokenCount ?? null,
          searchQueries: candidate?.groundingMetadata?.webSearchQueries ?? [],
          groundingSources: candidate?.groundingMetadata?.groundingChunks?.length ?? 0,
          finishReason: candidate?.finishReason ?? null,
          modelVersion: payload.modelVersion ?? null,
          error: candidate ? null : 'no candidates in response',
        }
      } catch (error) {
        return {
          ...base,
          outcome: 'error',
          correct: false,
          confidence: null,
          explanation: null,
          latencyMs: Math.round(performance.now() - startedAt),
          thoughtTokens: null,
          searchQueries: [],
          groundingSources: 0,
          finishReason: null,
          modelVersion: null,
          error: error instanceof Error ? error.message : String(error),
        }
      } finally {
        clearTimeout(timeoutId)
      }
    }
  }

  let completed = 0
  // Shuffled so no config is systematically tested during a slow or overloaded stretch.
  const tasks = shuffle(
    cases.flatMap((entry) =>
      configs.flatMap((config) =>
        Array.from({ length: runs }, (_, run) => async () => {
          const result = await callGemini(entry, config, run + 1)
          completed += 1
          if (completed % 20 === 0 || completed === totalCalls) {
            console.log(`  ${completed}/${totalCalls}`)
          }
          return result
        })
      )
    )
  )
  const calls = await runPool(tasks, concurrency)

  const buckets = Array.from(new Set(cases.map((entry) => entry.bucket)))
  const summary = configs.map((config) => {
    const key = configKey(config)
    const configCalls = calls.filter((call) => call.config === key)
    const latencies = configCalls
      .filter((call) => call.outcome !== 'error')
      .map((call) => call.latencyMs)
    const thoughts = configCalls
      .map((call) => call.thoughtTokens)
      .filter((value): value is number => typeof value === 'number')
    const consistentCases = cases.filter((entry) => {
      const outcomes = new Set(
        configCalls.filter((call) => call.caseId === entry.id).map((call) => call.outcome)
      )
      return outcomes.size === 1
    }).length

    return {
      config: key,
      accuracy: `${configCalls.filter((call) => call.correct).length}/${configCalls.length}`,
      ...Object.fromEntries(
        buckets.map((bucket) => {
          const bucketCalls = configCalls.filter((call) => call.bucket === bucket)
          return [
            bucket,
            `${bucketCalls.filter((call) => call.correct).length}/${bucketCalls.length}`,
          ]
        })
      ),
      invalid: configCalls.filter((call) => call.outcome === 'invalid').length,
      errors: configCalls.filter((call) => call.outcome === 'error').length,
      consistent: `${consistentCases}/${cases.length}`,
      searchReported: config.grounded
        ? `${configCalls.filter((call) => call.searchQueries.length > 0 || call.groundingSources > 0).length}/${configCalls.length}`
        : '-',
      p50ms: percentile(latencies, 50),
      p90ms: percentile(latencies, 90),
      avgThoughts: thoughts.length
        ? Math.round(thoughts.reduce((sum, value) => sum + value, 0) / thoughts.length)
        : null,
    }
  })

  console.log('\nBy config (correct/total; consistent = every run gave the same answer).')
  console.log('searchReported is a lower bound: Gemini sometimes omits groundingMetadata.')
  console.table(summary)

  console.log('By case (correct runs per config):')
  console.table(
    cases.map((entry) => ({
      case: entry.id,
      expected: entry.expected,
      ...Object.fromEntries(
        configs.map((config) => {
          const key = configKey(config)
          const caseCalls = calls.filter((call) => call.caseId === entry.id && call.config === key)
          return [key, `${caseCalls.filter((call) => call.correct).length}/${caseCalls.length}`]
        })
      ),
    }))
  )

  const misses = calls.filter((call) => !call.correct)
  if (misses.length > 0) {
    console.log('Misses:')
    for (const call of misses.sort(
      (a, b) => a.caseId.localeCompare(b.caseId) || a.config.localeCompare(b.config)
    )) {
      const detail = call.error ?? call.explanation ?? `finishReason ${call.finishReason}`
      console.log(
        `  [${call.config}] ${call.caseId} -> ${call.outcome} (want ${call.expected}): ${detail}`
      )
    }
  }

  await fs.mkdir(reportDir, { recursive: true })
  const reportPath = path.join(
    reportDir,
    `objection-eval-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  )
  await fs.writeFile(
    reportPath,
    JSON.stringify({ startedAt: new Date().toISOString(), configs, runs, summary, calls }, null, 2)
  )
  console.log(`\nFull results: ${path.relative(projectRoot, reportPath)}`)

  // Aliases like gemini-flash-lite-latest only reveal their target in modelVersion.
  console.log('\nModel versions served:')
  for (const config of configs) {
    const versions = new Set(
      calls
        .filter((call) => call.config === configKey(config) && call.modelVersion)
        .map((call) => call.modelVersion)
    )
    console.log(`  ${config.model} -> ${Array.from(versions).join(', ') || 'unknown'}`)
  }

  if (canary && misses.length > 0) {
    console.error(
      `\nCanary failed: ${misses.length} of ${calls.length} calls were wrong or unusable.`
    )
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
