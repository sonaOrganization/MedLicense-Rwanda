interface FlagIconProps {
  lang: "EN" | "FR";
  className?: string;
  size?: number;
}

export function FlagIcon({ lang, size = 16 }: FlagIconProps) {
  const w = size * 1.5;
  const h = size;

  if (lang === "FR") {
    return (
      <svg viewBox="0 0 3 2" width={w} height={h} aria-label="French flag" style={{ display: "inline-block", flexShrink: 0, borderRadius: 2 }}>
        <rect width="1" height="2" fill="#002395" />
        <rect x="1" width="1" height="2" fill="#fff" />
        <rect x="2" width="1" height="2" fill="#ED2939" />
      </svg>
    );
  }

  // EN — Union Jack
  return (
    <svg viewBox="0 0 60 30" width={w} height={h} aria-label="UK flag" style={{ display: "inline-block", flexShrink: 0, borderRadius: 2 }}>
      <rect width="60" height="30" fill="#012169" />
      {/* White diagonals */}
      <line x1="0" y1="0" x2="60" y2="30" stroke="#fff" strokeWidth="6" />
      <line x1="60" y1="0" x2="0" y2="30" stroke="#fff" strokeWidth="6" />
      {/* White cross */}
      <rect x="0" y="12" width="60" height="6" fill="#fff" />
      <rect x="27" y="0" width="6" height="30" fill="#fff" />
      {/* Red diagonals (simplified, inset) */}
      <line x1="0" y1="0" x2="60" y2="30" stroke="#C8102E" strokeWidth="3.5" />
      <line x1="60" y1="0" x2="0" y2="30" stroke="#C8102E" strokeWidth="3.5" />
      {/* Red cross */}
      <rect x="0" y="13" width="60" height="4" fill="#C8102E" />
      <rect x="28" y="0" width="4" height="30" fill="#C8102E" />
    </svg>
  );
}
