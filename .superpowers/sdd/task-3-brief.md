### Task 3: Spotify Serverless Token

**Files:**
- Create: `api/spotify-token.ts`

**Interfaces:**
- Produces: `GET /api/spotify-token` → `{ access_token: string, expires_in: number }`

- [ ] **Step 1: Create the serverless function**

Create `api/spotify-token.ts`:

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Spotify credentials not configured' });
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const detail = await response.text();
    return res.status(502).json({ error: 'Spotify token request failed', detail });
  }

  const data = await response.json() as { access_token: string; expires_in: number };

  // Spotify tokens live 3600s — cache for 3500s so Vercel's CDN serves stale-safe tokens
  res.setHeader('Cache-Control', 's-maxage=3500, stale-while-revalidate');
  return res.status(200).json({ access_token: data.access_token, expires_in: data.expires_in });
}
```

- [ ] **Step 2: Test the endpoint locally**

```bash
vercel dev
```

Open `http://localhost:3000/api/spotify-token` in a browser.

Expected JSON response:
```json
{ "access_token": "BQD...", "expires_in": 3600 }
```

If you see `{ "error": "Spotify credentials not configured" }`, confirm `.env.local` has valid values and is at project root.

- [ ] **Step 3: Commit**

```bash
git add api/spotify-token.ts
git commit -m "feat: add Spotify client credentials serverless token endpoint"
```

---

