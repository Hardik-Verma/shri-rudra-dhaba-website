import { createOpenAI } from "@ai-sdk/openai";
import { NoObjectGeneratedError, Output, streamText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayRunIdFetch } from "./ai-run-id.server";

const MenuOutput = z.object({
  items: z.array(
    z.object({
      category: z.string(),
      name: z.string(),
      description: z.string().nullable(),
      price: z.number(),
      is_veg: z.boolean(),
    }),
  ),
});

const instructions = `Extract every restaurant menu item exactly as printed.
Never invent names, categories, descriptions, or prices. Use null when no description is printed.
Preserve printed categories. Split multiple sizes or portions into separate named items.
Set is_veg false only for egg, chicken, mutton, fish, or other explicitly non-vegetarian items.
Ignore page numbers, addresses, slogans, and decorative text.`;

export async function extractMenuWithAi(input: {
  key: string;
  filename: string;
  extractedText?: string | undefined;
  pdfBytes?: Uint8Array | undefined;
}) {
  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey: input.key,
    headers: { "Lovable-API-Key": input.key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  const content = input.extractedText
    ? [{ type: "text" as const, text: `${instructions}\n\nMENU TEXT:\n${input.extractedText}` }]
    : [
        { type: "text" as const, text: instructions },
        {
          type: "file" as const,
          data: input.pdfBytes ?? new Uint8Array(),
          mediaType: "application/pdf",
          filename: input.filename,
        },
      ];
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    messages: [{ role: "user", content }],
    output: Output.object({ schema: MenuOutput }),
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  try {
    return await result.output;
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      throw new Error(
        "The menu text was found, but its item list could not be organised. Please retry once.",
      );
    }
    throw error;
  }
}
