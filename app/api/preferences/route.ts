const privateHeaders = { "Cache-Control": "private, no-store" };

// Cloudflare Workers does not provide an authenticated user identity by
// default. Preferences therefore remain safely stored in the browser until a
// real authentication provider is configured.
export async function GET() {
  return Response.json({ signedIn: false }, { headers: privateHeaders });
}

export async function PUT() {
  return Response.json(
    { signedIn: false, saved: false },
    { headers: privateHeaders },
  );
}
