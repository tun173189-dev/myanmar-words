export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    if (url.pathname !== "/" && url.pathname !== "/tts") {
      return new Response("Not found", { status: 404, headers: corsHeaders() });
    }

    const text = (url.searchParams.get("text") || "").trim();
    if (!text) {
      return new Response("Missing text", { status: 400, headers: corsHeaders() });
    }

    if (text.length > 240) {
      return new Response("Text too long", { status: 413, headers: corsHeaders() });
    }

    const ttsUrl = new URL("https://translate.google.com/translate_tts");
    ttsUrl.searchParams.set("ie", "UTF-8");
    ttsUrl.searchParams.set("client", "tw-ob");
    ttsUrl.searchParams.set("tl", "my");
    ttsUrl.searchParams.set("q", text);

    const upstream = await fetch(ttsUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36",
        "Accept": "audio/mpeg,audio/*,*/*",
        "Referer": "https://translate.google.com/"
      }
    });

    if (!upstream.ok) {
      return new Response("TTS failed", { status: 502, headers: corsHeaders() });
    }

    const headers = corsHeaders();
    headers.set("Content-Type", upstream.headers.get("Content-Type") || "audio/mpeg");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new Response(upstream.body, { status: 200, headers });
  }
};

function corsHeaders() {
  return new Headers({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Range",
    "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges"
  });
}
