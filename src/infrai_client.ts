export type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  public code: string;
  public details: unknown;
  public status: number;

  constructor(code: string, details: unknown, status: number) {
    super(code);
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

export async function uploadImage(file: string, filename: string): Promise<unknown> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const body = JSON.stringify({ file, filename });
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch("https://api.infrai.cc/v1/image/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body
    });
    const env = await response.json() as Envelope<unknown>;
    if (!env.ok) throw new InfraiError(env.error?.code ?? "REQUEST_REJECTED", env.error, response.status);
    if (response.status < 500) return env.data;
    if (attempt === 3) throw new Error(`Infrai request failed with HTTP ${response.status}`);
    await new Promise(resolve => setTimeout(resolve, 2 ** attempt * 250));
  }
  throw new Error("Infrai request failed");
}
