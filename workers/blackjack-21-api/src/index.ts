export interface CompanionItem {
  readonly name: string
  readonly code: string
  readonly country: string
  readonly flag?: string
}

export const COMPANIONS: readonly CompanionItem[] = [
  // United Kingdom (GB)
  { name: 'Oliver', code: 'GB', country: 'United Kingdom' },
  { name: 'Charlotte', code: 'GB', country: 'United Kingdom' },
  { name: 'Arthur', code: 'GB', country: 'United Kingdom' },
  { name: 'Eleanor', code: 'GB', country: 'United Kingdom' },
  { name: 'George', code: 'GB', country: 'United Kingdom' },
  { name: 'Amelia', code: 'GB', country: 'United Kingdom' },
  { name: 'Harry', code: 'GB', country: 'United Kingdom' },
  { name: 'Florence', code: 'GB', country: 'United Kingdom' },

  // Belgium (BE)
  { name: 'Elise', code: 'BE', country: 'Belgium' },
  { name: 'Lucas', code: 'BE', country: 'Belgium' },
  { name: 'Camille', code: 'BE', country: 'Belgium' },
  { name: 'Maxim', code: 'BE', country: 'Belgium' },
  { name: 'Juliette', code: 'BE', country: 'Belgium' },
  { name: 'Victor', code: 'BE', country: 'Belgium' },
  { name: 'Louise', code: 'BE', country: 'Belgium' },

  // Sweden (SE)
  { name: 'Astrid', code: 'SE', country: 'Sweden' },
  { name: 'Elias', code: 'SE', country: 'Sweden' },
  { name: 'Freja', code: 'SE', country: 'Sweden' },
  { name: 'Lars', code: 'SE', country: 'Sweden' },
  { name: 'Ebba', code: 'SE', country: 'Sweden' },
  { name: 'Axel', code: 'SE', country: 'Sweden' },
  { name: 'Saga', code: 'SE', country: 'Sweden' },

  // Brazil (BR)
  { name: 'Thiago', code: 'BR', country: 'Brazil' },
  { name: 'Beatriz', code: 'BR', country: 'Brazil' },
  { name: 'Mateo', code: 'BR', country: 'Brazil' },
  { name: 'Isabela', code: 'BR', country: 'Brazil' },
  { name: 'Rodrigo', code: 'BR', country: 'Brazil' },
  { name: 'Mariana', code: 'BR', country: 'Brazil' },
  { name: 'Gabriel', code: 'BR', country: 'Brazil' },
  { name: 'Larissa', code: 'BR', country: 'Brazil' },

  // South Africa (ZA)
  { name: 'Thabo', code: 'ZA', country: 'South Africa' },
  { name: 'Zola', code: 'ZA', country: 'South Africa' },
  { name: 'Sipho', code: 'ZA', country: 'South Africa' },
  { name: 'Anika', code: 'ZA', country: 'South Africa' },
  { name: 'Kagiso', code: 'ZA', country: 'South Africa' },
  { name: 'Lindiwe', code: 'ZA', country: 'South Africa' },
  { name: 'Duan', code: 'ZA', country: 'South Africa' },

  // China (CN)
  { name: 'Wei', code: 'CN', country: 'China' },
  { name: 'Ying', code: 'CN', country: 'China' },
  { name: 'Jun', code: 'CN', country: 'China' },
  { name: 'Mei', code: 'CN', country: 'China' },
  { name: 'Bo', code: 'CN', country: 'China' },
  { name: 'Lian', code: 'CN', country: 'China' },
  { name: 'Tao', code: 'CN', country: 'China' },
  { name: 'Zhen', code: 'CN', country: 'China' },

  // Japan (JP)
  { name: 'Kenji', code: 'JP', country: 'Japan' },
  { name: 'Aoi', code: 'JP', country: 'Japan' },
  { name: 'Ren', code: 'JP', country: 'Japan' },
  { name: 'Hana', code: 'JP', country: 'Japan' },
  { name: 'Daiki', code: 'JP', country: 'Japan' },
  { name: 'Yuki', code: 'JP', country: 'Japan' },
  { name: 'Sora', code: 'JP', country: 'Japan' },
  { name: 'Kaori', code: 'JP', country: 'Japan' },

  // United States (US)
  { name: 'Mason', code: 'US', country: 'United States' },
  { name: 'Harper', code: 'US', country: 'United States' },
  { name: 'Wyatt', code: 'US', country: 'United States' },
  { name: 'Chloe', code: 'US', country: 'United States' },
  { name: 'Logan', code: 'US', country: 'United States' },
  { name: 'Avery', code: 'US', country: 'United States' },
  { name: 'Caleb', code: 'US', country: 'United States' },
  { name: 'Nora', code: 'US', country: 'United States' },

  // Portugal (PT)
  { name: 'Dinis', code: 'PT', country: 'Portugal' },
  { name: 'Inês', code: 'PT', country: 'Portugal' },
  { name: 'Gonçalo', code: 'PT', country: 'Portugal' },
  { name: 'Matilde', code: 'PT', country: 'Portugal' },
  { name: 'Vasco', code: 'PT', country: 'Portugal' },
  { name: 'Leonor', code: 'PT', country: 'Portugal' },
  { name: 'Martim', code: 'PT', country: 'Portugal' },

  // Indonesia (ID)
  { name: 'Budi', code: 'ID', country: 'Indonesia' },
  { name: 'Siti', code: 'ID', country: 'Indonesia' },
  { name: 'Reza', code: 'ID', country: 'Indonesia' },
  { name: 'Dewi', code: 'ID', country: 'Indonesia' },
  { name: 'Arif', code: 'ID', country: 'Indonesia' },
  { name: 'Putri', code: 'ID', country: 'Indonesia' },
  { name: 'Bayu', code: 'ID', country: 'Indonesia' },
  { name: 'Intan', code: 'ID', country: 'Indonesia' },

  // Australia (AU)
  { name: 'Jack', code: 'AU', country: 'Australia' },
  { name: 'Ruby', code: 'AU', country: 'Australia' },
  { name: 'Cooper', code: 'AU', country: 'Australia' },
  { name: 'Isla', code: 'AU', country: 'Australia' },
  { name: 'Lachlan', code: 'AU', country: 'Australia' },
  { name: 'Mia', code: 'AU', country: 'Australia' },
  { name: 'Archer', code: 'AU', country: 'Australia' },

  // Spain (ES)
  { name: 'Hugo', code: 'ES', country: 'Spain' },
  { name: 'Lucía', code: 'ES', country: 'Spain' },
  { name: 'Alvaro', code: 'ES', country: 'Spain' },
  { name: 'Valeria', code: 'ES', country: 'Spain' },
  { name: 'Diego', code: 'ES', country: 'Spain' },
  { name: 'Paula', code: 'ES', country: 'Spain' },
  { name: 'Pablo', code: 'ES', country: 'Spain' },
  { name: 'Carmen', code: 'ES', country: 'Spain' },

  // Argentina (AR)
  { name: 'Joaquín', code: 'AR', country: 'Argentina' },
  { name: 'Milagros', code: 'AR', country: 'Argentina' },
  { name: 'Facundo', code: 'AR', country: 'Argentina' },
  { name: 'Delfina', code: 'AR', country: 'Argentina' },
  { name: 'Bautista', code: 'AR', country: 'Argentina' },
  { name: 'Catalina', code: 'AR', country: 'Argentina' },
  { name: 'Franco', code: 'AR', country: 'Argentina' },
  { name: 'Martina', code: 'AR', country: 'Argentina' },
]

function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=600',
  }
}

function shuffle<T>(arr: readonly T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = copy[i]!
    copy[i] = copy[j]!
    copy[j] = tmp
  }
  return copy
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() })
    }

    const url = new URL(request.url)
    const countParam = Number.parseInt(url.searchParams.get('count') ?? '3', 10)
    const count = Number.isNaN(countParam) ? 3 : Math.max(1, Math.min(countParam, 10))

    const exclude = (url.searchParams.get('exclude') ?? '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)

    if (url.pathname === '/companions/all') {
      return new Response(JSON.stringify({ companions: COMPANIONS }), {
        headers: corsHeaders(),
      })
    }

    const pool = COMPANIONS.filter((c) => !exclude.includes(c.name.toLowerCase()))
    const selected = shuffle(pool.length >= count ? pool : COMPANIONS).slice(0, count)

    return new Response(JSON.stringify({ companions: selected }), {
      headers: corsHeaders(),
    })
  },
}
