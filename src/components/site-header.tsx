import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { SearchBox } from "@/components/search/search-box";

const NAV = [
  { href: "/an/1", label: "An I" },
  { href: "/an/2", label: "An II" },
  { href: "/an/3", label: "An III" },
  { href: "/an/4", label: "An IV" },
  { href: "/master", label: "Master" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-black/10 bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link href="/" className="shrink-0" aria-label="exams.ro, prima pagină">
          <BrandMark className="h-10 w-auto" />
        </Link>
        <nav aria-label="Ani de studiu" className="flex flex-wrap gap-1 text-sm font-medium">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-md px-2.5 py-1.5 hover:bg-black/5">
              {n.label}
            </Link>
          ))}
        </nav>
        <SearchBox />
      </div>
    </header>
  );
}
