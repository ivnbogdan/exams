"use client";

import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

export interface GalleryImage {
  src: string;
  thumb: string;
  width: number | null;
  height: number | null;
  alt: string;
  name: string;
}

export function Gallery({ images }: { images: GalleryImage[] }) {
  const [index, setIndex] = useState(-1);
  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {images.map((img, i) => (
          <li key={img.src}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              className="block w-full overflow-hidden rounded-lg border border-black/10 bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal"
              aria-label={`Deschide ${img.name}`}
            >
              <img
                src={img.thumb}
                alt={img.alt}
                width={img.width ?? undefined}
                height={img.height ?? undefined}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover"
              />
            </button>
          </li>
        ))}
      </ul>
      <Lightbox
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
        slides={images.map((img) => ({ src: img.src, alt: img.alt, width: img.width ?? undefined, height: img.height ?? undefined }))}
        plugins={[Zoom]}
        zoom={{ maxZoomPixelRatio: 3 }}
      />
    </>
  );
}
