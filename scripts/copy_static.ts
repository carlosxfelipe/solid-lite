// Script para copiar arquivos estáticos da pasta public/ para dist/
try {
  await Deno.mkdir("dist", { recursive: true });

  // Arquivos para copiar da pasta public
  const publicFiles = [
    "_redirects",
    "favicon.svg",
  ];

  // Arquivos para copiar da pasta src/styles
  const styleFiles = [
    "base.css",
    "layout.css",
    "app.css",
  ];

  for (const file of publicFiles) {
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

  const styleDistDir = "dist/styles";
  await Deno.mkdir(styleDistDir, { recursive: true });

  for (const file of styleFiles) {
    try {
      await Deno.copyFile(`src/styles/${file}`, `${styleDistDir}/${file}`);
      console.log(`✅ Copiado: src/styles/${file} → ${styleDistDir}/${file}`);
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) {
        console.log(`⚠️  ${file} não encontrado em src/styles/`);
      } else {
        console.error(`❌ Erro ao copiar ${file}:`, err);
      }
    }
  }
} catch (err) {
  console.error("❌ Erro ao criar pasta dist:", err);
}
