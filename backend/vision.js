export async function classifyFoodWithHF({ imageBuffer, topK = 5 }) {
  const token = process.env.HF_API_TOKEN || process.env.HF_TOKEN || "";
  if (!token) return null;

  const model = process.env.HF_FOOD_MODEL || "nateraw/food";
  const url = `https://api-inference.huggingface.co/models/${model}`;

  const controller = new AbortController();
  const timeoutMs = Number(process.env.HF_TIMEOUT_MS || 12000);
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/octet-stream"
      },
      body: imageBuffer,
      signal: controller.signal
    });

    const text = await res.text();
    let json;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      return null;
    }

    if (!res.ok) return null;
    if (!Array.isArray(json)) return null;

    return json
      .map((x) => ({
        label: String(x?.label || "").replaceAll("_", " ").trim(),
        score: Number(x?.score || 0)
      }))
      .filter((x) => x.label)
      .slice(0, topK);
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

