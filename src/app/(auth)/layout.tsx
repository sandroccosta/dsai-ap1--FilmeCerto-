export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <section className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="border-border/60 bg-card w-full max-w-sm rounded-xl border p-6 shadow-sm sm:p-8">
        {children}
      </div>
    </section>
  );
}
