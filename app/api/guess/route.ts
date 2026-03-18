import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateGameForCell } from '@/lib/rawg'
import type { Category } from '@/lib/types'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  try {
    const body = await request.json()
    const {
      puzzleId,
      cellIndex,
      gameId,
      gameName,
      gameImage,
      sessionId,
      rowCategory,
      colCategory,
    } = body as {
      puzzleId: string
      cellIndex: number
      gameId: number
      gameName: string
      gameImage: string | null
      sessionId: string
      rowCategory: Category
      colCategory: Category
    }
    
    // Validate the guess
    const { valid, game } = await validateGameForCell(gameId, rowCategory, colCategory)
    
    if (valid) {
      // Record the guess
      await supabase.from('guesses').insert({
        puzzle_id: puzzleId,
        cell_index: cellIndex,
        game_id: gameId,
        game_name: gameName,
        game_image: gameImage,
        session_id: sessionId,
      })
      
      // Atomically increment answer stats with a single upsert
      await supabase.rpc('increment_answer_stat', {
        p_puzzle_id: puzzleId,
        p_cell_index: cellIndex,
        p_game_id: gameId,
        p_game_name: gameName,
        p_game_image: gameImage,
      })
    }
    
    return NextResponse.json({
      valid,
      game: valid ? {
        id: game?.id,
        name: game?.name,
        background_image: game?.background_image,
      } : null,
    })
  } catch (error) {
    console.error('Guess error:', error)
    return NextResponse.json(
      { error: 'Failed to process guess', valid: false },
      { status: 500 }
    )
  }
}
