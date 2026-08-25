                                                                           
export const config = { runtime: "edge" };

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const id = (url.searchParams.get("id") || "").trim();
  if (!id) return new Response("Missing id", { status: 400 });
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>Deletion request, ${id}</title>
    <style>body{font-family:system-ui;max-width:640px;margin:48px auto;padding:0 20px;color:#222;line-height:1.55}.code{font-family:ui-monospace,Menlo,monospace;background:#f4f4f5;padding:2px 6px;border-radius:4px;font-size:14px}</style>
    <h1>Deletion request received, ABiL / ABiL MEDiAS</h1>
    <p>Confirmation code: <span class="code">${id.replace(/[<>"']/g, "")}</span></p>
    <p>Your data-deletion request has been received and will be processed within <strong>30 days</strong>, as required by FADP/GDPR and the Meta Platform Terms.</p>
    <p>For updates or questions, email <a href="mailto:info@abil.ch">info@abil.ch</a> quoting the confirmation code above.</p>
    <p><a href="/privacy">Privacy Policy</a> · <a href="/mentions">Legal Notice</a></p>`;
  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
