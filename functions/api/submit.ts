export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const form = await request.formData();
  const data = Object.fromEntries(form);
  const key = `lead:${Date.now()}`;

  await env.LEADS.put(key, JSON.stringify(data));

  return new Response("✅ Lead stored successfully", { status: 200 });
};
