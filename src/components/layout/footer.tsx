import Image from "next/image";
import Link from "next/link";

import { TMDB_ATTRIBUTION, TMDB_URL } from "./tmdb-attribution";

export function Footer() {
  return (
    <footer className="border-border/60 text-muted-foreground mt-auto border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <a
            href={TMDB_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="The Movie Database (TMDB)"
          >
            <Image src="/tmdb-logo.svg" alt="TMDB" width={92} height={12} />
          </a>
          <p>{TMDB_ATTRIBUTION}</p>
        </div>
        <Link href="/sobre" className="hover:text-foreground transition-colors">
          Créditos e atribuições
        </Link>
      </div>
    </footer>
  );
}
