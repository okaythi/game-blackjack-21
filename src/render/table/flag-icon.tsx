/**
 * High-quality vector SVG flags for all 13 companion countries.
 * Universally supported across all operating systems and browsers (including Windows Segoe UI).
 */

interface FlagIconProps {
  readonly code?: string | undefined
  readonly size?: number | undefined
  readonly title?: string | undefined
}

export function FlagIcon({ code = 'GB', size = 18, title }: FlagIconProps) {
  const upper = (code || 'GB').toUpperCase()
  const width = size
  const height = Math.round(size * 0.7)

  // Standardized SVG flag definitions
  switch (upper) {
    case 'GB':
      return (
        <svg width={width} height={height} viewBox="0 0 60 30" style={{ borderRadius: '2px', overflow: 'hidden' }}>
          <title>{title ?? 'United Kingdom'}</title>
          <clipPath id="s"><path d="M0,0 v30 h60 v-30 z"/></clipPath>
          <clipPath id="t"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath>
          <g clipPath="url(#s)">
            <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
            <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
            <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4"/>
            <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
            <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
          </g>
        </svg>
      )

    case 'BE':
      return (
        <svg width={width} height={height} viewBox="0 0 30 20" style={{ borderRadius: '2px', overflow: 'hidden' }}>
          <title>{title ?? 'Belgium'}</title>
          <rect width="10" height="20" fill="#000000" />
          <rect x="10" width="10" height="20" fill="#FDDA24" />
          <rect x="20" width="10" height="20" fill="#EF3340" />
        </svg>
      )

    case 'SE':
      return (
        <svg width={width} height={height} viewBox="0 0 16 10" style={{ borderRadius: '2px', overflow: 'hidden' }}>
          <title>{title ?? 'Sweden'}</title>
          <rect width="16" height="10" fill="#006AA7"/>
          <rect x="5" width="2" height="10" fill="#FECC00"/>
          <rect y="4" width="16" height="2" fill="#FECC00"/>
        </svg>
      )

    case 'BR':
      return (
        <svg width={width} height={height} viewBox="0 0 20 14" style={{ borderRadius: '2px', overflow: 'hidden' }}>
          <title>{title ?? 'Brazil'}</title>
          <rect width="20" height="14" fill="#009739" />
          <polygon points="10,1.5 18.5,7 10,12.5 1.5,7" fill="#FEDD00" />
          <circle cx="10" cy="7" r="3.2" fill="#012169" />
        </svg>
      )

    case 'ZA':
      return (
        <svg width={width} height={height} viewBox="0 0 30 20" style={{ borderRadius: '2px', overflow: 'hidden' }}>
          <title>{title ?? 'South Africa'}</title>
          <rect width="30" height="10" fill="#E03C31" />
          <rect y="10" width="30" height="10" fill="#001489" />
          <polygon points="0,0 12,10 0,20" fill="#000000" />
          <path d="M0,0 L15,10 L30,10 M0,20 L15,10 L30,10" stroke="#007749" strokeWidth="4" fill="none" />
          <polygon points="0,2 10,10 0,18" fill="#FFB81C" />
        </svg>
      )

    case 'CN':
      return (
        <svg width={width} height={height} viewBox="0 0 30 20" style={{ borderRadius: '2px', overflow: 'hidden' }}>
          <title>{title ?? 'China'}</title>
          <rect width="30" height="20" fill="#DE2910" />
          <polygon points="5,3 6,6 3,4 7,4 4,6" fill="#FFDE00" />
          <circle cx="10" cy="2.5" r="0.8" fill="#FFDE00" />
          <circle cx="12" cy="4.5" r="0.8" fill="#FFDE00" />
          <circle cx="12" cy="7.5" r="0.8" fill="#FFDE00" />
          <circle cx="10" cy="9.5" r="0.8" fill="#FFDE00" />
        </svg>
      )

    case 'JP':
      return (
        <svg width={width} height={height} viewBox="0 0 30 20" style={{ borderRadius: '2px', overflow: 'hidden' }}>
          <title>{title ?? 'Japan'}</title>
          <rect width="30" height="20" fill="#FFFFFF" />
          <circle cx="15" cy="10" r="6" fill="#BC002D" />
        </svg>
      )

    case 'US':
      return (
        <svg width={width} height={height} viewBox="0 0 38 20" style={{ borderRadius: '2px', overflow: 'hidden' }}>
          <title>{title ?? 'United States'}</title>
          <rect width="38" height="20" fill="#B22234"/>
          <path d="M0,3.08 h38 M0,6.15 h38 M0,9.23 h38 M0,12.31 h38 M0,15.38 h38 M0,18.46 h38" stroke="#fff" strokeWidth="1.54"/>
          <rect width="15.2" height="10.77" fill="#3C3B6E"/>
        </svg>
      )

    case 'PT':
      return (
        <svg width={width} height={height} viewBox="0 0 30 20" style={{ borderRadius: '2px', overflow: 'hidden' }}>
          <title>{title ?? 'Portugal'}</title>
          <rect width="12" height="20" fill="#046A38" />
          <rect x="12" width="18" height="20" fill="#DA291C" />
          <circle cx="12" cy="10" r="4.5" fill="#FFDD00" />
          <circle cx="12" cy="10" r="3" fill="#FFFFFF" />
        </svg>
      )

    case 'ID':
      return (
        <svg width={width} height={height} viewBox="0 0 30 20" style={{ borderRadius: '2px', overflow: 'hidden' }}>
          <title>{title ?? 'Indonesia'}</title>
          <rect width="30" height="10" fill="#FF0000" />
          <rect y="10" width="30" height="10" fill="#FFFFFF" />
        </svg>
      )

    case 'AU':
      return (
        <svg width={width} height={height} viewBox="0 0 40 20" style={{ borderRadius: '2px', overflow: 'hidden' }}>
          <title>{title ?? 'Australia'}</title>
          <rect width="40" height="20" fill="#00008B" />
          <rect width="20" height="10" fill="#012169" />
          <path d="M0,0 L20,10 M20,0 L0,10" stroke="#fff" strokeWidth="2"/>
          <path d="M10,0 v10 M0,5 h20" stroke="#fff" strokeWidth="3"/>
          <path d="M10,0 v10 M0,5 h20" stroke="#C8102E" strokeWidth="1.8"/>
          <circle cx="30" cy="6" r="1.5" fill="#FFFFFF" />
          <circle cx="34" cy="9" r="1.2" fill="#FFFFFF" />
          <circle cx="30" cy="14" r="1.5" fill="#FFFFFF" />
          <circle cx="26" cy="10" r="1.2" fill="#FFFFFF" />
        </svg>
      )

    case 'ES':
      return (
        <svg width={width} height={height} viewBox="0 0 30 20" style={{ borderRadius: '2px', overflow: 'hidden' }}>
          <title>{title ?? 'Spain'}</title>
          <rect width="30" height="5" fill="#AA151B" />
          <rect y="5" width="30" height="10" fill="#F1BF00" />
          <rect y="15" width="30" height="5" fill="#AA151B" />
          <circle cx="8" cy="10" r="2.5" fill="#AA151B" />
        </svg>
      )

    case 'AR':
      return (
        <svg width={width} height={height} viewBox="0 0 30 20" style={{ borderRadius: '2px', overflow: 'hidden' }}>
          <title>{title ?? 'Argentina'}</title>
          <rect width="30" height="6.67" fill="#74ACDF" />
          <rect y="6.67" width="30" height="6.67" fill="#FFFFFF" />
          <rect y="13.34" width="30" height="6.67" fill="#74ACDF" />
          <circle cx="15" cy="10" r="2.2" fill="#F6B40E" />
        </svg>
      )

    default:
      return (
        <span style={{ fontSize: '11px', fontWeight: 800, color: '#fef08a' }}>
          {upper}
        </span>
      )
  }
}
