import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Ctx = { supabase: { rpc: (fn: "has_role", args: { _user_id: string; _role: "owner" }) => PromiseLike<{ data: boolean | null }> }; userId: string };

async function assertOwner(context: Ctx) {
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "owner" });
  if (!data) throw new Error("Only the owner can manage staff.");
}

export const listStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertOwner(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roles, error } = await supabaseAdmin.from("user_roles").select("user_id, role");
    if (error) throw new Error(error.message);
    const ids = Array.from(new Set(roles.map((r) => r.user_id)));
    const staff = await Promise.all(
      ids.map(async (id) => {
        const { data } = await supabaseAdmin.auth.admin.getUserById(id);
        const rs = roles.filter((r) => r.user_id === id).map((r) => r.role);
        return { id, email: data.user?.email ?? "(deleted)", isOwner: rs.includes("owner") };
      }),
    );
    return staff.sort((a, b) => Number(b.isOwner) - Number(a.isOwner));
  });

export const addStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ email: z.string().trim().email().max(255), password: z.string().min(8).max(72) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let userId: string | undefined;
    const created = await supabaseAdmin.auth.admin.createUser({ email: data.email, password: data.password, email_confirm: true });
    if (created.error) {
      // Existing account: look it up and just grant access
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      userId = list?.users.find((u) => u.email?.toLowerCase() === data.email.toLowerCase())?.id;
      if (!userId) throw new Error(created.error.message);
    } else userId = created.data.user.id;
    const { error } = await supabaseAdmin.from("user_roles").upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context as unknown as Ctx);
    if (data.userId === context.userId) throw new Error("You can't remove yourself. Transfer ownership first.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const transferOwnership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertOwner(context as unknown as Ctx);
    if (data.userId === context.userId) return { ok: true };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: target } = await supabaseAdmin.from("user_roles").select("id").eq("user_id", data.userId).eq("role", "admin").maybeSingle();
    if (!target) throw new Error("Add this person as staff first.");
    const { error: e1 } = await supabaseAdmin.from("user_roles").insert({ user_id: data.userId, role: "owner" });
    if (e1) throw new Error(e1.message);
    const { error: e2 } = await supabaseAdmin.from("user_roles").delete().eq("user_id", context.userId).eq("role", "owner");
    if (e2) throw new Error(e2.message);
    return { ok: true };
  });
