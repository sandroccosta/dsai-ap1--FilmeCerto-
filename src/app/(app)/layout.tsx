import { redirect } from "next/navigation";

import { exigirUsuario } from "@/features/auth/sessao";
import { obterPreferencias } from "@/features/preferencias/consultas";

/**
 * Área logada. O proxy já redireciona quem não tem sessão; esta é a checagem
 * definitiva, e também manda para o onboarding quem ainda não o concluiu.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  await exigirUsuario();
  if (!(await obterPreferencias())) redirect("/onboarding");
  return <>{children}</>;
}
