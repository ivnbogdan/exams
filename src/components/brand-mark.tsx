/** The exams.ro mark: three chunky arrows in teal, green and orange around the wordmark. Inline SVG, scales crisply. */
export function BrandMark({ className, title = "exams.ro" }: { className?: string; title?: string }) {
  // arrow pointing right, centred on the origin; rotated and placed per colour below
  const arrow = "M-30 -9 H6 V-22 L34 0 L6 22 V9 H-30 Z";
  return (
    <svg viewBox="0 0 250 122" role="img" aria-label={title} className={className}>
      <rect width="250" height="122" rx="16" fill="#202020" />
      <g transform="translate(36 30) rotate(45) scale(1.15)"><path d={arrow} fill="#24909d" /></g>
      <g transform="translate(40 92) rotate(-45) scale(1.2)"><path d={arrow} fill="#6ab824" /></g>
      <g transform="translate(212 92) rotate(-135) scale(1.2)"><path d={arrow} fill="#ed9d13" /></g>
      <text x="128" y="62" textAnchor="middle" fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="900" fontSize="46" letterSpacing="2" fill="#ffffff">EXAMS</text>
      <text x="196" y="100" textAnchor="end" fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="900" fontSize="22" fill="#ffffff">.RO</text>
    </svg>
  );
}
