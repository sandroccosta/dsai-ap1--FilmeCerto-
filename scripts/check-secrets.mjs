// Garante que segredos do servidor não vazaram para o bundle do navegador.
// Uso: depois de `pnpm build`, rode `pnpm check:secrets` com as mesmas variáveis do build.
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const SECRET_VARIABLES = ["TMDB_READ_TOKEN"];
const STATIC_DIR = ".next/static";

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

const secrets = SECRET_VARIABLES.map((name) => [name, process.env[name]]).filter(
  ([, value]) => value && value.length >= 4,
);

if (secrets.length === 0) {
  console.error(`Defina ${SECRET_VARIABLES.join(", ")} para verificar o build.`);
  process.exit(1);
}

const leaks = [];
for await (const file of walk(STATIC_DIR)) {
  const content = await readFile(file, "utf8");
  for (const [name, value] of secrets) {
    if (content.includes(value)) leaks.push(`${name} encontrado em ${file}`);
  }
}

if (leaks.length > 0) {
  console.error(leaks.join("\n"));
  process.exit(1);
}

console.log(`OK: nenhum segredo (${SECRET_VARIABLES.join(", ")}) em ${STATIC_DIR}.`);
