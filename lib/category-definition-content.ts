import { getCategoryDisplayName } from './category-display'
import type { Category, CategoryType } from './types'

export interface CategoryDefinitionContent {
  description: string
  source: 'fallback'
  sourceLabel: string
}

const GENRE_DESCRIPTIONS: Partial<Record<string, string>> = {
  fighting:
    'Games built around direct combat between opponents, usually emphasizing move sets, timing, spacing, and character matchups.',
  shooter:
    'Games where aiming and ranged attacks are central, whether in first-person, third-person, on-rails, or top-down form.',
  platform:
    'Games focused on movement challenges such as jumping, climbing, timing, and navigation through obstacle-heavy spaces.',
  puzzle:
    'Games that primarily test logic, pattern recognition, planning, or problem-solving rather than reflexes alone.',
  racing:
    'Games centered on speed, driving lines, vehicle control, and finishing ahead of other racers or the clock.',
  rpg: 'Games built around character growth, stats, party building, quests, and long-term progression choices.',
  simulator:
    'Games designed to model activities, systems, or professions with a stronger focus on authenticity, management, or routine.',
  sport:
    'Games based on athletic competition, from realistic recreations of sports to more arcade-style interpretations.',
  strategy:
    'Games that reward planning, positioning, resource use, and longer-term decision-making over pure reaction speed.',
  tactical:
    'Games with a strong emphasis on deliberate positioning, unit control, and encounter-by-encounter decision-making.',
  adventure:
    'Games driven by exploration, story progression, discovery, and interacting with the world to move forward.',
}

const THEME_DESCRIPTIONS: Partial<Record<string, string>> = {
  action:
    'A theme built around intensity, momentum, and conflict, often emphasizing danger and constant engagement.',
  fantasy:
    'A theme involving imagined worlds, magic, mythic creatures, or other supernatural elements outside ordinary reality.',
  'science-fiction':
    'A theme centered on speculative technology, space, futurism, advanced science, or imagined scientific possibilities.',
  horror:
    'A theme meant to create fear, dread, unease, or tension through threat, atmosphere, and unsettling imagery.',
  survival:
    'A theme focused on scarcity, endurance, and staying alive against environmental pressure, enemies, or limited resources.',
  'open-world':
    'A theme built around broad player freedom, traversal, and choosing how to explore a large interconnected world.',
  warfare:
    'A theme centered on armed conflict, military forces, battles, or war-related settings and stakes.',
  mystery:
    'A theme driven by the unknown, investigation, hidden information, and uncovering what really happened.',
}

const PERSPECTIVE_DESCRIPTIONS: Partial<Record<string, string>> = {
  'first-person':
    'The player views the game world through the eyes of the controlled character, emphasizing immediacy and direct presence.',
  'third-person':
    'The camera follows the controlled character from outside the body, giving more awareness of movement and surroundings.',
  isometric:
    'The world is shown from an angled overhead viewpoint, often making spaces, positioning, and layout easy to read.',
  'side-view':
    'The action is presented from the side, highlighting horizontal movement, spacing, and layered 2D composition.',
  text: 'Interaction happens primarily through written language, descriptions, and commands instead of direct visual action.',
  auditory:
    'The experience relies heavily on sound cues and audio feedback as a primary way to understand and navigate play.',
  'virtual-reality':
    'The game is designed for immersive VR hardware, placing the player inside a spatial, tracked first-person environment.',
}

const GAME_MODE_DESCRIPTIONS: Partial<Record<string, string>> = {
  'single-player':
    'Designed to be played by one person, with progression, challenge, or story that does not require other players.',
  multiplayer:
    'Built for multiple players sharing a competitive or cooperative experience, locally, online, or both.',
  'co-operative':
    'A multiplayer mode where players work together toward shared objectives instead of directly opposing one another.',
  'split-screen':
    'A local multiplayer format where multiple viewpoints are shown on the same display at the same time.',
  mmo: 'A large-scale online format where many players exist in the same persistent world or connected play space.',
  'battle-royale':
    'A competitive mode where many players enter the same match and play until one player or team remains.',
}

const COMPANY_DESCRIPTIONS: Partial<Record<string, string>> = {
  nintendo:
    'A company category for games developed or published by Nintendo across its long history in console, handheld, and software development.',
  sega: 'A company category for games developed or published by Sega, from arcade-era classics through its console and publishing history.',
  'electronic-arts':
    'A company category for games developed or published by Electronic Arts, including its sports, shooter, racing, and major-label publishing output.',
  konami:
    'A company category for games developed or published by Konami, spanning action, horror, arcade, sports, and long-running franchise work.',
  activision:
    'A company category for games developed or published by Activision, covering both its publishing catalog and Activision-branded studio output.',
  capcom:
    'A company category for games developed or published by Capcom, including its action, arcade, fighting, survival horror, and adventure catalog.',
  'square-enix':
    'A company category for games developed or published by Square Enix, including the broader Square and Enix lineage behind many classic and modern RPGs.',
  ubisoft:
    'A company category for games developed or published by Ubisoft, covering its internal studios as well as Ubisoft-led publishing releases.',
  thq: 'A company category for games developed or published by THQ across its historical publishing catalog and associated studio output.',
  'microsoft-xbox':
    'A company category for games developed or published under the broader Microsoft label, including Microsoft Game Studios, Microsoft Studios, and Xbox Game Studios.',
  sony: 'A company category for games developed or published under the broader Sony label, especially the Sony Computer Entertainment and Sony Interactive Entertainment lineage.',
  'bandai-namco':
    'A company category for games developed or published by Bandai Namco, including the broader Namco lineage behind many arcade and console franchises.',
  atlus:
    'A company category for games developed or published by Atlus, especially RPGs, dungeon crawlers, and other character-driven Japanese releases.',
  taito:
    'A company category for games developed or published by Taito, with deep roots in arcade history and classic Japanese game publishing.',
  snk: 'A company category for games developed or published by SNK, especially arcade, fighting, and action-oriented releases.',
  'koei-tecmo':
    'A company category for games developed or published by Koei Tecmo, including the broader Koei and Tecmo lineage behind strategy, action, and historical franchises.',
}

const TAG_DESCRIPTIONS: Partial<Record<string, string>> = {
  'female-protagonist':
    'A tag for games whose primary playable lead is a female protagonist. It is about the central player character, not just the broader cast.',
  metroidvania:
    'A tag for exploration-driven action games built around interconnected spaces, gated progression, backtracking, and unlocking new traversal abilities over time.',
  'platform-exclusive':
    'A tag for games closely identified with a specific platform release ecosystem rather than broad simultaneous availability across many platforms.',
  roguex:
    'A catch-all GameGrid tag for roguelike, roguelite, and closely related run-based designs. These games usually emphasize repeat attempts, procedural variation, and progress or adaptation across runs.',
  sequel:
    'A tag for games that continue, follow, or build directly on an earlier game or series entry.',
}

const TYPE_LABELS: Record<CategoryType, string> = {
  platform: 'Platform',
  genre: 'Genre',
  developer: 'Developer',
  publisher: 'Publisher',
  decade: 'Decade',
  tag: 'Tag',
  company: 'Company',
  game_mode: 'Game Mode',
  theme: 'Theme',
  perspective: 'Perspective',
}

function normalizeCategoryKey(value: string | undefined): string {
  return (value ?? '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[|/]/g, ' ')
    .replace(/[()]/g, '')
    .replace(/\s+/g, '-')
    .trim()
}

function getMappedDescription(
  mapping: Partial<Record<string, string>>,
  category: Category,
  fallback: string
): string {
  const key = normalizeCategoryKey(category.slug || category.name)
  return mapping[key] ?? fallback
}

function getDecadeRangeLabel(category: Category): string | null {
  const decadeStart = Number.parseInt(String(category.id), 10)

  if (!Number.isFinite(decadeStart)) {
    return null
  }

  return `${decadeStart}-${decadeStart + 9}`
}

export function getCategoryTypeLabel(type: CategoryType): string {
  return TYPE_LABELS[type]
}

export function getFallbackCategoryDefinition(category: Category): CategoryDefinitionContent {
  const displayName = getCategoryDisplayName(category)

  if (category.type === 'platform') {
    return {
      description: `${displayName} is a platform category. A game qualifies if it had an official release on that hardware or within that platform family, including ports and platform-specific versions.`,
      source: 'fallback',
      sourceLabel: 'GameGrid guide',
    }
  }

  if (category.type === 'genre') {
    return {
      description: getMappedDescription(
        GENRE_DESCRIPTIONS,
        category,
        `${displayName} is a genre classification used to describe a game's dominant style of play.`
      ),
      source: 'fallback',
      sourceLabel: 'GameGrid guide',
    }
  }

  if (category.type === 'theme') {
    return {
      description: getMappedDescription(
        THEME_DESCRIPTIONS,
        category,
        `${displayName} is a theme label describing the setting, tone, or narrative flavor a game leans into.`
      ),
      source: 'fallback',
      sourceLabel: 'GameGrid guide',
    }
  }

  if (category.type === 'perspective') {
    return {
      description: getMappedDescription(
        PERSPECTIVE_DESCRIPTIONS,
        category,
        `${displayName} describes the viewpoint or camera perspective the player primarily experiences during play.`
      ),
      source: 'fallback',
      sourceLabel: 'GameGrid guide',
    }
  }

  if (category.type === 'game_mode') {
    return {
      description: getMappedDescription(
        GAME_MODE_DESCRIPTIONS,
        category,
        `${displayName} describes how players participate in the game, such as solo, co-op, or competitive play.`
      ),
      source: 'fallback',
      sourceLabel: 'GameGrid guide',
    }
  }

  if (category.type === 'decade') {
    const rangeLabel = getDecadeRangeLabel(category)

    return {
      description: rangeLabel
        ? `${displayName} covers games originally released from ${rangeLabel}. This is based on the game's original release window, not later ports, remasters, or re-releases.`
        : `${displayName} covers games originally released during that ten-year span, based on the game's original release window rather than later ports, remasters, or re-releases.`,
      source: 'fallback',
      sourceLabel: 'GameGrid guide',
    }
  }

  if (category.type === 'developer') {
    return {
      description: `${displayName} refers to the studio or development team that made the game. In GameGrid, this category is about authorship rather than release timing, platforms, or publishing ownership.`,
      source: 'fallback',
      sourceLabel: 'GameGrid guide',
    }
  }

  if (category.type === 'publisher') {
    return {
      description: `${displayName} refers to the company responsible for publishing or distributing the game. This is about release and publishing credit, not who necessarily developed it.`,
      source: 'fallback',
      sourceLabel: 'GameGrid guide',
    }
  }

  if (category.type === 'company') {
    return {
      description: getMappedDescription(
        COMPANY_DESCRIPTIONS,
        category,
        `${displayName} is a company category. A game can qualify through its credited relationship to that company, most commonly as a developer or publisher.`
      ),
      source: 'fallback',
      sourceLabel: 'GameGrid guide',
    }
  }

  if (category.type === 'tag') {
    return {
      description: getMappedDescription(
        TAG_DESCRIPTIONS,
        category,
        `${displayName} is a tag-style category used to group games by notable traits, themes, mechanics, or player-facing qualities. It points to what a game is known for, not a specific release date or platform.`
      ),
      source: 'fallback',
      sourceLabel: 'GameGrid guide',
    }
  }

  return {
    description: `${displayName} is a tag-style category used to group games by notable traits, themes, mechanics, or player-facing qualities. It points to what a game is known for, not a specific release date or platform.`,
    source: 'fallback',
    sourceLabel: 'GameGrid guide',
  }
}
