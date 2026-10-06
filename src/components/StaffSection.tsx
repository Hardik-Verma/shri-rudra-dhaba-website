import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Crown, Loader2, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listStaff, addStaff, removeStaff, transferOwnership } from "@/lib/staff.functions";

export function StaffSection({ meId }: { meId: string }) {
  const qc = useQueryClient();
  const list = useServerFn(listStaff);
  const add = useServerFn(addStaff);
  const remove = useServerFn(removeStaff);
  const transfer = useServerFn(transferOwnership);
  const staff = useQuery({ queryKey: ["staff"], queryFn: () => list() });
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try { await fn(); toast.success(ok); qc.invalidateQueries(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Something went wrong"); }
    finally { setBusy(false); }
  };

  return (
    <section className="space-y-3 rounded-2xl border border-primary/40 bg-card p-5">
      <h2 className="flex items-center gap-2 text-xl"><Crown className="size-5 text-primary" /> Staff & ownership</h2>
      <p className="text-sm text-muted-foreground">Staff can edit the menu and contact numbers. Only the owner can add or remove staff.</p>
      <form
        className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
        onSubmit={(e) => { e.preventDefault(); run(() => add({ data: { email, password: pw } }), "Staff added").then(() => { setEmail(""); setPw(""); }); }}
      >
        <Input type="email" required placeholder="Staff email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input type="text" required minLength={8} placeholder="Password (min 8)" value={pw} onChange={(e) => setPw(e.target.value)} />
        <Button variant="hero" disabled={busy}><UserPlus /> Add</Button>
      </form>
      {staff.isLoading ? <Loader2 className="animate-spin" /> : (
        <ul className="divide-y divide-border">
          {staff.data?.map((s) => (
            <li key={s.id} className="flex items-center gap-2 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate">{s.email}{s.id === meId && " (you)"}</span>
              {s.isOwner ? (
                <span className="flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary"><Crown className="size-3" /> Owner</span>
              ) : (
                <>
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => {
                    if (confirm(`Make ${s.email} the owner? You will become staff.`)) run(() => transfer({ data: { userId: s.id } }), "Ownership transferred");
                  }}>Make owner</Button>
                  <button aria-label="Remove" disabled={busy} onClick={() => {
                    if (confirm(`Remove ${s.email}?`)) run(() => remove({ data: { userId: s.id } }), "Staff removed");
                  }}><Trash2 className="size-4 text-destructive" /></button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
