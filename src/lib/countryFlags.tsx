'use client'

const flagCodes: Record<string, string> = {
  'Canadá': 'ca',
  'Estados Unidos': 'us',
  'México': 'mx',
  'Arábia Saudita': 'sa',
  'Austrália': 'au',
  'Catar': 'qa',
  'Coreia do Sul': 'kr',
  'Irã': 'ir',
  'Iraque': 'iq',
  'Japão': 'jp',
  'Jordânia': 'jo',
  'Uzbequistão': 'uz',
  'África do Sul': 'za',
  'Argélia': 'dz',
  'Cabo Verde': 'cv',
  'Costa do Marfim': 'ci',
  'Egito': 'eg',
  'Gana': 'gh',
  'Marrocos': 'ma',
  'RD do Congo': 'cd',
  'Senegal': 'sn',
  'Tunísia': 'tn',
  'Argentina': 'ar',
  'Brasil': 'br',
  'Colômbia': 'co',
  'Equador': 'ec',
  'Paraguai': 'py',
  'Uruguai': 'uy',
  'Nova Zelândia': 'nz',
  'Alemanha': 'de',
  'Áustria': 'at',
  'Bélgica': 'be',
  'Bósnia e Herzegovina': 'ba',
  'Croácia': 'hr',
  'Escócia': 'gb-sct',
  'Espanha': 'es',
  'França': 'fr',
  'Holanda': 'nl',
  'Inglaterra': 'gb-eng',
  'Noruega': 'no',
  'Portugal': 'pt',
  'República Tcheca': 'cz',
  'Suécia': 'se',
  'Suíça': 'ch',
  'Turquia': 'tr',
  'Curaçau': 'cw',
  'Haiti': 'ht',
  'Panamá': 'pa',
}

export function getFlagClass(name: string | null | undefined): string {
  if (!name) return ''
  const code = flagCodes[name]
  if (!code) return ''
  return `fi fi-${code}`
}

export function TeamWithFlag({ name, className = '' }: { name: string | null | undefined; className?: string }) {
  if (!name) return <span className="text-stone-600">─</span>
  const flagClass = getFlagClass(name)
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {flagClass && <span className={`${flagClass} rounded-sm shrink-0`} style={{ width: 16, height: 12, fontSize: 16, verticalAlign: 'middle', display: 'inline-block' }} />}
      <span className="leading-tight">{name}</span>
    </span>
  )
}