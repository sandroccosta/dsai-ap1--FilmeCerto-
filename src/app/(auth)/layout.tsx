import Image from "next/image";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <section className="relative isolate flex flex-1 items-center justify-center overflow-hidden px-4 py-16">
      {/* A sala da página inicial ao fundo, desfocada, para o formulário ficar em primeiro plano. */}
      <Image
        src="/sala-escura.webp"
        alt=""
        fill
        sizes="100vw"
        className="-z-20 scale-110 object-cover opacity-20 blur-md"
      />
      <div className="from-background/40 to-background absolute inset-0 -z-10 bg-gradient-to-b" />
      <div className="border-border bg-card/90 w-full max-w-sm rounded-2xl border p-6 shadow-2xl shadow-black/50 backdrop-blur-sm sm:p-8">
        {children}
      </div>
    </section>
  );
}
