import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Message as VercelChatMessage, createStreamDataTransformer } from "ai";
import { HttpResponseOutputParser } from "langchain/output_parsers";
import { CharacterTextSplitter } from "langchain/text_splitter";
import { formatDocumentsAsString } from "langchain/util/document";

export const dynamic = "force-dynamic";

/**
 * Basic memory formatter that stringifies and passes
 * message history directly into the model.
 */
const formatMessage = (message: VercelChatMessage) => {
  return `${message.role}: ${message.content}`;
};

const TEMPLATE = `Answer the user's questions based only on the following context. If the answer is not in the context, reply politely that you do not have that information available.:
You are an AI dotenv assistant.

==============================
Context: {context}
==============================
Current conversation: {chat_history}

user: {question}
assistant:`;

type Message = { role: "user" | "assistant"; content: string };
type Body = {
  messages: Message[];
  document: string;
};
export async function POST(req: Request) {
  try {
    // Extract the `messages` from the body of the request
    const { messages, document } = (await req.json()) as Body;

    const formattedPreviousMessages = messages
      .slice(0, -1)
      .map(formatMessage as any);

    const currentMessageContent = messages[messages.length - 1].content;

    const textSplitter = new CharacterTextSplitter();

    const docs = await textSplitter.createDocuments([document]);

    const prompt = PromptTemplate.fromTemplate(TEMPLATE);

    const model = new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
      model: "models/gemini-pro",
      temperature: 0,
      streaming: true,
      // verbose: true,
    });

    /**
     * Chat models stream message chunks rather than bytes, so this
     * output parser handles serialization and encoding.
     */
    const parser = new HttpResponseOutputParser();

    const chain = RunnableSequence.from([
      {
        question: (input) => input.question,
        chat_history: (input) => input.chat_history,
        context: () => formatDocumentsAsString(docs),
      },
      prompt,
      model,
      parser,
    ]);

    // Convert the response into a friendly text-stream
    const stream = await chain.stream({
      chat_history: formattedPreviousMessages.join("\n"),
      question: currentMessageContent,
    });

    return new Response(stream.pipeThrough(createStreamDataTransformer()));
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
