"use client";

import { Menu } from "@base-ui/react/menu";
import { cn } from "cn";
import { ChevronDown } from "lucide-react";
import Link from "next/link";

import { sair } from "@/features/auth/actions";

const estiloItem =
  "flex w-full cursor-default items-center rounded-md px-3 py-2 text-left text-sm outline-none select-none data-highlighted:bg-muted data-highlighted:text-foreground";

/** Botão com a inicial do nome que abre Perfil, Sobre e Sair (e a navegação, no celular). */
export function MenuUsuario({ nome, email }: { nome: string; email: string }) {
  const inicial = (nome.trim()[0] ?? email[0] ?? "?").toUpperCase();

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label="Menu do usuário"
        className="hover:bg-muted data-popup-open:bg-muted focus-visible:ring-ring/50 flex items-center gap-2 rounded-full py-1 pr-2 pl-1 outline-none focus-visible:ring-3"
      >
        <span
          aria-hidden="true"
          className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-full text-sm font-bold"
        >
          {inicial}
        </span>
        <span className="text-foreground hidden max-w-40 truncate text-sm sm:inline">{nome}</span>
        <ChevronDown className="text-muted-foreground size-4" aria-hidden="true" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={8} align="end" className="z-50 outline-none">
          <Menu.Popup className="bg-popover text-popover-foreground border-border w-64 origin-[var(--transform-origin)] rounded-xl border p-1.5 shadow-xl shadow-black/40 transition-[scale,opacity] duration-100 outline-none data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            <div className="flex items-center gap-3 px-3 py-2.5">
              <span
                aria-hidden="true"
                className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-full font-bold"
              >
                {inicial}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{nome}</p>
                <p className="text-muted-foreground truncate text-xs">{email}</p>
              </div>
            </div>
            <Menu.Separator className="bg-border mx-1 my-1 h-px" />
            <Menu.LinkItem
              closeOnClick
              render={<Link href="/dashboard" />}
              className={cn(estiloItem, "sm:hidden")}
            >
              Início
            </Menu.LinkItem>
            <Menu.LinkItem
              closeOnClick
              render={<Link href="/listas" />}
              className={cn(estiloItem, "sm:hidden")}
            >
              Minhas listas
            </Menu.LinkItem>
            <Menu.LinkItem closeOnClick render={<Link href="/perfil" />} className={estiloItem}>
              Perfil
            </Menu.LinkItem>
            <Menu.LinkItem closeOnClick render={<Link href="/sobre" />} className={estiloItem}>
              Sobre
            </Menu.LinkItem>
            <Menu.Separator className="bg-border mx-1 my-1 h-px" />
            <form action={sair}>
              <Menu.Item
                render={<button type="submit" />}
                nativeButton
                closeOnClick={false}
                className={estiloItem}
              >
                Sair
              </Menu.Item>
            </form>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
