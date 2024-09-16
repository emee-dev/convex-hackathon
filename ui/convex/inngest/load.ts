import { GoogleGenerativeAI } from "@google/generative-ai";
import { v } from "convex/values";
import { internal } from ".././_generated/api";
import { action, internalMutation } from ".././_generated/server";

const GEMINI_MODEL_NAME = "text-embedding-004";
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export const generateEmbedding = action({
  args: {
    fileName: v.string(),
    descriptionQuery: v.string(),
  },
  handler: async (ctx, { fileName, descriptionQuery }) => {
    const embedding = await embed(descriptionQuery);

    let data = await ctx.runMutation(internal.inngest.load.insertEmbeddings, {
      fileName,
      embedding: embedding,
      descriptionQuery,
    });

    console.log("data", data);
  },
});

export const insertEmbeddings = internalMutation({
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

export async function embed(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL_NAME });

  const result = await model.embedContent(text);
  const embedding = result.embedding;

  console.log(
    `Computed embedding of "${text}": ${embedding.values.length} dimensions`
  );

  return embedding.values;
}
