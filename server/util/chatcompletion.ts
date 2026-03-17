import OpenAI from "openai";

const client = new OpenAI();

const systemPrompt =
  "You write warm, natural notes for an application called Memoire. Given the title and description of a photo, write a short human message that feels personal, grounded, and sincere. The note should read as one cohesive standalone message, not a recap plus summary. Do not repeat the provided title or description verbatim, do not add labels or headings, keep it relevant to the memory, avoid sounding robotic, and do not use em dashes.";

export async function getChatCompletion(userInput: string) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await client.responses.create({
    model: "gpt-5",
    reasoning: { effort: "low" },
    input: [
      {
        role: "developer",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userInput,
      },
    ],
  });

  return response.output_text;
}
