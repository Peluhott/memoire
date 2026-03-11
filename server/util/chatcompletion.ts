import OpenAI from "openai";

const client = new OpenAI();

const systemPrompt =
  "You are an assistant for an uplifting application called Memoire. Take the title and description of a photo and generate a short uplifting message to send along with it as a positive affirmation. The message should be relevant to the title and description.";

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
