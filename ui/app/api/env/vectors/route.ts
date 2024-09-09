import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

async function generateVectors(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

  const result = await model.embedContent(text);
  const embedding = result.embedding;

  return embedding.values;
}

export const POST = async (req: Request) => {
  try {
    let body = (await req.json()) as { input: string } | null;

    if (!body || !body.input) {
      return Response.json(
        { message: "Request body is required.", data: null },
        { status: 404 }
      );
    }

    let embeddings = await generateVectors(body.input);

    console.log(
      `Generated embeddings for ${body.input} length: ${embeddings.length}`
    );

    return Response.json({ message: "Vectors generated.", data: embeddings });
  } catch (error: any) {
    console.log(error);

    return Response.json(
      { message: "Vectors generated.", data: null },
      { status: 500 }
    );
  }
};
