import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Em dev, o Next só serve o JS do cliente para `localhost`; o Supabase local usa 127.0.0.1.
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    // Nos testes E2E os pôsteres são falsos: sem otimizar, o navegador busca direto e o
    // servidor não fica preso tentando baixar centenas de imagens inexistentes.
    unoptimized: process.env.IMAGENS_SEM_OTIMIZACAO === "1",
    remotePatterns: [
      new URL("https://image.tmdb.org/t/p/**"),
      // Miniatura do trailer no YouTube.
      new URL("https://i.ytimg.com/vi/**"),
    ],
  },
};

export default nextConfig;
