import path from "node:path";

const server = Bun.serve({
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return new Response(Bun.file("index.html"));
    }

    const assetPath = path.join("public", url.pathname.slice(1));
    const asset = Bun.file(assetPath);

    if (await asset.exists()) {
      return new Response(asset);
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Listening on ${server.url}`);
