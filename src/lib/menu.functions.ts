import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Item = z.object({
  category: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  price: z.number(),
  is_veg: z.boolean(),
});

export const parseMenuPdf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        storagePath: z.string().min(5).max(500),
        filename: z.string().max(200),
        extractedText: z.string().max(250_000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Only the dhaba owner can upload the menu.");

    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI service not configured");

    const { data: signed, error: signedError } = await context.supabase.storage
      .from("site-media")
      .createSignedUrl(data.storagePath, 600);
    if (signedError || !signed?.signedUrl)
      throw new Error("Could not securely open the uploaded PDF.");

    const documentResponse = await fetch(signed.signedUrl);
    if (!documentResponse.ok)
      throw new Error("The uploaded PDF could not be downloaded for reading.");
    const documentBytes = new Uint8Array(await documentResponse.arrayBuffer());
    const header = new TextDecoder().decode(documentBytes.slice(0, 5));
    if (header !== "%PDF-") throw new Error("This file does not contain a valid PDF document.");
    if (documentBytes.byteLength === 0) throw new Error("The uploaded PDF is empty.");

    const { extractMenuWithAi } = await import("./menu-ai.server");
    const localText = data.extractedText?.trim();
    let result: z.infer<typeof MenuOutput>;
    try {
      result = await extractMenuWithAi({
        key,
        filename: data.filename,
        extractedText: localText && localText.length >= 80 ? localText : undefined,
        pdfBytes: localText && localText.length >= 80 ? undefined : documentBytes,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      console.error("Menu extraction error", message);
      if (message.includes("429"))
        throw new Error("Too many requests — please try again in a minute.");
      if (message.includes("402"))
        throw new Error("AI credits exhausted — add credits in workspace settings.");
      if (message.toLowerCase().includes("too large"))
        throw new Error("This PDF is too complex to read at once. Split it into smaller PDFs.");
      if (message.includes("organis")) throw error;
      throw new Error(
        "Could not read this PDF. Try exporting it as a searchable PDF, then upload it again.",
      );
    }
    const parsed = MenuOutput.parse(result);
    return {
      items: parsed.items.map((i) => ({ ...i, description: i.description ?? null })),
    };
  });

const MenuOutput = z.object({ items: z.array(Item) });
