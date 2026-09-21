// Streaming LLM client for the terminal `ask` command. OpenAI-compatible endpoint.
import { useSettings } from "../../store/useSettingsStore";

export async function askAI(query: string, onChunk: (s: string) => void): Promise<string> {
  const key = useSettings.getState().aiKey;
  if (!key) throw new Error("NO_KEY");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: "gpt-4o-mini", stream: true, max_tokens: 300, messages: [{ role: "user", content: query }] }),
  });
  if (!res.ok || !res.body) throw new Error("HTTP " + res.status);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "", full = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n"); buf = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") continue;
      try {
        const d = JSON.parse(data);
        const delta = d.choices?.[0]?.delta?.content || "";
        if (delta) { full += delta; onChunk(delta); }
      } catch { /* partial */ }
    }
  }
  return full;
}
