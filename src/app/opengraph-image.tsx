import { ImageResponse } from "next/og";

/** Open Graph image: the three discs of the mark plus the wordmark and tagline. Static, built once. */
export const alt = "exams.ro, subiectele de examen la un loc";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ARROW = "M-46 -9 H0 V-26 L34 0 L0 26 V9 H-46 Z";
const disc = (cx: number, cy: number, r: number, fill: string, angle: number) =>
  `<g transform="translate(${cx} ${cy})"><circle r="${r}" fill="${fill}"/><g transform="rotate(${angle}) scale(${r / 40})"><path d="${ARROW}" fill="#202020"/></g></g>`;
const DISCS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 250"><defs><clipPath id="c"><rect width="250" height="250" rx="34"/></clipPath></defs><rect width="250" height="250" rx="34" fill="#202020"/><g clip-path="url(#c)">${disc(30, 30, 62, "#24909d", 45)}${disc(52, 222, 86, "#6ab824", -45)}${disc(224, 210, 80, "#ed9d13", -135)}</g></svg>`;
const DISCS_URI = `data:image/svg+xml;base64,${Buffer.from(DISCS_SVG).toString("base64")}`;

/**
 * TrueType from Google Fonts (the renderer cannot read WOFF2). Google picks the format from the
 * user agent; a curl agent receives TTF. Returns null when the network is unavailable at build,
 * in which case the renderer's default font is used.
 */
async function loadTtf(family: string, weight: number): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}`, {
      headers: { "User-Agent": "curl/8.0" },
    }).then((r) => r.text());
    const url = /url\((https:[^)]+\.ttf)\)/.exec(css)?.[1];
    if (!url) return null;
    const res = await fetch(url);
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

export default async function OpenGraphImage() {
  const [mark, body, bodyBold] = await Promise.all([loadTtf("Silkscreen", 700), loadTtf("Noto Sans", 400), loadTtf("Noto Sans", 700)]);
  const fonts = [
    ...(body ? [{ name: "Body", data: body, weight: 400 as const, style: "normal" as const }] : []),
    ...(bodyBold ? [{ name: "Body", data: bodyBold, weight: 700 as const, style: "normal" as const }] : []),
    ...(mark ? [{ name: "Mark", data: mark, weight: 700 as const, style: "normal" as const }] : []),
  ];
  const bodyFamily = body ? "Body" : undefined;
  const markFamily = mark ? "Mark" : bodyFamily;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: "#121417",
          color: "#ffffff",
          padding: "60px",
          fontFamily: bodyFamily,
        }}
      >
        <img src={DISCS_URI} width={380} height={380} alt="" />
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 56, width: 644 }}>
          <div style={{ display: "flex", alignItems: "baseline", fontFamily: markFamily, fontWeight: 700 }}>
            <span style={{ fontSize: 92, letterSpacing: -3 }}>EXAMS</span>
            <span style={{ fontSize: 40, marginLeft: 16, color: "#f3b03a" }}>.RO</span>
          </div>
          <div style={{ fontSize: 32, marginTop: 22, fontWeight: 700, color: "rgba(255,255,255,0.88)" }}>Subiectele de examen, la un loc.</div>
          <div style={{ fontSize: 24, marginTop: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.35 }}>
            Automatică și Calculatoare, Politehnica București
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
