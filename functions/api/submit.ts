export interface Env {
  LEADS: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async () => {
  // Simple health check if someone visits /api/submit in a browser
  return new Response("OK: POST form data to this endpoint.", { status: 200 });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const ctype = (request.headers.get("content-type") || "").toLowerCase();
    let payload: Record<string, string> = {};

    if (ctype.includes("application/json")) {
      payload = await request.json();
    } else if (ctype.includes("application/x-www-form-urlencoded")) {
      const form = await request.formData();
      form.forEach((v, k) => (payload[k] = String(v)));
    } else {
      return new Response("Unsupported content type", { status: 415 });
    }

    // Minimal validation
    const name = (payload.name || "").trim();
    const email = (payload.email || "").trim();
    const phone = (payload.phone || "").trim();

    if (!name || (!email && !phone)) {
      return new Response("Name and (email or phone) required", { status: 400 });
    }

    const ts = Date.now();
    const source = (payload.source || "site").toString();
    const key = `lead:${source}:${ts}`;

    const record = {
      ...payload,
      ts,
      ua: request.headers.get("user-agent") || "",
      referer: request.headers.get("referer") || ""
    };

    await env.LEADS.put(key, JSON.stringify(record));

    // Redirect to Thank You page after save
    return new Response(null, {
      status: 303,
      headers: { Location: "/thank-you.html" }
    });
  } catch (err: any) {
    return new Response(`Error: ${err?.message || "unexpected"}`, { status: 500 });
  }
};
