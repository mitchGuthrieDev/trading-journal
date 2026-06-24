/* Cloudflare Pages Function — GET /api/changelog
   Serves the project's recent commit history as JSON, but shields GitHub from
   per-visit traffic: the response is cached at the edge for one hour (Cache API
   + Cache-Control), so GitHub is queried at most ~once/hour per edge location
   regardless of how many people open the changelog. The data still updates
   without a redeploy — it's fetched live, just cached.

   (For a single global "once an hour" refresh, the upgrade path is a Cron-
   Triggered Worker that writes the latest commits into KV; this Cache-API
   version is the Pages-native, zero-config equivalent.) */

const REPO = 'mitchGuthrieDev/blotterbook';
const TTL = 3600; // seconds

export async function onRequest(context) {
  const { request } = context;
  const cache = caches.default;
  const cacheKey = new Request(new URL(request.url).toString(), { method: 'GET' });

  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  let payload, ok = false;
  try {
    const gh = await fetch(`https://api.github.com/repos/${REPO}/commits?per_page=40`, {
      headers: { 'Accept': 'application/vnd.github+json', 'User-Agent': 'blotterbook-changelog' },
      cf: { cacheTtl: TTL, cacheEverything: true }
    });
    if (gh.ok) {
      const data = await gh.json();
      if (Array.isArray(data)) {
        payload = data.map(c => ({
          sha: (c.sha || '').slice(0, 7),
          date: ((c.commit && c.commit.author && c.commit.author.date) || '').slice(0, 10),
          msg: ((c.commit && c.commit.message) || '').split('\n')[0],
          url: c.html_url
        }));
        ok = true;
      }
    }
  } catch (_) { /* fall through to error payload */ }

  const body = JSON.stringify(ok
    ? { ok: true, fetchedAt: new Date().toISOString(), commits: payload }
    : { ok: false, error: 'upstream unavailable' });

  const resp = new Response(body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // edge + browser cache for an hour; stale copy served while revalidating
      'Cache-Control': `public, max-age=${TTL}, s-maxage=${TTL}, stale-while-revalidate=86400`,
      'Access-Control-Allow-Origin': '*'
    }
  });
  // only cache successful responses at the edge
  if (ok) context.waitUntil(cache.put(cacheKey, resp.clone()));
  return resp;
}
