import { useState } from "react";
import { Minus, Plus, ShoppingBag, X, ChefHat, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCart } from "@/lib/cart";
import { DHABA, rupee, waNumber } from "@/lib/dhaba";

export function CartDrawer({ whatsapp }: { whatsapp: string | null }) {
  const cart = useCart();
  const [open, setOpen] = useState(false);
  const [table, setTable] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [sentTable, setSentTable] = useState<string | null>(null);

  const wa = waNumber(whatsapp);

  function send() {
    const t = table.trim();
    if (!t) {
      setErr("Please enter your table number.");
      return;
    }
    if (t.length > 40) {
      setErr("Table number is too long.");
      return;
    }
    if (!wa) {
      setErr("Kitchen WhatsApp number isn't set yet. Please order at the counter.");
      return;
    }
    const lines = cart.lines.map((l) => `• ${l.name} x ${l.qty} = ₹${l.qty * l.price}`).join("\n");
    const msg = `🍽️ *NEW DINE-IN ORDER - ${DHABA.shortName}*
━━━━━━━━━━━━━━━━━━━
📍 *Table:* ${t}

🛒 *Items Ordered:*
${lines}

💰 *Bill Amount: ₹${cart.total}*
━━━━━━━━━━━━━━━━━━━
📝 *Note:* ${note.trim().slice(0, 300) || "None"}`;
    window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`, "_blank");
    cart.clear();
    setSentTable(t);
    setNote("");
    setErr("");
  }

  return (
    <>
      {cart.count > 0 && !open && (
        <div className="fixed inset-x-0 bottom-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:left-auto sm:right-5 sm:w-[430px]">
          <Button
            variant="hero"
            size="xl"
            className="w-full justify-between shadow-lg"
            onClick={() => setOpen(true)}
          >
            <span className="flex items-center gap-2">
              <ShoppingBag /> {cart.count} item{cart.count > 1 ? "s" : ""}
            </span>
            <span>View order · {rupee(cart.total)}</span>
          </Button>
        </div>
      )}

      {(open || sentTable) && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 backdrop-blur-sm sm:items-center"
          onClick={() => {
            setOpen(false);
            setSentTable(null);
          }}
        >
          <div
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-xl border border-border bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-lg sm:p-7 animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Your order"
          >
            {sentTable ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="mx-auto size-16 text-veg" />
                <h2 className="mt-4 text-3xl">Order Sent!</h2>
                <p className="mt-2 text-muted-foreground">
                  Your food is being prepared at{" "}
                  <span className="font-semibold text-primary">Table {sentTable}</span>
                </p>
                <Button
                  variant="hero"
                  size="xl"
                  className="mt-6 w-full"
                  onClick={() => {
                    setSentTable(null);
                    setOpen(false);
                  }}
                >
                  Back to menu
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl">Your Order</h2>
                  <Button
                    aria-label="Close"
                    title="Close order"
                    variant="ghost"
                    size="icon"
                    onClick={() => setOpen(false)}
                  >
                    <X className="size-5" />
                  </Button>
                </div>
                {cart.lines.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">Your plate is empty.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {cart.lines.map((l) => (
                      <li key={l.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{l.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {rupee(l.price)} × {l.qty} = {rupee(l.price * l.qty)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 rounded-full border border-border">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Remove one ${l.name}`}
                            onClick={() => cart.dec(l.id)}
                          >
                            <Minus className="size-4" />
                          </Button>
                          <span className="w-5 text-center font-semibold">{l.qty}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Add one more ${l.name}`}
                            onClick={() =>
                              cart.add({
                                ...l,
                                category: "",
                                description: null,
                                image_url: null,
                                is_veg: true,
                                available: true,
                                sort_order: 0,
                              })
                            }
                          >
                            <Plus className="size-4" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-lg">
                  <span className="text-muted-foreground">Bill Amount</span>
                  <span className="font-display text-2xl text-primary">{rupee(cart.total)}</span>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <Label htmlFor="table">Table Number *</Label>
                    <Input
                      id="table"
                      value={table}
                      maxLength={40}
                      onChange={(e) => {
                        setTable(e.target.value);
                        setErr("");
                      }}
                      placeholder="e.g. Table 4"
                      className="mt-1.5 h-12 text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="note">Cooking Note (optional)</Label>
                    <Textarea
                      id="note"
                      value={note}
                      maxLength={300}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="e.g. Extra butter, less spicy"
                      className="mt-1.5 text-base"
                      rows={2}
                    />
                  </div>
                  {err && (
                    <p role="alert" className="text-sm text-destructive">
                      {err}
                    </p>
                  )}
                  <Button
                    variant="whatsapp"
                    size="xl"
                    className="w-full"
                    disabled={cart.lines.length === 0}
                    onClick={send}
                  >
                    <ChefHat /> Send Order to Kitchen (WhatsApp)
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Dine-in only · Pay at the counter
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
