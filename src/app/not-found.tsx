import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-bold">Pagina nu există</h1>
      <p className="mt-2 text-black/60">Subiectul sau materia nu a fost găsită.</p>
      <Link href="/" className="mt-6 inline-block rounded-md bg-ink px-4 py-2 text-white">
        Înapoi la prima pagină
      </Link>
    </div>
  );
}
