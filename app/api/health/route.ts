export async function GET() {
  return Response.json({ ok: true, service: "apex-motorsport-calendar", time: new Date().toISOString() }, {
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}
