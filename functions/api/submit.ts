export interface Env { LEADS: KVNamespace }

const THANK_YOU = "https://www.marlonrockwood.com/thank-you";

export const onRequestGet: PagesFunction = async () =>
  new Response("OK: POST your form to this endpoint.", { status: 200 });

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    // Try to save if KV is bound; skip silently if it's not.
    if (env && env.LEADS) {
      const ctype = (request.headers.get("content-type") || "").toLowerCase();
      let payload: Record<string, string> = {};

      if (ctype.includes("application/json")) {
        payload = await request.json();
      } else if (ctype.includes("application/x-www-form-urlencoded")) {
        const form = await request.formData();
        form.forEach((v, k) => (payload[k] = String(v)));
      }

      const ts = Date.now();
      const source = payload.source || "site";
      await env.LEADS.put(`lead:${source}:${ts}`, JSON.stringify({
        ...payload,
        ts,
        ua: request.headers.get("user-agent") || "",
        referer: request.headers.get("referer") || ""
      }));
    }

    // Always send users to your thank-you page
    return new Response(null, { status: 303, headers: { Location: THANK_YOU } });
  } catch {
    // On any error, still redirect for a smooth UX
    return new Response(null, { status: 303, headers: { Location: THANK_YOU } });
  }
}; 
