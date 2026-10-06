import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { FileUp, ImagePlus, LogOut, Loader2, Trash2, Plus, Save, Pencil, X } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { menuQuery, settingsQuery, galleryQuery } from "@/lib/data";
import { parseMenuPdf } from "@/lib/menu.functions";
import { StaffSection } from "@/components/StaffSection";
import { rupee } from "@/lib/dhaba";
import type { MenuItem } from "@/lib/data";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Owner Panel – Shri Rudra Dhaba" },
      {
        name: "description",
        content: "Owner panel to manage menu, phone and WhatsApp for Shri Rudra Dhaba.",
      },
      { property: "og:title", content: "Owner Panel – Shri Rudra Dhaba" },
      { property: "og:description", content: "Manage the dhaba menu and contact settings." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  if (!ready)
    return (
      <Center>
        <Loader2 className="animate-spin" />
      </Center>
    );
  if (!session) return <Login />;
  return <Panel userId={session.user.id} email={session.user.email ?? ""} />;
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="grid min-h-screen place-items-center px-4">{children}</div>;
}

function Login() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password: pw })
        : await supabase.auth.signUp({
            email,
            password: pw,
            options: { emailRedirectTo: `${window.location.origin}/admin` },
          });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (mode === "up") toast.success("Check your email to confirm your account, then sign in.");
  }
  return (
    <Center>
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6"
      >
        <h1 className="text-3xl">Owner Panel</h1>
        <p className="text-sm text-muted-foreground">
          Only the owner and staff added by the owner can access this panel.
        </p>
        <div>
          <Label>Email</Label>
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label>Password</Label>
          <Input
            type="password"
            required
            minLength={6}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <Button variant="hero" size="lg" className="w-full" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />}
          {mode === "in" ? "Sign in" : "Create account"}
        </Button>
        <button
          type="button"
          className="w-full text-sm text-primary"
          onClick={() => setMode(mode === "in" ? "up" : "in")}
        >
          {mode === "in" ? "First time? Create your account" : "Have an account? Sign in"}
        </button>
        <Link to="/" className="block text-center text-xs text-muted-foreground">
          ← Back to site
        </Link>
      </form>
    </Center>
  );
}

type Draft = {
  category: string;
  name: string;
  description: string | null;
  price: number;
  is_veg: boolean;
  image_url?: string | null;
};

async function prepareBannerImage(file: File) {
  if (!file.type.match(/^image\/(jpeg|png|webp)$/))
    throw new Error("Choose a JPG, PNG or WebP image.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Banner image must be under 8 MB.");
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Could not read this image."));
    reader.onerror = () => reject(new Error("Could not read this image."));
    reader.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const next = new Image();
    next.onload = () => resolve(next);
    next.onerror = () => reject(new Error("Could not open this image."));
    next.src = source;
  });
  const scale = Math.min(1, 1920 / image.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not prepare this image.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.8);
}

async function prepareFoodImage(file: File) {
  if (!file.type.match(/^image\/(jpeg|png|webp)$/))
    throw new Error("Choose a JPG, PNG or WebP image.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Food photo must be under 8 MB.");
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Could not read this image."));
    reader.onerror = () => reject(new Error("Could not read this image."));
    reader.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const next = new Image();
    next.onload = () => resolve(next);
    next.onerror = () => reject(new Error("Could not open this image."));
    next.src = source;
  });
  const scale = Math.min(1, 960 / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not prepare this image.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

async function prepareGalleryImage(file: File) {
  if (!file.type.match(/^image\/(jpeg|png|webp)$/))
    throw new Error("Choose a JPG, PNG or WebP image.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Gallery photo must be under 8 MB.");
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Could not read this image."));
    reader.onerror = () => reject(new Error("Could not read this image."));
    reader.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const next = new Image();
    next.onload = () => resolve(next);
    next.onerror = () => reject(new Error("Could not open this image."));
    next.src = source;
  });
  const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not prepare this image.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.78);
}

async function prepareLogoImage(file: File) {
  if (!file.type.match(/^image\/(jpeg|png|webp)$/))
    throw new Error("Choose a JPG, PNG or WebP image.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Logo must be under 8 MB.");
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Could not read this image."));
    reader.onerror = () => reject(new Error("Could not read this image."));
    reader.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const next = new Image();
    next.onload = () => resolve(next);
    next.onerror = () => reject(new Error("Could not open this image."));
    next.src = source;
  });
  const scale = Math.min(1, 512 / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not prepare this image.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  // Keep PNG for transparency, otherwise compress to JPEG.
  return file.type === "image/png"
    ? canvas.toDataURL("image/png")
    : canvas.toDataURL("image/jpeg", 0.85);
}

async function extractPdfText(file: File) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const workerUrl = (await import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) })
    .promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
  }
  return pages.join("\n").replace(/\s+/g, " ").trim().slice(0, 250_000);
}

function Panel({ userId, email }: { userId: string; email: string }) {
  const qc = useQueryClient();
  const role = useQuery({
    queryKey: ["is-admin", userId],
    queryFn: async () =>
      (await supabase.rpc("has_role", { _user_id: userId, _role: "admin" })).data === true,
  });
  const isOwner = useQuery({
    queryKey: ["is-owner", userId],
    queryFn: async () =>
      (await supabase.rpc("has_role", { _user_id: userId, _role: "owner" })).data === true,
  });
  const settings = useQuery(settingsQuery);
  const menu = useQuery(menuQuery);
  const gallery = useQuery(galleryQuery);
  const parse = useServerFn(parseMenuPdf);

  const [phone, setPhone] = useState("");
  const [wa, setWa] = useState("");
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [bannerVideoPath, setBannerVideoPath] = useState<string | null>(null);
  const [bannerVideoUrl, setBannerVideoUrl] = useState<string | null>(null);
  const [bannerEyebrow, setBannerEyebrow] = useState("");
  const [bannerHeading, setBannerHeading] = useState("");
  const [bannerText, setBannerText] = useState("");
  const [primaryButton, setPrimaryButton] = useState("");
  const [secondaryButton, setSecondaryButton] = useState("");
  const [aboutHeading, setAboutHeading] = useState("");
  const [aboutText, setAboutText] = useState("");
  const [aboutImage, setAboutImage] = useState<string | null>(null);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [preparingImage, setPreparingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  useEffect(() => {
    if (!settings.data) return;
    setPhone(settings.data.phone ?? "");
    setWa(settings.data.whatsapp ?? "");
    setBannerImage(settings.data.banner_image_url);
    setBannerVideoPath(settings.data.banner_video_path ?? null);
    setBannerVideoUrl(settings.data.banner_video_url ?? null);
    setBannerEyebrow(settings.data.banner_eyebrow);
    setBannerHeading(settings.data.banner_heading);
    setBannerText(settings.data.banner_text);
    setPrimaryButton(settings.data.banner_primary_button);
    setSecondaryButton(settings.data.banner_secondary_button);
    setAboutHeading(settings.data.about_heading ?? "");
    setAboutText(settings.data.about_text ?? "");
    setAboutImage(settings.data.about_image_url ?? null);
    setLogoImage(settings.data.logo_image_url ?? null);
  }, [settings.data]);

  const [parsing, setParsing] = useState(false);
  const [parseStage, setParseStage] = useState("");
  const [draft, setDraft] = useState<Draft[] | null>(null);
  const [newItem, setNewItem] = useState<Draft>({
    category: "Parathas",
    name: "",
    description: "",
    price: 0,
    is_veg: true,
  });
  const [newItemImage, setNewItemImage] = useState<string | null>(null);
  const [galleryCaption, setGalleryCaption] = useState("");
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);

  if (role.isLoading)
    return (
      <Center>
        <Loader2 className="animate-spin" />
      </Center>
    );
  if (!role.data)
    return (
      <Center>
        <div className="text-center">
          <p>This account is not the dhaba owner.</p>
          <Button className="mt-4" variant="outline" onClick={() => supabase.auth.signOut()}>
            Sign out
          </Button>
        </div>
      </Center>
    );

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["menu"] });
    qc.invalidateQueries({ queryKey: ["settings"] });
    qc.invalidateQueries({ queryKey: ["gallery"] });
  };

  async function saveSettings() {
    const { error } = await supabase
      .from("site_settings")
      .update({
        phone: phone.trim() || null,
        whatsapp: wa.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Contact settings saved");
    refresh();
  }

  async function saveBanner() {
    if (
      !bannerEyebrow.trim() ||
      !bannerHeading.trim() ||
      !bannerText.trim() ||
      !primaryButton.trim() ||
      !secondaryButton.trim()
    ) {
      toast.error("Complete all banner text fields.");
      return;
    }
    const { error } = await supabase
      .from("site_settings")
      .update({
        banner_image_url: bannerImage,
        banner_video_path: bannerVideoPath,
        banner_eyebrow: bannerEyebrow.trim(),
        banner_heading: bannerHeading.trim(),
        banner_text: bannerText.trim(),
        banner_primary_button: primaryButton.trim(),
        banner_secondary_button: secondaryButton.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Homepage banner saved");
    refresh();
  }

  async function saveLogo() {
    const { error } = await supabase
      .from("site_settings")
      .update({ logo_image_url: logoImage, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Logo saved");
    refresh();
  }

  async function saveAbout() {
    if (!aboutHeading.trim() || !aboutText.trim()) {
      toast.error("About heading and text are required.");
      return;
    }
    const { error } = await supabase
      .from("site_settings")
      .update({
        about_heading: aboutHeading.trim(),
        about_text: aboutText.trim(),
        about_image_url: aboutImage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("About section saved");
    refresh();
  }

  async function onBannerImage(file: File) {
    setPreparingImage(true);
    try {
      setBannerImage(await prepareBannerImage(file));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not prepare this image.");
    } finally {
      setPreparingImage(false);
    }
  }

  async function onAboutImage(file: File) {
    setPreparingImage(true);
    try {
      setAboutImage(await prepareGalleryImage(file));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not prepare this image.");
    } finally {
      setPreparingImage(false);
    }
  }

  async function onBannerVideo(file: File) {
    if (!file.type.startsWith("video/")) {
      toast.error("Please choose a video file.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Video must be under 50 MB. Keep it short for fast loading.");
      return;
    }
    setUploadingVideo(true);
    try {
      const path = `public-media/banner-${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]+/g, "-")}`;
      const { error } = await supabase.storage
        .from("site-media")
        .upload(path, file, { contentType: file.type, upsert: true });
      if (error) throw error;
      if (bannerVideoPath) await supabase.storage.from("site-media").remove([bannerVideoPath]);
      setBannerVideoPath(path);
      // Public-media paths use a permanent public URL (signed URLs expire).
      const { data: pub } = await supabase.storage.from("site-media").getPublicUrl(path);
      setBannerVideoUrl(pub.publicUrl || null);
      toast.success("Banner video uploaded — press Save banner to publish.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Video upload failed");
    } finally {
      setUploadingVideo(false);
    }
  }

  async function removeBannerVideo() {
    if (bannerVideoPath) await supabase.storage.from("site-media").remove([bannerVideoPath]);
    setBannerVideoPath(null);
    setBannerVideoUrl(null);
  }

  async function onGalleryUpload(file: File) {
    setUploadingGallery(true);
    try {
      const url = await prepareGalleryImage(file);
      const { error } = await supabase.from("gallery_media").insert({
        image_url: url,
        alt_text: "Shri Rudra Dhaba",
        caption: galleryCaption.trim() || null,
        sort_order: gallery.data?.length ?? 0,
      });
      if (error) throw error;
      setGalleryCaption("");
      toast.success("Photo added to gallery");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add photo");
    } finally {
      setUploadingGallery(false);
    }
  }

  async function onPdf(file: File) {
    if (file.type !== "application/pdf") {
      toast.error("Please choose a PDF file.");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error("PDF must be under 100 MB.");
      return;
    }
    setParsing(true);
    setParseStage("Reading text from PDF…");
    const storagePath = `menu-uploads/${userId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]+/g, "-")}`;
    try {
      const { error: uploadError } = await supabase.storage
        .from("site-media")
        .upload(storagePath, file, { contentType: "application/pdf" });
      if (uploadError) throw uploadError;
      let extractedText = "";
      try {
        extractedText = await extractPdfText(file);
      } catch {
        /* scanned menus use document reading below */
      }
      setParseStage(
        extractedText.length >= 80 ? "Organizing items and prices…" : "Reading scanned menu pages…",
      );
      const res = await parse({
        data: { storagePath, filename: file.name, extractedText: extractedText || undefined },
      });
      setDraft(res.items);
      toast.success(`Found ${res.items.length} items — review and publish.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to read PDF");
    } finally {
      await supabase.storage.from("site-media").remove([storagePath]);
      setParsing(false);
      setParseStage("");
    }
  }

  async function publishDraft() {
    if (!draft) return;
    const { error: delErr } = await supabase.from("menu_items").delete().not("id", "is", null);
    if (delErr) {
      toast.error(delErr.message);
      return;
    }
    const { error } = await supabase
      .from("menu_items")
      .insert(draft.map((d, i) => ({ ...d, sort_order: i })));
    if (error) {
      toast.error(error.message);
      return;
    }
    setDraft(null);
    toast.success("Menu published!");
    refresh();
  }

  async function addItem() {
    if (!newItem.name.trim() || newItem.price <= 0) {
      toast.error("Name and price are required.");
      return;
    }
    const { error } = await supabase.from("menu_items").insert({
      ...newItem,
      description: newItem.description?.trim() || null,
      image_url: newItemImage,
      sort_order: menu.data?.length ?? 0,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setNewItem({ ...newItem, name: "", description: "", price: 0 });
    setNewItemImage(null);
    refresh();
    toast.success("Menu item added");
  }

  async function saveEditedItem() {
    if (!editing || !editing.name.trim() || !editing.category.trim() || editing.price <= 0) {
      toast.error("Name, category and price are required.");
      return;
    }
    const { error } = await supabase
      .from("menu_items")
      .update({
        name: editing.name.trim(),
        category: editing.category.trim(),
        description: editing.description?.trim() || null,
        price: editing.price,
        is_veg: editing.is_veg,
        available: editing.available,
        image_url: editing.image_url,
      })
      .eq("id", editing.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setEditing(null);
    toast.success("Menu item saved");
    refresh();
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Owner Panel</h1>
          <p className="text-xs text-muted-foreground">{email}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/">View site</Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>
            <LogOut />
          </Button>
        </div>
      </header>
      {isOwner.data && <StaffSection meId={userId} />}

      <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <div>
          <h2 className="text-xl">Homepage banner — photo or video</h2>
          <p className="text-sm text-muted-foreground">
            Change the first photo/video and message visitors see. Video plays silently behind the
            photo.
          </p>
        </div>
        {bannerVideoUrl ? (
          <video
            src={bannerVideoUrl}
            controls
            playsInline
            muted
            loop
            className="aspect-video w-full rounded-lg bg-black"
          />
        ) : bannerImage ? (
          <img
            src={bannerImage}
            alt="Current homepage banner"
            className="aspect-[16/9] w-full rounded-lg object-cover"
          />
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/50 p-5 text-primary hover:bg-primary/5">
            {preparingImage ? (
              <>
                <Loader2 className="animate-spin" /> Preparing image…
              </>
            ) : (
              <>
                <ImagePlus /> {bannerImage ? "Replace photo" : "Choose photo"}
              </>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={preparingImage}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onBannerImage(file);
                e.target.value = "";
              }}
            />
          </label>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/50 p-5 text-primary hover:bg-primary/5">
            {uploadingVideo ? (
              <>
                <Loader2 className="animate-spin" /> Uploading video…
              </>
            ) : (
              <>
                <FileUp /> {bannerVideoPath ? "Replace video" : "Upload banner video"}
              </>
            )}
            <input
              type="file"
              accept="video/mp4,video/webm"
              className="hidden"
              disabled={uploadingVideo}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onBannerVideo(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {bannerImage && (
            <Button variant="ghost" size="sm" onClick={() => setBannerImage(null)}>
              <Trash2 /> Use original photo
            </Button>
          )}
          {bannerVideoPath && (
            <Button variant="ghost" size="sm" onClick={removeBannerVideo}>
              <Trash2 /> Remove video
            </Button>
          )}
        </div>
        <div>
          <Label>Small heading</Label>
          <Input
            maxLength={50}
            value={bannerEyebrow}
            onChange={(e) => setBannerEyebrow(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label>Main heading</Label>
          <Input
            maxLength={90}
            value={bannerHeading}
            onChange={(e) => setBannerHeading(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label>Supporting text</Label>
          <textarea
            maxLength={240}
            value={bannerText}
            onChange={(e) => setBannerText(e.target.value)}
            className="mt-1.5 min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Directions button</Label>
            <Input
              maxLength={28}
              value={primaryButton}
              onChange={(e) => setPrimaryButton(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Call / menu button</Label>
            <Input
              maxLength={28}
              value={secondaryButton}
              onChange={(e) => setSecondaryButton(e.target.value)}
              className="mt-1.5"
            />
          </div>
        </div>
        <Button variant="hero" onClick={saveBanner} disabled={preparingImage || uploadingVideo}>
          <Save /> Save banner
        </Button>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <div>
          <h2 className="text-xl">Logo</h2>
          <p className="text-sm text-muted-foreground">
            Shown in the site header. PNG keeps transparency. Remove it to go back to the monogram.
          </p>
        </div>
        {logoImage && (
          <img
            src={logoImage}
            alt="Restaurant logo"
            className="size-24 rounded-full border border-border object-cover"
          />
        )}
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/50 p-5 text-primary hover:bg-primary/5">
          {preparingImage ? (
            <>
              <Loader2 className="animate-spin" /> Preparing…
            </>
          ) : (
            <>
              <ImagePlus /> {logoImage ? "Replace logo" : "Choose logo"}
            </>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={preparingImage}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setPreparingImage(true);
              prepareLogoImage(file)
                .then(setLogoImage)
                .catch((error) =>
                  toast.error(
                    error instanceof Error ? error.message : "Could not prepare this image.",
                  ),
                )
                .finally(() => setPreparingImage(false));
              e.target.value = "";
            }}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button variant="hero" onClick={saveLogo} disabled={preparingImage}>
            <Save /> Save logo
          </Button>
          {logoImage && (
            <Button variant="ghost" size="sm" onClick={() => setLogoImage(null)}>
              <Trash2 /> Remove logo
            </Button>
          )}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <div>
          <h2 className="text-xl">About section — photo & story</h2>
          <p className="text-sm text-muted-foreground">Shown on the homepage and the About page.</p>
        </div>
        {aboutImage && (
          <img
            src={aboutImage}
            alt="About section"
            className="aspect-[16/9] w-full rounded-lg object-cover"
          />
        )}
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/50 p-5 text-primary hover:bg-primary/5">
          {preparingImage ? (
            <>
              <Loader2 className="animate-spin" /> Preparing…
            </>
          ) : (
            <>
              <ImagePlus /> {aboutImage ? "Replace about photo" : "Choose about photo"}
            </>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onAboutImage(file);
              e.target.value = "";
            }}
          />
        </label>
        {aboutImage && (
          <Button variant="ghost" size="sm" onClick={() => setAboutImage(null)}>
            <Trash2 /> Remove photo
          </Button>
        )}
        <div>
          <Label>About heading</Label>
          <Input
            maxLength={90}
            value={aboutHeading}
            onChange={(e) => setAboutHeading(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label>About text</Label>
          <textarea
            maxLength={600}
            value={aboutText}
            onChange={(e) => setAboutText(e.target.value)}
            className="mt-1.5 min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <Button variant="hero" onClick={saveAbout}>
          <Save /> Save about
        </Button>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <div>
          <h2 className="text-xl">Gallery photos ({gallery.data?.length ?? 0})</h2>
          <p className="text-sm text-muted-foreground">
            Photos appear on the homepage and the Gallery page.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            placeholder="Caption (optional)"
            value={galleryCaption}
            maxLength={120}
            onChange={(e) => setGalleryCaption(e.target.value)}
          />
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/50 p-4 text-primary hover:bg-primary/5">
            {uploadingGallery ? (
              <>
                <Loader2 className="animate-spin" /> Uploading…
              </>
            ) : (
              <>
                <ImagePlus /> Add photo
              </>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={uploadingGallery}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onGalleryUpload(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {gallery.data?.map((g) => (
            <div key={g.id} className="overflow-hidden rounded-lg border border-border">
              <img
                src={g.image_url}
                alt={g.alt_text}
                loading="lazy"
                className="aspect-square w-full object-cover"
              />
              <div className="flex items-center justify-between gap-2 p-2">
                <p className="truncate text-xs text-muted-foreground">
                  {g.caption || "No caption"}
                </p>
                <button
                  aria-label="Delete photo"
                  onClick={async () => {
                    await supabase.from("gallery_media").delete().eq("id", g.id);
                    refresh();
                  }}
                >
                  <Trash2 className="size-4 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <h2 className="text-xl">Contact</h2>
        <div>
          <Label>Phone (Call button)</Label>
          <Input
            inputMode="tel"
            placeholder="10-digit mobile"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label>Kitchen WhatsApp number (orders go here)</Label>
          <Input
            inputMode="tel"
            placeholder="10-digit mobile"
            value={wa}
            onChange={(e) => setWa(e.target.value)}
            className="mt-1.5"
          />
        </div>
        <Button variant="hero" onClick={saveSettings}>
          <Save /> Save
        </Button>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <h2 className="text-xl">Upload menu PDF</h2>
        <p className="text-sm text-muted-foreground">
          Upload a PDF up to 100 MB. We read every item and price automatically, then you review
          before publishing.
        </p>
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/50 p-6 text-primary hover:bg-primary/5">
          {parsing ? (
            <>
              <Loader2 className="animate-spin" /> {parseStage || "Reading menu…"}
            </>
          ) : (
            <>
              <FileUp /> Choose PDF
            </>
          )}
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            disabled={parsing}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPdf(f);
              e.target.value = "";
            }}
          />
        </label>
        {draft && (
          <div className="space-y-2">
            <p className="font-semibold">
              Review {draft.length} items — add descriptions before publishing
            </p>
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {draft.map((d, i) => (
                <div key={i} className="space-y-1 rounded-lg bg-muted p-2">
                  <div className="grid grid-cols-[1fr_5rem_auto] items-center gap-2">
                    <Input
                      value={d.name}
                      placeholder="Dish name"
                      onChange={(e) =>
                        setDraft(
                          draft.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)),
                        )
                      }
                      className="h-8"
                    />
                    <Input
                      type="number"
                      value={d.price}
                      onChange={(e) =>
                        setDraft(
                          draft.map((x, j) =>
                            j === i ? { ...x, price: Number(e.target.value) } : x,
                          ),
                        )
                      }
                      className="h-8"
                    />
                    <button
                      aria-label="Remove"
                      onClick={() => setDraft(draft.filter((_, j) => j !== i))}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Input
                      value={d.category}
                      placeholder="Category"
                      onChange={(e) =>
                        setDraft(
                          draft.map((x, j) => (j === i ? { ...x, category: e.target.value } : x)),
                        )
                      }
                      className="h-7 text-xs"
                    />
                    <Input
                      value={d.description ?? ""}
                      placeholder="Description (recommended)"
                      onChange={(e) =>
                        setDraft(
                          draft.map((x, j) =>
                            j === i ? { ...x, description: e.target.value } : x,
                          ),
                        )
                      }
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="hero" onClick={publishDraft}>
                Replace menu with these
              </Button>
              <Button variant="ghost" onClick={() => setDraft(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <h2 className="text-xl">Current menu ({menu.data?.length ?? 0})</h2>
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Item name"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
          />
          <Input
            placeholder="Category"
            value={newItem.category}
            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
          />
          <Input
            placeholder="Description"
            value={newItem.description ?? ""}
            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Price ₹"
            value={newItem.price || ""}
            onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
          />
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={newItem.is_veg}
              onCheckedChange={(v) => setNewItem({ ...newItem, is_veg: v })}
            />{" "}
            Veg
          </label>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-primary/60 p-2 text-sm text-primary">
            <ImagePlus className="size-4" /> {newItemImage ? "Photo ready ✓" : "Add photo"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  setNewItemImage(await prepareFoodImage(file));
                  toast.success("Photo ready — press Add item");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not prepare photo");
                }
                e.target.value = "";
              }}
            />
          </label>
          <Button variant="secondary" onClick={addItem} className="col-span-2">
            <Plus /> Add item
          </Button>
          {newItemImage && (
            <img
              src={newItemImage}
              alt="New dish preview"
              className="col-span-2 h-32 w-full rounded-md object-cover"
            />
          )}
        </div>
        <ul className="divide-y divide-border">
          {menu.data?.map((m) => (
            <li key={m.id} className="flex items-center gap-3 py-2 text-sm">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{m.name}</p>
                <p className="text-xs text-muted-foreground">
                  {m.category} · {rupee(m.price)} · {m.is_veg ? "Veg" : "Non-veg"}
                </p>
              </div>
              <Switch
                checked={m.available}
                aria-label="Available"
                onCheckedChange={async (v) => {
                  await supabase.from("menu_items").update({ available: v }).eq("id", m.id);
                  refresh();
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Edit ${m.name}`}
                onClick={() => setEditing(m)}
              >
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${m.name}`}
                onClick={async () => {
                  await supabase.from("menu_items").delete().eq("id", m.id);
                  refresh();
                }}
              >
                <Trash2 className="text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      </section>
      {editing && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Edit menu item"
        >
          <div className="max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-lg border border-border bg-card p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl">Edit menu item</h2>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close"
                onClick={() => setEditing(null)}
              >
                <X />
              </Button>
            </div>
            {editing.image_url && (
              <img
                src={editing.image_url}
                alt="Food preview"
                className="aspect-video w-full rounded-md object-cover"
              />
            )}
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-primary/60 p-4 text-primary">
              <ImagePlus /> {editing.image_url ? "Replace food photo" : "Add food photo"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    setEditing({ ...editing, image_url: await prepareFoodImage(file) });
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Could not prepare photo");
                  }
                  e.target.value = "";
                }}
              />
            </label>
            {editing.image_url && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing({ ...editing, image_url: null })}
              >
                <Trash2 /> Remove photo
              </Button>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Name</Label>
                <Input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Category</Label>
                <Input
                  value={editing.category}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <textarea
                value={editing.description ?? ""}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Add the real printed description"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Price ₹</Label>
                <Input
                  type="number"
                  min="1"
                  value={editing.price}
                  onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                />
              </div>
              <label className="flex items-center gap-2 pt-6 text-sm">
                <Switch
                  checked={editing.is_veg}
                  onCheckedChange={(v) => setEditing({ ...editing, is_veg: v })}
                />{" "}
                Veg item
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={editing.available}
                onCheckedChange={(v) => setEditing({ ...editing, available: v })}
              />{" "}
              Available today
            </label>
            <div className="flex gap-2">
              <Button variant="hero" onClick={saveEditedItem}>
                <Save /> Save item
              </Button>
              <Button variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
