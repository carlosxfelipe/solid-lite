// Build Preparation Script: Dynamically copies static assets and styles to dist/
const cssMap: Record<string, string> = {};

try {
  await Deno.mkdir("dist", { recursive: true });

  // Dynamically copy all files from public folder
  const publicSourceDir = "public";
  for await (const entry of Deno.readDir(publicSourceDir)) {
    if (entry.isFile) {
      try {
        await Deno.copyFile(
          `${publicSourceDir}/${entry.name}`,
          `dist/${entry.name}`,
        );
        console.log(
          `✅ Copied: ${publicSourceDir}/${entry.name} → dist/${entry.name}`,
        );
      } catch (err) {
        console.error(`❌ Error copying ${entry.name} from public:`, err);
      }
    }
  }

  // Dynamically copy all .css files from src/styles with Content Hashing
  const styleSourceDir = "src/styles";
  const styleDistDir = "dist/styles";
  await Deno.mkdir(styleDistDir, { recursive: true });

  for await (const entry of Deno.readDir(styleSourceDir)) {
    if (entry.isFile && entry.name.endsWith(".css")) {
      try {
        const content = await Deno.readFile(`${styleSourceDir}/${entry.name}`);
        const hashBuffer = await crypto.subtle.digest("SHA-1", content);
        const hash = Array.from(new Uint8Array(hashBuffer))
          .map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 8);

        const newName = entry.name.replace(".css", `-${hash}.css`);
        cssMap[entry.name] = newName;

        await Deno.writeFile(`${styleDistDir}/${newName}`, content);
        console.log(
          `✅ Copied & Hashed: ${styleSourceDir}/${entry.name} → ${styleDistDir}/${newName}`,
        );
      } catch (err) {
        console.error(`❌ Error copying ${entry.name} from styles:`, err);
      }
    }
  }
} catch (err) {
  console.error("❌ Fatal error in copy script:", err);
}

// Post-process dist/index.html to ensure absolute paths for the bundled JS
try {
  const indexPath = "dist/index.html";
  const indexContent = await Deno.readTextFile(indexPath);
  // Replaces src="./index-HASH.js" with src="/index-HASH.js" to support deep routing
  let fixedContent = indexContent.replace(/src="\.\/index-/g, 'src="/index-');

  // Inject CSS Hashes
  for (const [oldName, newName] of Object.entries(cssMap)) {
    fixedContent = fixedContent.replace(
      new RegExp(`href="/styles/${oldName}"`, "g"),
      `href="/styles/${newName}"`,
    );
  }

  await Deno.writeTextFile(indexPath, fixedContent);
  console.log("✅ Fixed: dist/index.html paths for deep routing");
} catch (err) {
  console.error("❌ Failed to post-process index.html:", err);
}

console.log("\n✨ Dist folder preparation complete!\n");
