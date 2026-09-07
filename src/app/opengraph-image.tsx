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
 * Silkscreen 700 as TrueType from Google Fonts (the renderer cannot read WOFF2). Google picks the
 * format from the user agent, so try agents known to receive TTF. Falls back to the default font
 * if the network is unavailable at build.
 */
const AGENTS = ["curl/8.0", "Mozilla/5.0 (Windows NT 6.1; rv:5.0) Gecko/20100101 Firefox/5.0"];

async function loadFont(): Promise<ArrayBuffer | null> {
  for (const ua of AGENTS) {
    try {
      const css = await fetch("https://fonts.googleapis.com/css2?family=Silkscreen:wght@700", { headers: { "User-Agent": ua } }).then((r) => r.text());
      const url = /url\((https:[^)]+\.ttf)\)/.exec(css)?.[1];
      if (!url) continue;
      const res = await fetch(url);
      if (res.ok) return await res.arrayBuffer();
    } catch {
      // try the next agent
    }
  }
  return null;
}

export default async function OpenGraphImage() {
  const font = await loadFont();
  const family = font ? "Silkscreen" : undefined;
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
          padding: "70px 80px",
        }}
      >
        <img src={DISCS_URI} width={420} height={420} alt="" style={{ borderRadius: 56 }} />
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 72 }}>
          <div style={{ display: "flex", alignItems: "baseline", fontFamily: family, fontWeight: 700, letterSpacing: -2 }}>
            <span style={{ fontSize: 118 }}>EXAMS</span>
            <span style={{ fontSize: 56, marginLeft: 18, color: "#f3b03a" }}>.RO</span>
          </div>
          <div style={{ fontSize: 40, marginTop: 24, color: "rgba(255,255,255,0.8)" }}>Subiectele de examen, la un loc.</div>
          <div style={{ fontSize: 28, marginTop: 14, color: "rgba(255,255,255,0.55)" }}>Automatică și Calculatoare, Politehnica București</div>
        </div>
      </div>
    ),
    { ...size, fonts: font ? [{ name: "Silkscreen", data: font, weight: 700, style: "normal" }] : [] },
  );
}
