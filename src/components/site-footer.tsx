export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-black/10 py-8 text-sm text-black/60">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4">
        <p>exams.ro · arhiva subiectelor de examen, Automatică și Calculatoare · 2011 – {new Date().getFullYear()}</p>
        <a href="https://github.com/ivnbogdan/exams" className="hover:text-ink" rel="noopener">
          cod sursă
        </a>
      </div>
    </footer>
  );
}
