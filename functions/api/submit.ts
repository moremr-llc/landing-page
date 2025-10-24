export interface Env {
  LEADS: KVNamespace; // KV binding named exactly "LEADS"
}

const THANK_YOU_URL = "https://www.marlonrockwood.com/thank-you";

function nowIso() {
  return new Date().toISOString();
}

function sanitize(s: unknown) {
  return String(s ?? "").trim().slice(0, 5000);
}

export const onRequestGet: PagesFunction = async () => {
  // Simple health check
  return new Response("OK: POST your form to this endpoint.", {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8" }
  });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const ctype = (request.headers.get("content-type") || "").toLowerCase();

    // Accept JSON or x-www-form-urlencoded
    let payload: Record<string, string> = {};
    if (ctype.includes("application/json")) {
      payload = await request.json();
    } else if (ctype.includes("application/x-www-form-urlencoded")) {
      const form = await request.formData();
      form.forEach((v, k) => (payload[k] = String(v)));
    } else {
      // Unsupported content type → still redirect for UX
      return Response.redirect(THANK_YOU_URL, 303);
    }

    // Basic fields (optional/rename as you like in your forms)
    const name = sanitize(payload.name);
    const email = sanitize(payload.email);
    const phone = sanitize(payload.phone);
    const address = sanitize(payload.address);
    const city = sanitize(payload.city);
    const zip = sanitize(payload.zip);
    const leadType = (sanitize(payload.lead_type) || "site").toLowerCase(); // "buyer" | "seller" | "site"
    const source = sanitize(payload.source) || leadType || "site";

    // Honeypot (bots often fill this). Add <input name="website" style="display:none">
    const honey = sanitize(payload.website);
    if (honey) {
      // Bot detected → just redirect, do not store
      return Response.redirect(THANK_YOU_URL, 303);
    }

    // Build record
    const ts = Date.now();
    const id = (globalThis.crypto?.randomUUID?.() ?? `${ts}-${Math.random().toString(36).slice(2)}`);
    const record = {
      id,
      ts,
      ts_iso: nowIso(),
      leadType,
      source,
      name,
      email,
      phone,
      address,
      city,
      zip,
      referer: request.headers.get("referer") || "",
      ua: request.headers.get("user-agent") || "",
      ip: request.headers.get("cf-connecting-ip") || ""
    };

    // Save if KV is bound; otherwise skip silently
    if (env && "LEADS" in env && env.LEADS) {
      const key = `lead:${source}:${ts}:${id}`;
      await env.LEADS.put(key, JSON.stringify(record), { expirationTtl: 60 * 60 * 24 * 365 }); // keep ~1 year
    }

    // Always redirect to Thank You
    return Response.redirect(THANK_YOU_URL, 303);
  } catch {
    // On any error, preserve UX
    return Response.redirect(THANK_YOU_URL, 303);
  }
};
