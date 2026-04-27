import { serveDir, serveFile } from "@std/http/file-server";
import { bold, cyan, green, red, yellow } from "@std/fmt/colors";
import { debounce } from "@std/async/debounce";

import { PORT } from "./config.ts";
const IS_DEV = Deno.args.includes("--dev");
const clients = new Set<ReadableStreamDefaultController>();

// Watcher logic: Rebuild and notify browser
if (IS_DEV) {
  const rebuild = debounce(async () => {
    console.log(`  ${yellow("↻")}  Change detected, rebuilding...`);
    const cmd = new Deno.Command("deno", { args: ["task", "build"] });
    const { success, stderr } = await cmd.output();
    if (success) {
      console.log(`  ${green("✓")}  Build complete. Reloading browser...`);
      for (const ctrl of clients) {
        try {
          ctrl.enqueue("data: reload\n\n");
        } catch {
          clients.delete(ctrl);
        }
      }
    } else {
      const errorMsg = new TextDecoder().decode(stderr);
      console.error(`  ${red("❌")}  Build failed:\n\n${errorMsg}`);
    }
  }, 200);

  // Auto trigger initial build if dist doesn't exist or is empty
  try {
    const dir = [...Deno.readDirSync("dist")];
    if (dir.length === 0) throw new Error();
  } catch {
    rebuild();
  }

  (async () => {
    const watcher = Deno.watchFs(["src", "solid"], { recursive: true });
    for await (const _ of watcher) rebuild();
  })();
}

const LIVERELOAD_SCRIPT = `
<script>
  new EventSource("/livereload").onmessage = () => location.reload();
</script>
`;

const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);

  // SSE Hot Reload Endpoint
  if (IS_DEV && url.pathname === "/livereload") {
    let controller: ReadableStreamDefaultController;
    const stream = new ReadableStream({
      start(c) {
        controller = c;
        clients.add(c);
        c.enqueue(": connected\n\n");
      },
      cancel() {
        clients.delete(controller);
      },
    }).pipeThrough(new TextEncoderStream());

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  }

  // Serve static assets
  const res = await serveDir(req, { fsRoot: "dist", quiet: true });

  // Inject script for HTML files in Dev mode
  if (
    IS_DEV && res.ok && res.headers.get("content-type")?.includes("text/html")
  ) {
    const text = await res.text();
    // Re-create headers to clear content-length which is now incorrect
    const headers = new Headers(res.headers);
    headers.delete("content-length");
    return new Response(
      text.replace("</body>", `${LIVERELOAD_SCRIPT}</body>`),
      {
        status: res.status,
        headers,
      },
    );
  }

  // If the request was successfully served, return the response
  if (res.status !== 404) return res;

  // SPA fallback logic
  const isGet = req.method === "GET" || req.method === "HEAD";
  const acceptsHtml = req.headers.get("accept")?.includes("text/html");
  const looksLikeSpaRoute = !url.pathname.includes("."); // e.g. /about, /contact, not /file.js

  // If it’s a navigation request (no extension and expecting HTML),
  // serve index.html so the SPA router can handle the route.
  if (isGet && (acceptsHtml || looksLikeSpaRoute)) {
    try {
      const fileRes = await serveFile(req, "dist/index.html");
      if (IS_DEV && fileRes.ok) {
        const text = await fileRes.text();
        const headers = new Headers(fileRes.headers);
        headers.delete("content-length");
        return new Response(
          text.replace("</body>", `${LIVERELOAD_SCRIPT}</body>`),
          {
            status: fileRes.status,
            headers,
          },
        );
      }
      return fileRes;
    } catch {
      return new Response("dist/index.html not found", { status: 500 });
    }
  }

  // Otherwise, return the original 404 (for API calls, assets, etc.)
  return res;
};

Deno.serve({
  port: PORT,
  onListen({ port, hostname }) {
    const host = hostname === "0.0.0.0" ? "localhost" : hostname;
    console.log(
      `\n  ${green("➜")}  ${bold("Local:")}   ${
        cyan(`http://${host}:${port}/`)
      }`,
    );
    if (IS_DEV) {
      console.log(
        `  ${green("➜")}  ${bold("Mode:")}    ${
          yellow("development (hot reload)")
        }\n`,
      );
    } else {
      console.log("");
    }
  },
}, handler);
