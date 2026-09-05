/** Turns the old site's user-written HTML into sanitised HTML plus plain text (PLAN 6.5). */
import sanitizeHtml from "sanitize-html";
import { decodeEntities } from "./normalize";

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ["br", "a", "b", "strong", "i", "em", "sub", "sup", "pre"],
  allowedAttributes: { a: ["href"] },
  allowedSchemes: ["http", "https"],
  allowProtocolRelative: false,
  disallowedTagsMode: "discard",
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, rel: "nofollow noopener", target: "_blank" },
    }),
  },
};

export interface Content {
  html: string;
  text: string;
}

export function convertContent(raw: string | null | undefined): Content {
  const withBreaks = (raw ?? "")
    .replace(/\r\n|\r|\n/g, "<br>")
    .replace(/&nbsp;/gi, " ")
    // the old site double-encoded some entities ("&amp;amp;"); collapse one level
    .replace(/&amp;(amp|lt|gt|quot|#\d+);/gi, "&$1;");
  let html = sanitizeHtml(withBreaks, OPTIONS).trim();
  // collapse runs of breaks to at most two, and trim leading/trailing breaks
  html = html
    .replace(/(?:\s*<br\s*\/?>\s*){3,}/gi, "<br><br>")
    .replace(/^(?:<br\s*\/?>\s*)+/i, "")
    .replace(/(?:\s*<br\s*\/?>)+$/i, "")
    .trim();
  const text = decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { html, text };
}
