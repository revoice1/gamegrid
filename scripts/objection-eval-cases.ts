import type { Category, CategoryType, CellGuess } from '../lib/types'

export type ObjectionEvalBucket = 'known-good' | 'known-bad' | 'edge' | 'post-cutoff'

export interface ObjectionEvalCase {
  id: string
  bucket: ObjectionEvalBucket
  expected: 'sustained' | 'overruled'
  // Why the expected verdict is correct, so a wrong answer is easy to audit.
  rationale: string
  guess: CellGuess
  rowCategory: Category
  colCategory: Category
  familyNames?: string[]
  // Stable cases used by `eval:objection --canary`; keep edge cases out so it doesn't flake.
  canary?: boolean
}

function category(type: CategoryType, name: string): Category {
  return { type, id: `${type}:${name}`, name }
}

// Objections only happen after the app rejects a guess, so every case leaves out the
// metadata that would have matched (as real IGDB gaps do) and marks that side unmatched.
function guess(
  gameId: number,
  gameName: string,
  released: string,
  metadata: Partial<CellGuess>,
  matched: { row: boolean; col: boolean }
): CellGuess {
  return {
    gameId,
    gameName,
    gameImage: null,
    isCorrect: false,
    released,
    genres: [],
    themes: [],
    perspectives: [],
    gameModes: [],
    platforms: [],
    companies: [],
    developers: [],
    publishers: [],
    ...metadata,
    matchedRow: matched.row,
    matchedCol: matched.col,
  }
}

export const OBJECTION_EVAL_CASES: ObjectionEvalCase[] = [
  // Known good: the player is right and IGDB metadata is missing the fit.
  {
    id: 'mcc-pc',
    canary: true,
    bucket: 'known-good',
    expected: 'sustained',
    rationale: 'The Master Chief Collection came to PC in 2019-2020.',
    guess: guess(
      9001,
      'Halo: The Master Chief Collection',
      '2014-11-11',
      {
        genres: ['Shooter'],
        perspectives: ['First person'],
        platforms: ['Xbox One'],
        developers: ['343 Industries'],
        publishers: ['Microsoft Studios'],
      },
      { row: true, col: false }
    ),
    rowCategory: category('decade', '2010s'),
    colCategory: category('platform', 'PC (Windows/DOS)'),
  },
  {
    id: 're4-horror-gamecube',
    bucket: 'known-good',
    expected: 'sustained',
    rationale: 'Resident Evil 4 is survival horror and launched on GameCube.',
    guess: guess(
      9002,
      'Resident Evil 4',
      '2005-01-11',
      {
        genres: ['Shooter', 'Adventure'],
        themes: ['Action'],
        perspectives: ['Third person'],
        platforms: ['Nintendo GameCube', 'PlayStation 2', 'PC (Microsoft Windows)'],
        developers: ['Capcom'],
        publishers: ['Capcom'],
      },
      { row: false, col: true }
    ),
    rowCategory: category('theme', 'Horror'),
    colCategory: category('platform', 'Nintendo GameCube'),
  },
  {
    id: 'fallout4-third-person',
    canary: true,
    bucket: 'known-good',
    expected: 'sustained',
    rationale: 'Fallout 4 has a full third-person camera toggle for the whole game.',
    guess: guess(
      9003,
      'Fallout 4',
      '2015-11-10',
      {
        genres: ['Role-playing (RPG)', 'Shooter'],
        themes: ['Action', 'Science fiction', 'Open world'],
        perspectives: ['First person'],
        platforms: ['PC (Microsoft Windows)', 'PlayStation 4', 'Xbox One'],
        developers: ['Bethesda Game Studios'],
        publishers: ['Bethesda Softworks'],
      },
      { row: false, col: true }
    ),
    rowCategory: category('perspective', 'Third person'),
    colCategory: category('theme', 'Open world'),
  },
  {
    id: 'stardew-coop-switch',
    bucket: 'known-good',
    expected: 'sustained',
    rationale: 'Stardew Valley added official co-op in 1.3 and is on Switch.',
    guess: guess(
      9004,
      'Stardew Valley',
      '2016-02-26',
      {
        genres: ['Role-playing (RPG)', 'Simulator', 'Indie'],
        gameModes: ['Single player'],
        platforms: ['PC (Microsoft Windows)', 'Nintendo Switch', 'PlayStation 4', 'Xbox One'],
        developers: ['ConcernedApe'],
        publishers: ['ConcernedApe'],
      },
      { row: false, col: true }
    ),
    rowCategory: category('game_mode', 'Co-operative'),
    colCategory: category('platform', 'Nintendo Switch'),
  },
  {
    id: 'fortnite-battle-royale',
    bucket: 'known-good',
    expected: 'sustained',
    rationale: 'Fortnite Battle Royale launched in 2017 and is its main mode.',
    guess: guess(
      9005,
      'Fortnite',
      '2017-07-25',
      {
        genres: ['Shooter'],
        perspectives: ['Third person'],
        gameModes: ['Multiplayer', 'Co-operative'],
        platforms: ['PC (Microsoft Windows)', 'PlayStation 4', 'Xbox One'],
        developers: ['Epic Games'],
        publishers: ['Epic Games'],
      },
      { row: false, col: true }
    ),
    rowCategory: category('game_mode', 'Battle Royale'),
    colCategory: category('decade', '2010s'),
  },
  {
    id: 'gta5-first-person-ps4',
    bucket: 'known-good',
    expected: 'sustained',
    rationale: 'The PS4 version of GTA V added a full first-person mode.',
    guess: guess(
      9006,
      'Grand Theft Auto V',
      '2013-09-17',
      {
        genres: ['Shooter', 'Racing'],
        themes: ['Action', 'Open world'],
        perspectives: ['Third person'],
        platforms: [
          'PlayStation 3',
          'Xbox 360',
          'PlayStation 4',
          'Xbox One',
          'PC (Microsoft Windows)',
        ],
        developers: ['Rockstar North'],
        publishers: ['Rockstar Games'],
      },
      { row: false, col: true }
    ),
    rowCategory: category('perspective', 'First person'),
    colCategory: category('platform', 'PlayStation 4'),
  },

  // Known bad: the app was right to reject.
  {
    id: 'reach-third-person',
    bucket: 'known-bad',
    expected: 'overruled',
    rationale: 'Halo: Reach only goes third person for vehicles and some armor abilities.',
    guess: guess(
      9101,
      'Halo: Reach',
      '2010-09-14',
      {
        genres: ['Shooter'],
        themes: ['Action', 'Science fiction'],
        perspectives: ['First person'],
        platforms: ['Xbox 360'],
        developers: ['Bungie'],
        publishers: ['Microsoft Game Studios'],
      },
      { row: false, col: true }
    ),
    rowCategory: category('perspective', 'Third person'),
    colCategory: category('platform', 'Xbox 360'),
    familyNames: ['Halo: Reach', 'Halo: The Master Chief Collection'],
  },
  {
    id: 'bloodborne-pc',
    canary: true,
    bucket: 'known-bad',
    expected: 'overruled',
    rationale: 'Bloodborne was never officially released on PC.',
    guess: guess(
      9102,
      'Bloodborne',
      '2015-03-24',
      {
        genres: ['Role-playing (RPG)', 'Adventure'],
        themes: ['Action', 'Fantasy', 'Horror'],
        perspectives: ['Third person'],
        platforms: ['PlayStation 4'],
        developers: ['FromSoftware'],
        publishers: ['Sony Computer Entertainment'],
      },
      { row: true, col: false }
    ),
    rowCategory: category('theme', 'Horror'),
    colCategory: category('platform', 'PC (Windows/DOS)'),
  },
  {
    id: 'tlou2-xbox-one',
    bucket: 'known-bad',
    expected: 'overruled',
    rationale: 'The Last of Us Part II is a PlayStation and PC game; no Xbox release.',
    guess: guess(
      9103,
      'The Last of Us Part II',
      '2020-06-19',
      {
        genres: ['Shooter', 'Adventure'],
        themes: ['Action', 'Horror', 'Survival'],
        perspectives: ['Third person'],
        platforms: ['PlayStation 4', 'PlayStation 5', 'PC (Microsoft Windows)'],
        developers: ['Naughty Dog'],
        publishers: ['Sony Interactive Entertainment'],
      },
      { row: true, col: false }
    ),
    rowCategory: category('decade', '2020s'),
    colCategory: category('platform', 'Xbox One'),
  },
  {
    id: 'odyssey-sony',
    canary: true,
    bucket: 'known-bad',
    expected: 'overruled',
    rationale: 'Super Mario Odyssey is Nintendo-developed and published.',
    guess: guess(
      9104,
      'Super Mario Odyssey',
      '2017-10-27',
      {
        genres: ['Platform', 'Adventure'],
        perspectives: ['Third person'],
        platforms: ['Nintendo Switch'],
        developers: ['Nintendo EPD'],
        publishers: ['Nintendo'],
      },
      { row: true, col: false }
    ),
    rowCategory: category('genre', 'Platform'),
    colCategory: category('company', 'Sony'),
  },
  {
    id: 'minecraft-1990s',
    bucket: 'known-bad',
    expected: 'overruled',
    rationale: 'Minecraft was first released in 2009 (2011 full release).',
    guess: guess(
      9105,
      'Minecraft',
      '2011-11-18',
      {
        genres: ['Simulator', 'Adventure'],
        themes: ['Fantasy', 'Survival', 'Open world'],
        perspectives: ['First person', 'Third person'],
        platforms: ['PC (Microsoft Windows)'],
        developers: ['Mojang Studios'],
        publishers: ['Mojang Studios'],
      },
      { row: true, col: false }
    ),
    rowCategory: category('theme', 'Survival'),
    colCategory: category('decade', '1990s'),
  },
  {
    id: 'celeste-coop',
    bucket: 'known-bad',
    expected: 'overruled',
    rationale: 'Celeste has no co-op mode; Assist Mode is not co-op.',
    guess: guess(
      9106,
      'Celeste',
      '2018-01-25',
      {
        genres: ['Platform', 'Indie'],
        perspectives: ['Side view'],
        gameModes: ['Single player'],
        platforms: ['PC (Microsoft Windows)', 'Nintendo Switch', 'PlayStation 4', 'Xbox One'],
        developers: ['Maddy Makes Games'],
        publishers: ['Maddy Makes Games'],
      },
      { row: false, col: true }
    ),
    rowCategory: category('game_mode', 'Co-operative'),
    colCategory: category('genre', 'Platform'),
  },

  // Edge cases: correct answers exist, but they need careful reading of the rules.
  {
    id: 'gta5-first-person-ps3',
    bucket: 'edge',
    expected: 'overruled',
    rationale:
      'First person exists only in the PS4/XB1/PC versions, so no single release fits both First person and PS3.',
    guess: guess(
      9201,
      'Grand Theft Auto V',
      '2013-09-17',
      {
        genres: ['Shooter', 'Racing'],
        themes: ['Action', 'Open world'],
        perspectives: ['Third person'],
        platforms: [
          'PlayStation 3',
          'Xbox 360',
          'PlayStation 4',
          'Xbox One',
          'PC (Microsoft Windows)',
        ],
        developers: ['Rockstar North'],
        publishers: ['Rockstar Games'],
      },
      { row: false, col: true }
    ),
    rowCategory: category('perspective', 'First person'),
    colCategory: category('platform', 'PlayStation 3'),
  },
  {
    id: 'mass-effect-ps3',
    bucket: 'edge',
    expected: 'sustained',
    rationale:
      'Mass Effect 1 was officially released on PS3 in 2012. Surprising, which the prompt tells the model to distrust.',
    guess: guess(
      9202,
      'Mass Effect',
      '2007-11-20',
      {
        genres: ['Role-playing (RPG)', 'Shooter'],
        themes: ['Action', 'Science fiction'],
        perspectives: ['Third person'],
        platforms: ['Xbox 360', 'PC (Microsoft Windows)'],
        developers: ['BioWare'],
        publishers: ['Microsoft Game Studios'],
      },
      { row: true, col: false }
    ),
    rowCategory: category('theme', 'Science fiction'),
    colCategory: category('platform', 'PlayStation 3'),
    familyNames: ['Mass Effect', 'Mass Effect Trilogy', 'Mass Effect Legendary Edition'],
  },
  {
    id: 'mgs1-pc',
    bucket: 'edge',
    expected: 'sustained',
    rationale: 'Metal Gear Solid got an official Windows port in 2000.',
    guess: guess(
      9203,
      'Metal Gear Solid',
      '1998-09-03',
      {
        genres: ['Shooter', 'Adventure', 'Tactical'],
        themes: ['Action', 'Stealth'],
        perspectives: ['Bird view / Isometric', 'Third person'],
        platforms: ['PlayStation (Original)'],
        developers: ['Konami Computer Entertainment Japan'],
        publishers: ['Konami'],
      },
      { row: true, col: false }
    ),
    rowCategory: category('company', 'Konami'),
    colCategory: category('platform', 'PC (Windows/DOS)'),
  },
  {
    id: 'pokemon-go-nintendo',
    bucket: 'edge',
    expected: 'overruled',
    rationale:
      'Pokémon GO is developed and published by Niantic; Nintendo only has brand and licensing ties.',
    guess: guess(
      9204,
      'Pokémon GO',
      '2016-07-06',
      {
        genres: ['Role-playing (RPG)'],
        themes: ['Fantasy'],
        platforms: ['iOS', 'Android'],
        developers: ['Niantic'],
        publishers: ['Niantic'],
      },
      { row: true, col: false }
    ),
    rowCategory: category('decade', '2010s'),
    colCategory: category('company', 'Nintendo'),
  },
  {
    id: 'minecraft-microsoft',
    bucket: 'edge',
    expected: 'sustained',
    rationale:
      'Microsoft (Xbox Game Studios) published Minecraft console editions and owns Mojang; publisher credit, not just platform ownership.',
    guess: guess(
      9205,
      'Minecraft',
      '2011-11-18',
      {
        genres: ['Simulator', 'Adventure'],
        themes: ['Fantasy', 'Survival', 'Open world'],
        perspectives: ['First person', 'Third person'],
        platforms: ['PC (Microsoft Windows)', 'Xbox 360', 'Xbox One'],
        developers: ['Mojang Studios'],
        publishers: ['Mojang Studios'],
      },
      { row: true, col: false }
    ),
    rowCategory: category('theme', 'Open world'),
    colCategory: category('company', 'Microsoft'),
    familyNames: ['Minecraft', 'Minecraft: Xbox 360 Edition', 'Minecraft: Xbox One Edition'],
  },

  // Post-cutoff: released after the models' training data. Only search can confirm these,
  // so they show whether grounding (or its absence) changes the answer.
  {
    id: 'control-resonant-third-person-ps5',
    bucket: 'post-cutoff',
    expected: 'sustained',
    rationale: 'Control Resonant (Remedy, 24 Sep 2026) is a third-person action RPG on PS5.',
    guess: guess(
      9301,
      'Control Resonant',
      '2026-09-24',
      {
        genres: ['Role-playing (RPG)'],
        platforms: ['PlayStation 5', 'Xbox Series X|S', 'PC (Microsoft Windows)'],
        developers: ['Remedy Entertainment'],
        publishers: ['Remedy Entertainment'],
      },
      { row: false, col: true }
    ),
    rowCategory: category('perspective', 'Third person'),
    colCategory: category('platform', 'PlayStation 5'),
  },
  {
    id: 'control-resonant-ps4',
    canary: true,
    bucket: 'post-cutoff',
    expected: 'overruled',
    rationale: 'Control Resonant is current-gen only: PS5, Xbox Series X|S, PC, Mac.',
    guess: guess(
      9302,
      'Control Resonant',
      '2026-09-24',
      {
        genres: ['Role-playing (RPG)'],
        perspectives: ['Third person'],
        platforms: ['PlayStation 5', 'Xbox Series X|S', 'PC (Microsoft Windows)'],
        developers: ['Remedy Entertainment'],
        publishers: ['Remedy Entertainment'],
      },
      { row: true, col: false }
    ),
    rowCategory: category('decade', '2020s'),
    colCategory: category('platform', 'PlayStation 4'),
  },
  {
    id: 'control-resonant-coop',
    bucket: 'post-cutoff',
    expected: 'overruled',
    rationale: 'Control Resonant is single-player only.',
    guess: guess(
      9303,
      'Control Resonant',
      '2026-09-24',
      {
        genres: ['Role-playing (RPG)'],
        perspectives: ['Third person'],
        gameModes: ['Single player'],
        platforms: ['PlayStation 5', 'Xbox Series X|S', 'PC (Microsoft Windows)'],
        developers: ['Remedy Entertainment'],
        publishers: ['Remedy Entertainment'],
      },
      { row: false, col: true }
    ),
    rowCategory: category('game_mode', 'Co-operative'),
    colCategory: category('platform', 'Xbox Series X|S'),
  },
  {
    id: 'neon-abyss-2-coop-switch',
    canary: true,
    bucket: 'post-cutoff',
    expected: 'sustained',
    rationale: 'Neon Abyss 2 (8 Oct 2026) has 4-player online co-op and released on Switch.',
    guess: guess(
      9304,
      'Neon Abyss 2',
      '2026-10-08',
      {
        genres: ['Platform', 'Shooter', 'Indie'],
        perspectives: ['Side view'],
        gameModes: ['Single player'],
        platforms: [
          'PC (Microsoft Windows)',
          'PlayStation 5',
          'Xbox Series X|S',
          'Nintendo Switch',
        ],
        developers: ['Veewo Games'],
        publishers: ['Kepler Interactive'],
      },
      { row: false, col: true }
    ),
    rowCategory: category('game_mode', 'Co-operative'),
    colCategory: category('platform', 'Nintendo Switch'),
  },
  {
    id: 'neon-abyss-2-side-view',
    bucket: 'post-cutoff',
    expected: 'sustained',
    rationale: 'Neon Abyss 2 is a side-scrolling 2D roguelike; Early Access started July 2025.',
    guess: guess(
      9305,
      'Neon Abyss 2',
      '2026-10-08',
      {
        genres: ['Platform', 'Shooter', 'Indie'],
        gameModes: ['Single player', 'Co-operative'],
        platforms: [
          'PC (Microsoft Windows)',
          'PlayStation 5',
          'Xbox Series X|S',
          'Nintendo Switch',
        ],
        developers: ['Veewo Games'],
        publishers: ['Kepler Interactive'],
      },
      { row: false, col: true }
    ),
    rowCategory: category('perspective', 'Side view'),
    colCategory: category('decade', '2020s'),
  },
  {
    id: 'neon-abyss-2-ps4',
    bucket: 'post-cutoff',
    expected: 'overruled',
    rationale: 'Neon Abyss 2 skipped PS4 (the first game was on PS4, a family trap).',
    guess: guess(
      9306,
      'Neon Abyss 2',
      '2026-10-08',
      {
        genres: ['Platform', 'Shooter', 'Indie'],
        perspectives: ['Side view'],
        gameModes: ['Single player', 'Co-operative'],
        platforms: [
          'PC (Microsoft Windows)',
          'PlayStation 5',
          'Xbox Series X|S',
          'Nintendo Switch',
        ],
        developers: ['Veewo Games'],
        publishers: ['Kepler Interactive'],
      },
      { row: true, col: false }
    ),
    rowCategory: category('genre', 'Platform'),
    colCategory: category('platform', 'PlayStation 4'),
  },
]
