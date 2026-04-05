import { NextRequest, NextResponse } from 'next/server'
import { getIGDBFamilyNames } from '@/lib/igdb'
import { logError, logInfo, logWarn } from '@/lib/logging'
import {
  buildObjectionDataset,
  extractGeminiText,
  normalizeObjectionResponse,
  OBJECTION_SYSTEM_PROMPT,
} from '@/lib/objection'
import type { Category, CellGuess } from '@/lib/types'

const GEMINI_KEY = process.env.GEMINI_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'models/gemini-3.1-flash-lite-preview'
const GEMINI_THINKING_LEVEL = process.env.GEMINI_THINKING_LEVEL ?? 'high'
const IS_DEV = process.env.NODE_ENV !== 'production'

function normalizeGeminiModelName(model: string): string {
  return model.replace(/^models\//, '').trim()
}

function getGeminiModelCandidates(): string[] {
  const configured = normalizeGeminiModelName(GEMINI_MODEL)

  return Array.from(
    new Set(
      [
        configured,
        'gemini-3.1-flash-lite-preview',
        'gemini-2.5-flash-lite',
        'gemini-flash-lite-latest',
      ].filter(Boolean)
    )
  )
}

function buildGeminiRequestBody(
  dataset: ReturnType<typeof buildObjectionDataset>,
  withThinking: boolean
) {
  return {
    systemInstruction: {
      parts: [{ text: OBJECTION_SYSTEM_PROMPT }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: JSON.stringify(dataset, null, 2) }],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
      ...(withThinking
        ? {
            thinkingConfig: {
              thinkingLevel: GEMINI_THINKING_LEVEL,
            },
          }
        : {}),
    },
  }
}

export async function POST(request: NextRequest) {
  if (!GEMINI_KEY) {
    return NextResponse.json({ error: 'Objection review is not configured yet.' }, { status: 503 })
  }

  try {
    const body = (await request.json()) as {
      guess?: CellGuess | null
      rowCategory?: Category | null
      colCategory?: Category | null
    }

    if (!body.guess || !body.rowCategory || !body.colCategory) {
      return NextResponse.json({ error: 'Missing objection context.' }, { status: 400 })
    }

    const familyNames = await getIGDBFamilyNames(body.guess.gameId)
    const dataset = buildObjectionDataset(
      body.guess,
      body.rowCategory,
      body.colCategory,
      familyNames
    )
    let geminiResponse: Response | null = null
    let lastErrorText = ''
    for (const model of getGeminiModelCandidates()) {
      let requestBody = buildGeminiRequestBody(dataset, true)
      let thinkingEnabled = true
      if (IS_DEV) {
        logInfo('Gemini objection request payload', {
          model,
          thinkingEnabled,
          body: JSON.stringify(requestBody, null, 2),
        })
      } else {
        logInfo('Gemini objection request', {
          model,
          thinkingEnabled,
          gameId: body.guess.gameId,
          rowCategory: body.rowCategory.name,
          colCategory: body.colCategory.name,
          familyCount: familyNames.length,
        })
      }

      let response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      )

      let responseBodyText = response.ok ? '' : await response.text()
      if (
        !response.ok &&
        thinkingEnabled &&
        response.status === 400 &&
        /thinking/i.test(responseBodyText)
      ) {
        thinkingEnabled = false
        requestBody = buildGeminiRequestBody(dataset, false)

        logWarn('Gemini objection request retrying without thinking config', {
          model,
          status: response.status,
        })

        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          }
        )
        responseBodyText = response.ok ? '' : await response.text()
      }

      if (response.ok) {
        const payload = (await response.json()) as unknown
        const extractedText = extractGeminiText(payload)
        const parsedJudgment = extractedText ? normalizeObjectionResponse(extractedText) : null
        if (IS_DEV) {
          logInfo('Gemini objection raw response', {
            model,
            payload: JSON.stringify(payload, null, 2),
            extractedText,
            parsedJudgment,
          })
        } else {
          logInfo('Gemini objection verdict', {
            model,
            verdict: parsedJudgment?.verdict ?? null,
            confidence: parsedJudgment?.confidence ?? null,
          })
        }
        geminiResponse = new Response(JSON.stringify(payload), {
          status: response.status,
          headers: { 'Content-Type': 'application/json' },
        })
        break
      }

      lastErrorText = responseBodyText
      logWarn('Gemini objection request failed', {
        model,
        thinkingEnabled,
        status: response.status,
        body: IS_DEV ? lastErrorText : undefined,
      })

      if (response.status !== 404) {
        geminiResponse = response
        break
      }
    }

    if (!geminiResponse?.ok) {
      return NextResponse.json(
        {
          error: lastErrorText.includes('NOT_FOUND')
            ? 'No supported Gemini judgment model is configured.'
            : 'Judgment service is unavailable.',
        },
        { status: 502 }
      )
    }

    const payload = (await geminiResponse.json()) as unknown
    const text = extractGeminiText(payload)
    const judgment = text ? normalizeObjectionResponse(text) : null

    if (!judgment?.verdict || !judgment.confidence || !judgment.explanation) {
      logWarn(
        'Gemini objection response was not parseable',
        IS_DEV
          ? payload
          : {
              modelCandidates: getGeminiModelCandidates(),
            }
      )
      return NextResponse.json(
        { error: 'Judgment service returned an invalid verdict.' },
        { status: 502 }
      )
    }

    return NextResponse.json(judgment)
  } catch (error) {
    logError('Objection error:', error)
    return NextResponse.json({ error: 'Failed to review objection.' }, { status: 500 })
  }
}
