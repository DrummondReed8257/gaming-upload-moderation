import assert from "node:assert/strict";
import { decideCaption } from "./moderation_queue.ts";

assert.deepEqual(decideCaption("Victory at sunset"), { status: "published", reason: "caption passed the first screen" });
assert.deepEqual(decideCaption("spam link in chat"), { status: "queued", reason: "caption needs moderator review" });
console.log("caption decisions pass");
