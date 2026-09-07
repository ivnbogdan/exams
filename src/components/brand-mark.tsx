/**
 * The exams.ro mark, redrawn from the 2011 banner: three solid discs (teal, green, orange) that
 * bleed off the corners, each with a dark arrow cut into it pointing at the wordmark. Inline SVG,
 * so it stays crisp at any size. Wordmark uses the pixel-style font loaded in the root layout.
 */

// Arrow pointing right, centred on the disc. Sized for r = 40; the tail runs past the disc edge so
// it reads as a cut, exactly like the original.
const ARROW = "M-46 -9 H0 V-26 L34 0 L0 26 V9 H-46 Z";

function Disc({ cx, cy, r, fill, angle }: { cx: number; cy: number; r: number; fill: string; angle: number }) {
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <circle r={r} fill={fill} />
      <g transform={`rotate(${angle}) scale(${r / 40})`}>
        <path d={ARROW} fill="#202020" />
      </g>
    </g>
  );
}

const FONT = "var(--font-mark), 'Silkscreen', ui-monospace, monospace";

export function BrandMark({ className, title = "exams.ro" }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 250 122" role="img" aria-label={title} className={className}>
      <defs>
        <clipPath id="mark-clip">
          <rect width="250" height="122" rx="16" />
        </clipPath>
      </defs>
      <rect width="250" height="122" rx="16" fill="#202020" />
      <g clipPath="url(#mark-clip)">
        <Disc cx={20} cy={20} r={27} fill="#24909d" angle={45} />
        <Disc cx={44} cy={106} r={42} fill="#6ab824" angle={-45} />
        <Disc cx={234} cy={102} r={40} fill="#ed9d13" angle={-135} />
      </g>
      <text
        x="130"
        y="62"
        textAnchor="middle"
        fontFamily={FONT}
        fontWeight="700"
        fontSize="36"
        letterSpacing="-2"
        fill="#ffffff"
        stroke="#202020"
        strokeWidth="3"
        strokeLinejoin="round"
        paintOrder="stroke"
      >
        EXAMS
      </text>
      <text
        x="186"
        y="98"
        textAnchor="end"
        fontFamily={FONT}
        fontWeight="700"
        fontSize="22"
        letterSpacing="-1"
        fill="#ffffff"
        stroke="#202020"
        strokeWidth="3"
        strokeLinejoin="round"
        paintOrder="stroke"
      >
        .RO
      </text>
    </svg>
  );
}
