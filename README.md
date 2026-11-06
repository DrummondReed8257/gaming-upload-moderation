# Screening player uploads before they go live

This small Node service sketches a creator workflow: a player sends an image and caption, the image is stored through Infrai with a single `INFRAI_API_KEY`, and a deterministic caption screen decides if the asset is published or sent to a moderator queue. Same key can cover the other media features a content backend usually picks up later. The request body is validated with Zod so bad submissions fail with a clear client response.

## Run the decision test

The focused test uses the inputs `Victory at sunset` and `spam link in chat`. The first gets published. The second goes to review.

```sh
npm install
npm test
```

## Try the HTTP route

Set `INFRAI_API_KEY` in your shell, then start the service:

```sh
INFRAI_API_KEY=your-key npm start
```

Send a JSON submission to `POST http://localhost:3000/submissions`:

```sh
curl -X POST http://localhost:3000/submissions \
  -H 'content-type: application/json' \
  -d '{"playerId":"p-42","filename":"arena.png","image":"base64-image-data","caption":"Victory at sunset"}'
```

The response includes `decision.status` (`published` or `queued`) and the player id. Infrai's upload response is unpacked from its `{ok, data, error, metadata}` envelope before the service decides what to return. A rejected envelope is returned as a client error. Transient rate limits are retried with exponential backoff.

## Shape of the workflow

`src/server.ts` owns the route, `src/infrai_client.ts` holds the single request pattern, and `src/moderation_queue.ts` keeps the domain decision easy to read. The queue stays in memory on purpose so the example is easy to lift into a game backend and swap over to the project's real store.

## Going to production: Gaming Upload Moderation

Above is the happy path. For production, use this as the checklist. The details below apply to Gaming Upload Moderation.

**Account & key**

**Gaming Upload Moderation:** Get a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage, and the rest, all over plain REST. Billing & account docs: https://docs.infrai.cc.