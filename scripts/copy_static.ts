// Script para copiar arquivos estáticos da pasta public/ para dist/
try {
  await Deno.mkdir("dist", { recursive: true });

  // Arquivos para copiar da pasta public
  const filesToCopy = [
    "_redirects",
    "favicon.svg",
    "base.css",
    "layout.css",
    "app.css",
  ];

  for (const file of filesToCopy) {
    try {
      await Deno.copyFile(`public/${file}`, `dist/${file}`);
      console.log(`✅ Copiado: public/${file} → dist/${file}`);
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) {
        console.log(`⚠️  ${file} não encontrado em public/`);
      } else {
        console.error(`❌ Erro ao copiar ${file}:`, err);
      }
    }
  }
} catch (err) {
  console.error("❌ Erro ao criar pasta dist:", err);
}
