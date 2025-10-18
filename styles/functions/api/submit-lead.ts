export const onRequestPost: PagesFunction<{ LEADS: KVNamespace }> = async (context) => {
  const { request, env } = context;
  const form = await request.formData();
  const payload: Record<string, string> = {};
  form.forEach((v, k) => (payload[k] = String(v)));

  const required = ["name", "email", "phone", "address", "zip"];
  for (const f of required) {
    if (!payload[f]) return new Response(JSON.stringify({ error: `Missing ${f}` }), { status: 400 });
  }

  const ts = new Date().toISOString();
  const key = `lead:${payload.zip}:${ts}`;
  await env.LEADS.put(key, JSON.stringify(payload), { expirationTtl: 60 * 60 * 24 * 365 });

  return new Response(JSON.stringify({ ok: true, received: ts }), {
    headers: { "content-type": "application/json" },
  });
};
