import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClerkClient } from "@clerk/backend";

export const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL;

export const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_GENERATIVE_AI_API_KEY!
);

export const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});
