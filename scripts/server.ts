import { serveDir, serveFile } from "@std/http/file-server";

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // Try serving a static asset first (CSS, JS, images, etc.)
  const res = await serveDir(req, {
    fsRoot: "dist",
    quiet: true, // optional: suppress directory logs
  });

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
      return await serveFile(req, "dist/index.html");
    } catch {
      return new Response("dist/index.html not found", { status: 500 });
    }
  }

  // Otherwise, return the original 404 (for API calls, assets, etc.)
  return res;
});
