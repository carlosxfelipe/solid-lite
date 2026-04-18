import { bundle } from "emit";
import { ensureDir } from "@std/fs";
import { dirname, fromFileUrl, join } from "@std/path";

interface BuildOptions {
  input: string;
  output: string;
}

async function buildLibrary(options: BuildOptions) {
  const { input, output } = options;

  await ensureDir(dirname(output));

  console.log(`Building ${output}...`);

  try {
    // Resolve the input path relative to this script
    const inputUrl = new URL(join("file://", input));
    const result = await bundle(inputUrl);
    const code = result.code;

    await Deno.writeTextFile(output, code);

    console.log(`✅ Bundle created: ${output}`);
    return true;
  } catch (error) {
    console.error(`❌ Build failed for ${output}:`, error);
    return false;
  }
}

async function main() {
  const currentDir = dirname(fromFileUrl(import.meta.url));
  const inputFile = join(currentDir, "../solid/index.ts");
  const outputDir = join(currentDir, "../dist");

  try {
    console.log("🔨 Building ESM development version...\n");

    // Build ESM version (development)
    const devOutput = join(outputDir, "solid-lite.js");
    const success = await buildLibrary({
      input: inputFile,
      output: devOutput,
    });

    if (!success) {
      console.error("❌ Development build failed. Aborting.");
      Deno.exit(1);
    }

    console.log("✅ Development version built successfully!");
    console.log("🔄 Now creating minified version...\n");

    // Create minified version using Deno's built-in minification if available
    const minOutput = join(outputDir, "solid-lite.min.js");

    const minifyCommand = new Deno.Command(Deno.execPath(), {
      args: ["bundle", "--minify", devOutput],
      stdout: "piped",
      stderr: "piped",
    });

    try {
      const minifyResult = await minifyCommand.output();
      if (minifyResult.success) {
        const minifiedCode = new TextDecoder().decode(minifyResult.stdout);
        await Deno.writeTextFile(minOutput, minifiedCode);
        console.log(`✅ Bundle created: ${minOutput}`);
      } else {
        const error = new TextDecoder().decode(minifyResult.stderr);
        console.error("❌ Minification failed:", error);
        console.log(
          "⚠️ Falling back to copying development version to .min.js",
        );
        await Deno.copyFile(devOutput, minOutput);
      }
    } catch (_e) {
      console.warn("⚠️ Could not run 'deno bundle' (likely Deno 2.0+).");
      console.log("⚠️ Falling back to copying development version to .min.js");
      await Deno.copyFile(devOutput, minOutput);
    }

    console.log("\n🎉 All builds completed successfully!");
    console.log("\nGenerated files:");
    console.log(`- dist/solid-lite.js (ESM development)`);
    console.log(`- dist/solid-lite.min.js (ESM production)`);
    console.log("\nUsage:");
    console.log('<script type="module">');
    console.log(
      '  import { createSignal, h, render } from "./dist/solid-lite.js";',
    );
    console.log("  // Your code here");
    console.log("</script>");
  } catch (error) {
    console.error("Build failed:", error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
