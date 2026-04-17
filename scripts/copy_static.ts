// Build Preparation Script: Dynamically copies static assets and styles to dist/
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

  // Dynamically copy all .css files from src/styles
  const styleSourceDir = "src/styles";
  const styleDistDir = "dist/styles";
  await Deno.mkdir(styleDistDir, { recursive: true });

  for await (const entry of Deno.readDir(styleSourceDir)) {
    if (entry.isFile && entry.name.endsWith(".css")) {
      try {
        await Deno.copyFile(
          `${styleSourceDir}/${entry.name}`,
          `${styleDistDir}/${entry.name}`,
        );
        console.log(
          `✅ Copied: ${styleSourceDir}/${entry.name} → ${styleDistDir}/${entry.name}`,
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
  const fixedContent = indexContent.replace(/src="\.\/index-/g, 'src="/index-');
  await Deno.writeTextFile(indexPath, fixedContent);
  console.log("✅ Fixed: dist/index.html paths for deep routing");
} catch (err) {
  console.error("❌ Failed to post-process index.html:", err);
}

console.log("\n✨ Dist folder preparation complete!\n");
