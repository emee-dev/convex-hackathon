import { GoogleGenerativeAI } from "@google/generative-ai";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Doc } from "./_generated/dataModel";
import { action, internalMutation, query } from "./_generated/server";
import { embed } from "./inngest/load";

export const searchEmbeddings = action({
  args: {
    fileName: v.string(),
    descriptionQuery: v.string(),
  },
  handler: async (ctx, { fileName, descriptionQuery }) => {
    const embedding = await embed(descriptionQuery);

    // 2. Then search for similar foods!
    const results = await ctx.vectorSearch("docs", "by_embedding", {
      vector: embedding,
      limit: 16,
      filter: (q) => q.eq("fileName", fileName),
    });

    let final = (await ctx.runMutation(internal.docs.resolveDocs, {
      results,
    })) as Doc<"docs">[];

    return final;
  },
});

export const resolveDocs = internalMutation({
  args: {
    results: v.array(
      v.object({
        _id: v.id<"docs">("docs"),
        _score: v.number(),
      })
    ),
  },
  handler: async (ctx, { results }) => {
    return await Promise.all(
      results
        .map(async (item) => {
          let doc = await ctx.db.get(item._id);

          return doc;
        })
        .filter(Boolean)
    );
  },
});

export const searchDocumentByFileName = query({
  args: {
    fileName: v.string(),
  },

  handler: async (ctx, { fileName }) => {
    let doc = await ctx.db
      .query("docs")
      .filter((q) => q.eq(q.field("fileName"), fileName))
      .first();

    if (!doc) {
      return null;
    }

    return { id: doc._id, document: doc.body, createdAt: doc._creationTime };
  },
});
