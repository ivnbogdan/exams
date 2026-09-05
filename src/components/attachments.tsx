import type { Attachment } from "@/db/schema";
import { Gallery } from "@/components/gallery";
import { fileUrl } from "@/lib/env";
import { KIND_LABEL, formatBytes } from "@/lib/format";

export function Attachments({ attachments, subjectLabel }: { attachments: Attachment[]; subjectLabel: string }) {
  const images = attachments.filter((a) => a.kind === "image" && a.webKey && a.thumbKey);
  const files = attachments.filter((a) => !images.includes(a));
  if (attachments.length === 0) return null;
  return (
    <section className="mt-8 space-y-6" aria-label="Fișiere atașate">
      {images.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/60">
            {images.length === 1 ? "Imagine" : `${images.length} imagini`}
          </h2>
          <Gallery
            images={images.map((a, i) => ({
              src: fileUrl(a.webKey as string),
              thumb: fileUrl(a.thumbKey as string),
              width: a.width,
              height: a.height,
              alt: `${subjectLabel}, imaginea ${i + 1}`,
              name: a.originalName,
            }))}
          />
        </div>
      )}
      {files.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/60">
            {files.length === 1 ? "Fișier" : `${files.length} fișiere`}
          </h2>
          <ul className="divide-y divide-black/10 rounded-xl border border-black/10 bg-white">
            {files.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                <span className="rounded bg-black/5 px-2 py-0.5 text-xs uppercase text-black/60">{KIND_LABEL[a.kind]}</span>
                <a href={fileUrl(a.storageKey)} className="min-w-0 flex-1 truncate font-medium text-brand-teal hover:underline" rel="noopener">
                  {a.originalName}
                </a>
                <span className="shrink-0 text-xs text-black/50">{formatBytes(a.size)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
