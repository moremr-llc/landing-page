export interface Env { LEADS: KVNamespace }

const THANK_YOU = "/thank-you"; // ⬅️ relative, not absolute

export const onRequestGet: PagesFunction = async () =>
  new Response("OK: POST your form to this endpoint.", { status: 200 });

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    // ... (parse payload as before)
    if (env && env.LEADS) {
      // save to KV if bound (same code you already had)
    }
    return Response.redirect(THANK_YOU, 303);   // ⬅️ relative redirect
  } catch {
    return Response.redirect(THANK_YOU, 303);
  }
};
