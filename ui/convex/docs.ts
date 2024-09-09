import { v } from "convex/values";
import { action, internalMutation, mutation } from "./_generated/server";
import { internal } from "./_generated/api";

export const generateEmbedding = action({
  args: {
    fileName: v.string(),
    descriptionQuery: v.string(),
  },
  handler: async (ctx, { fileName, descriptionQuery }) => {
    // 1. Generate an embedding from you favorite third party API:
    const embedding = await embed(descriptionQuery);

    let data = await ctx.runMutation(internal.docs.insertDocs, {
      fileName,
      embedding: embedding,
      descriptionQuery,
    });

    console.log("data", data);
  },
});

export const insertDocs = internalMutation({
  args: {
    fileName: v.string(),
    embedding: v.array(v.float64()),
    descriptionQuery: v.string(),
  },
  handler: async (ctx, { descriptionQuery, embedding, fileName }) => {
    let data = await ctx.db.insert("docs", {
      body: descriptionQuery,
      embedding,
      fileName,
    });

    return { data: "Data was added." };
  },
});

export const getSimilarDocs = action({
  args: {
    descriptionQuery: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Generate an embedding from you favorite third party API:
    const embedding = await embed(args.descriptionQuery);

    // 2. Then search for similar foods!
    const results = await ctx.vectorSearch("docs", "by_embedding", {
      vector: embedding,
      limit: 16,
      filter: (q) => q.eq("fileName", ".env.local"),
    });

    return { data: results };
  },
});

async function embed(text: string): Promise<number[]> {
  const req = { input: text };

  const resp = await fetch(`${process.env.BACKEND_URL}/api/env/vectors`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req),
  });

  if (!resp.ok) {
    const msg = await resp.text();
    throw new Error(`Vector API error: ${msg}`);
  }

  const json = await resp.json();
  const vector = json.data as number[];

  console.log(`Computed embedding of "${text}": ${vector.length} dimensions`);
  return vector;
}
