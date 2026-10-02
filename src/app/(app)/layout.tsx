import { exigirUsuario } from "@/features/auth/sessao";

/** Área logada. O proxy já redireciona antes; esta é a checagem definitiva. */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  await exigirUsuario();
  return <>{children}</>;
}
