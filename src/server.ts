import { createServer } from "node:http";
import { uploadImage, InfraiError } from "./infrai_client.ts";
import { ModerationQueue, uploadSubmission } from "./moderation_queue.ts";

const queue = new ModerationQueue();
const server = createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/submissions") { res.writeHead(404).end(); return; }
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const parsed = uploadSubmission.safeParse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    if (!parsed.success) { res.writeHead(400, { "Content-Type": "application/json" }).end(JSON.stringify({ error: "invalid submission" })); return; }
    const asset = await uploadImage(parsed.data.image, parsed.data.filename);
    const result = queue.add(parsed.data, asset);
    res.writeHead(result.decision.status === "queued" ? 202 : 200, { "Content-Type": "application/json" }).end(JSON.stringify({ decision: result.decision, playerId: result.playerId }));
  } catch (error) {
    const status = error instanceof InfraiError && error.status < 500 ? 422 : 502;
    res.writeHead(status, { "Content-Type": "application/json" }).end(JSON.stringify({ error: error instanceof Error ? error.message : "request failed" }));
  }
});

server.listen(Number(process.env.PORT ?? 3000), () => console.log("moderation service listening"));
