export const onRequestPost: PagesFunction<{ LEADS: KVNamespace }> = async (context) => {
  const { request, env } = context;
  const form = await request.formData();
  const payload: Record<string, string> = {};
  form.forEach((v, k) => (payload[k] = String(v)));

  // Basic validation
  const required = ["name", "email", "phone", "address"];
  for (const f of required) {
    if (!payload[f]) {
      return new Response(JSON.stringify({ error: `Missing ${f}` }), { status: 400 });
    }
  }

  // Save to KV
  const ts = new Date().toISOString();
  const key = `lead:${payload.zip || "nozip"}:${ts}`;
  await env.LEADS.put(key, JSON.stringify(payload), { expirationTtl: 60 * 60 * 24 * 365 });

  if (request.url.includes("redirect=")) {
    const redirectUrl = new URL(request.url).searchParams.get("redirect");
    return Response.redirect(redirectUrl || "/", 302);
  }

  // Default JSON response (if no redirect)
  return new Response(JSON.stringify({ ok: true, received: ts }), {
    headers: { "content-type": "application/json" },
  });
};
