"use client";

import { cn } from "cn";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Link do cabeçalho que marca a página atual com `aria-current` e um traço âmbar. */
export function LinkNav({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const atual = usePathname() === href;

  return (
    <Link
      href={href}
      aria-current={atual ? "page" : undefined}
      className={cn(
        "hover:text-foreground relative py-1 transition-colors",
        "aria-[current=page]:text-foreground aria-[current=page]:after:bg-primary aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-0 aria-[current=page]:after:-bottom-0.5 aria-[current=page]:after:h-0.5 aria-[current=page]:after:rounded-full",
        className,
      )}
    >
      {children}
    </Link>
  );
}
