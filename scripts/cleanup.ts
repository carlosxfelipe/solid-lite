// Cleanup Script: replaces the demo `src/` with the clean `template/` starter.
//
// Usage:
//   deno task cleanup           # asks for confirmation
//   deno task cleanup --yes     # skips confirmation (for CI / scripts)
//
// After running, the `template/` folder is removed (this is a one-shot op).
import { copy, exists } from "@std/fs";

const TEMPLATE_DIR = "template";
const SRC_DIR = "src";

const args = new Set(Deno.args);
const autoYes = args.has("--yes") || args.has("-y");

async function confirmOrExit(): Promise<void> {
  if (autoYes) return;

  const prompt =
    `⚠️  This will REPLACE the current \`${SRC_DIR}/\` directory with the\n` +
    `   contents of \`${TEMPLATE_DIR}/\` and then DELETE \`${TEMPLATE_DIR}/\`.\n` +
    `   This action is destructive and cannot be undone.\n\n` +
    `   Continue? [y/N] `;

  await Deno.stdout.write(new TextEncoder().encode(prompt));

  const buf = new Uint8Array(8);
  const n = await Deno.stdin.read(buf);
  const answer = new TextDecoder()
    .decode(buf.subarray(0, n ?? 0))
    .trim()
    .toLowerCase();

  if (answer !== "y" && answer !== "yes") {
    console.log("❌ Cleanup aborted.");
    Deno.exit(1);
  }
}

async function main(): Promise<void> {
  if (!(await exists(TEMPLATE_DIR))) {
    console.error(
      `❌ \`${TEMPLATE_DIR}/\` not found. Nothing to do.\n` +
        `   (If the project was already cleaned up, this is expected.)`,
    );
    Deno.exit(1);
  }

  await confirmOrExit();

  if (await exists(SRC_DIR)) {
    console.log(`🗑️  Removing existing \`${SRC_DIR}/\`...`);
    await Deno.remove(SRC_DIR, { recursive: true });
  }

  console.log(`📂 Copying \`${TEMPLATE_DIR}/\` → \`${SRC_DIR}/\`...`);
  await copy(TEMPLATE_DIR, SRC_DIR);

  console.log(`🧹 Removing \`${TEMPLATE_DIR}/\`...`);
  await Deno.remove(TEMPLATE_DIR, { recursive: true });

  console.log(
    `\n✅ Cleanup complete. Your project now starts from a clean slate.\n` +
      `   Run \`deno task dev\` to start developing.`,
  );
}

await main();
