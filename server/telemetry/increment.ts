// Vercel serverless function: increments the boot counter in Vercel KV (Upstash Redis).
// Env vars required: KV_REST_API_URL, KV_REST_API_TOKEN (auto-set when binding Vercel KV).
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const base = process.env.KV_REST_API_URL, token = process.env.KV_REST_API_TOKEN;
  if (!base || !token) return res.status(200).json({ count: null, last: null, configured: false });
  const run = async (cmd: string[]) =>
    fetch(base, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(cmd) }).then((r) => r.json());
  await run(["INCR", "boots"]);
  await run(["SET", "lastBoot", String(Date.now())]);
  const [count, last] = await Promise.all([run(["GET", "boots"]), run(["GET", "lastBoot"])]);
  return res.status(200).json({ count: Number(count.result || 0), last: Number(last.result || 0), configured: true });
}
