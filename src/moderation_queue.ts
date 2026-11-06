import { z } from "zod";

export const uploadSubmission = z.object({
  playerId: z.string().min(1),
  filename: z.string().min(1),
  image: z.string().min(1),
  caption: z.string().max(240)
});

export type Submission = z.infer<typeof uploadSubmission>;
export type Decision = { status: "published" | "queued"; reason: string };

const blocked = /\b(spam|scam|hate|slur)\b/i;

export function decideCaption(caption: string): Decision {
  return blocked.test(caption)
    ? { status: "queued", reason: "caption needs moderator review" }
    : { status: "published", reason: "caption passed the first screen" };
}

export class ModerationQueue {
  private readonly items: Array<Submission & { decision: Decision; asset?: unknown }> = [];
  add(submission: Submission, asset?: unknown) {
    const decision = decideCaption(submission.caption);
    const item = { ...submission, decision, asset };
    if (decision.status === "queued") this.items.push(item);
    return item;
  }
  pending() { return [...this.items]; }
}
